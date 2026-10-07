import re
from typing import Tuple, List, Optional
from ..models.schemas import UrgencyLevel, VitalsIngestionRequest


class SafetyEvaluationResult:
    def __init__(
        self,
        urgency: UrgencyLevel,
        tier: int,
        tier_title: str,
        esi_score: int,
        safety_trigger_rule: Optional[str],
        actions: List[str],
        red_flags: List[str]
    ):
        self.urgency = urgency
        self.tier = tier
        self.tier_title = tier_title
        self.esi_score = esi_score
        self.safety_trigger_rule = safety_trigger_rule
        self.actions = actions
        self.red_flags = red_flags


def evaluate_deterministic_safety(payload: VitalsIngestionRequest) -> SafetyEvaluationResult:
    """
    Enforces deterministic safety rules strictly following Section 4 of the Engineering Spec.
    High-risk vital violations trigger immediate deterministic safety bypass.
    """
    symptoms = (payload.symptom_text or "").lower()
    red_flags: List[str] = []
    actions: List[str] = []

    # =========================================================================
    # TIER 1: Resuscitative Emergency (ESI 1)
    # Thresholds:
    # - Systolic BP >= 180 or Diastolic >= 120 mmHg
    # - SpO2 < 90%
    # - Glucose > 350 mg/dL or < 60 mg/dL
    # - Acute crushing chest pain / severe unresponsiveness
    # =========================================================================
    is_tier_1 = False
    tier_1_reasons = []

    if payload.systolic_bp is not None and payload.systolic_bp >= 180:
        is_tier_1 = True
        tier_1_reasons.append(f"Hypertensive Crisis: Systolic BP {payload.systolic_bp} mmHg >= 180")
    if payload.diastolic_bp is not None and payload.diastolic_bp >= 120:
        is_tier_1 = True
        tier_1_reasons.append(f"Hypertensive Crisis: Diastolic BP {payload.diastolic_bp} mmHg >= 120")
    if payload.spo2 is not None and payload.spo2 < 90:
        is_tier_1 = True
        tier_1_reasons.append(f"Critical Hypoxemia: SpO2 {payload.spo2}% < 90%")
    if payload.glucose_mg_dl is not None:
        if payload.glucose_mg_dl > 350:
            is_tier_1 = True
            tier_1_reasons.append(f"Hyperglycemic Crisis: Glucose {payload.glucose_mg_dl} mg/dL > 350")
        elif payload.glucose_mg_dl < 60:
            is_tier_1 = True
            tier_1_reasons.append(f"Severe Hypoglycemia: Glucose {payload.glucose_mg_dl} mg/dL < 60")

    chest_pain_keywords = ["crushing chest pain", "chest tightness", "radiating to left arm", "severe breathlessness", "unconscious", "gasping"]
    for kw in chest_pain_keywords:
        if kw in symptoms:
            is_tier_1 = True
            tier_1_reasons.append(f"Cardiovascular Red-Flag: '{kw}' reported")
            break

    if is_tier_1:
        trigger_desc = " | ".join(tier_1_reasons)
        return SafetyEvaluationResult(
            urgency=UrgencyLevel.CRITICAL,
            tier=1,
            tier_title="Resuscitative Emergency",
            esi_score=1,
            safety_trigger_rule=trigger_desc,
            actions=[
                "Bypass LLM waiting queue",
                "Instant WebSocket broadcast to hospital emergency board",
                "Trigger Twilio/Gupshup automated IVR/SMS emergency dispatch",
                "Display emergency browser action instructions & instant 108 dialer"
            ],
            red_flags=tier_1_reasons
        )

    # =========================================================================
    # TIER 2: High Risk / Sub-Acute (ESI 2-3)
    # Thresholds:
    # - Systolic BP 140–179 mmHg
    # - SpO2 90–93%
    # - Fever persisting > 3 days
    # - Hemoptysis or chronic cough > 2 weeks (TB warning)
    # - Severe pregnancy headaches (Preeclampsia risk)
    # =========================================================================
    is_tier_2 = False
    tier_2_reasons = []

    if payload.systolic_bp is not None and 140 <= payload.systolic_bp <= 179:
        is_tier_2 = True
        tier_2_reasons.append(f"Stage 2 Hypertension: Systolic BP {payload.systolic_bp} mmHg (140-179)")
    if payload.diastolic_bp is not None and 90 <= payload.diastolic_bp <= 119:
        is_tier_2 = True
        tier_2_reasons.append(f"Stage 2 Diastolic Elevation: Diastolic BP {payload.diastolic_bp} mmHg (90-119)")
    if payload.spo2 is not None and 90 <= payload.spo2 <= 93:
        is_tier_2 = True
        tier_2_reasons.append(f"Sub-acute respiratory decline: SpO2 {payload.spo2}% (90-93%)")

    # Symptom checks for chronic cough / hemoptysis / persistent fever / pregnancy headache
    if any(k in symptoms for k in ["cough 2 weeks", "cough > 2 weeks", "coughing blood", "hemoptysis", "blood in sputum", "tb"]):
        is_tier_2 = True
        tier_2_reasons.append("Tuberculosis Warning: Chronic cough > 2 weeks or hemoptysis")
    if any(k in symptoms for k in ["fever 3 days", "fever > 3 days", "fever 4 days", "fever 5 days", "persistent fever"]):
        is_tier_2 = True
        tier_2_reasons.append("Prolonged Pyrexia: High fever persisting > 3 days")
    if any(k in symptoms for k in ["pregnancy headache", "pregnant severe headache", "swollen feet pregnancy"]):
        is_tier_2 = True
        tier_2_reasons.append("Obstetric Danger: Severe pregnancy headache / preeclampsia alert")

    if is_tier_2:
        trigger_desc = " | ".join(tier_2_reasons)
        return SafetyEvaluationResult(
            urgency=UrgencyLevel.HIGH,
            tier=2,
            tier_title="High Risk / Sub-Acute",
            esi_score=2,
            safety_trigger_rule=trigger_desc,
            actions=[
                "Log encounter in TimescaleDB with HIGH priority tag",
                "Reserve priority consultation token at nearest Primary Health Centre (PHC)",
                "Alert assigned ASHA community field worker with patient GPS/village code"
            ],
            red_flags=tier_2_reasons
        )

    # =========================================================================
    # TIER 3: Moderate Risk / Routine Monitoring (ESI 4)
    # Thresholds:
    # - Mild vital drift (Systolic 125–139, Diastolic 80–89, Glucose 140–200)
    # - Non-severe seasonal fever, general fatigue, mild joint inflammation
    # =========================================================================
    is_tier_3 = False
    tier_3_reasons = []

    if payload.systolic_bp is not None and 125 <= payload.systolic_bp <= 139:
        is_tier_3 = True
        tier_3_reasons.append(f"Pre-hypertensive drift: Systolic BP {payload.systolic_bp} mmHg")
    if payload.glucose_mg_dl is not None and 140 <= payload.glucose_mg_dl <= 200:
        is_tier_3 = True
        tier_3_reasons.append(f"Impaired fasting/random glucose: {payload.glucose_mg_dl} mg/dL")
    if any(k in symptoms for k in ["fever", "mild cold", "fatigue", "tired", "joint pain", "body ache", "cough"]):
        is_tier_3 = True
        tier_3_reasons.append("Non-severe acute symptomatic complaint")

    if is_tier_3:
        trigger_desc = " | ".join(tier_3_reasons)
        return SafetyEvaluationResult(
            urgency=UrgencyLevel.MODERATE,
            tier=3,
            tier_title="Moderate Risk / Routine Monitoring",
            esi_score=4,
            safety_trigger_rule=trigger_desc,
            actions=[
                "Schedule automatic re-screening checkup in 48-72 hours",
                "Generate vernacular dietary and hydration recommendations via Web Audio & WhatsApp"
            ],
            red_flags=tier_3_reasons
        )

    # =========================================================================
    # TIER 4: Preventive Baseline (ESI 5)
    # Thresholds:
    # - All vital parameters within standard bounds; zero red-flag symptoms reported
    # =========================================================================
    return SafetyEvaluationResult(
        urgency=UrgencyLevel.NORMAL,
        tier=4,
        tier_title="Preventive Baseline",
        esi_score=5,
        safety_trigger_rule=None,
        actions=[
            "Confirm normal health status",
            "Store longitudinal biometric baseline in TimescaleDB",
            "Set 30-day periodic re-check reminder"
        ],
        red_flags=[]
    )
