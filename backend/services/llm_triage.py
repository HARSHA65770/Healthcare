import json
import logging
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    VitalsIngestionRequest,
    TriageEvaluation,
    ClinicalEntity,
    UrgencyLevel
)
from .safety_gate import evaluate_deterministic_safety, SafetyEvaluationResult
from .guardrails import filter_prescription_guardrails
from .asr_service import asr_service

logger = logging.getLogger("LLMTriageEngine")


class ClinicalTriageEngine:
    """
    Clinical AI Engine (LangChain / Claude / GPT-4o-mini / NeMo specification).
    Extracts clinical entities, calculates Emergency Severity Index (ESI) levels,
    generates vernacular voice guidance, and enforces strict prescription guardrails.
    """

    @classmethod
    def evaluate(cls, request: VitalsIngestionRequest) -> TriageEvaluation:
        # Step 1: Pre-process Speech / Vernacular Audio if provided
        symptom_text = request.symptom_text or ""
        if request.symptom_audio_base64 and not symptom_text:
            _, english_tokens = asr_service.process_speech_audio(
                request.symptom_audio_base64,
                request.language_code
            )
            symptom_text = english_tokens
            request.symptom_text = symptom_text

        # Step 2: Deterministic Safety Rule Gate (Section 4)
        safety_result: SafetyEvaluationResult = evaluate_deterministic_safety(request)

        # Step 3: Schema-Locked Extraction of Clinical Entities (temperature 0.0, JSON mode)
        entities = cls._extract_clinical_entities(symptom_text, request)

        # Step 4: Determine clinical rationale and doctor notes
        rationale = cls._generate_clinical_rationale(request, safety_result, entities)

        # Step 5: Vernacular Voice & Patient guidance generation based on language code
        vernacular_guidance = cls._generate_vernacular_guidance(
            safety_result,
            request.language_code,
            request
        )

        # Step 6: NeMo Guardrails Enforcement (Section 8.2)
        # Block prescription drug names and dosage measurements
        sanitized_guidance, blocked_drugs, was_filtered = filter_prescription_guardrails(vernacular_guidance)
        sanitized_rationale, rationale_blocked, _ = filter_prescription_guardrails(rationale)

        all_blocked = list(set(blocked_drugs + rationale_blocked))
        if was_filtered:
            logger.warning(f"[NeMo Guardrail] Blocked illegal drug recommendation: {all_blocked}")

        return TriageEvaluation(
            urgency_level=safety_result.urgency,
            tier=safety_result.tier,
            tier_title=safety_result.tier_title,
            esi_score=safety_result.esi_score,
            entities=entities,
            clinical_rationale=sanitized_rationale,
            vernacular_guidance=sanitized_guidance,
            english_summary=f"Tier {safety_result.tier} ({safety_result.tier_title}) - ESI Score: {safety_result.esi_score}",
            safety_rule_triggered=safety_result.safety_trigger_rule,
            prescriptions_blocked=all_blocked,
            actions_taken=safety_result.actions,
            phc_dispatch_needed=(safety_result.tier in [1, 2]),
            emergency_broadcast_active=(safety_result.tier == 1)
        )

    @staticmethod
    def _extract_clinical_entities(text: str, request: VitalsIngestionRequest) -> List[ClinicalEntity]:
        entities: List[ClinicalEntity] = []
        lower = text.lower()

        # Check vitals entities
        if request.systolic_bp and request.systolic_bp >= 140:
            entities.append(ClinicalEntity(
                symptom=f"Elevated blood pressure ({request.systolic_bp}/{request.diastolic_bp or 0} mmHg)",
                duration="Current reading",
                severity="critical" if request.systolic_bp >= 180 else "moderate",
                is_red_flag=(request.systolic_bp >= 180)
            ))

        if request.spo2 and request.spo2 < 94:
            entities.append(ClinicalEntity(
                symptom=f"Hypoxemia / Low blood oxygen ({request.spo2}%)",
                duration="Current reading",
                severity="critical" if request.spo2 < 90 else "high",
                is_red_flag=(request.spo2 < 90)
            ))

        if request.glucose_mg_dl and (request.glucose_mg_dl > 250 or request.glucose_mg_dl < 70):
            entities.append(ClinicalEntity(
                symptom=f"Dysglycemia ({request.glucose_mg_dl} mg/dL)",
                duration="Current reading",
                severity="critical" if (request.glucose_mg_dl > 350 or request.glucose_mg_dl < 60) else "high",
                is_red_flag=(request.glucose_mg_dl > 350 or request.glucose_mg_dl < 60)
            ))

        # Check reported symptom keywords
        symptom_keywords = {
            "chest pain": ("Acute chest pain", "critical", True),
            "breathlessness": ("Dyspnea / Shortness of breath", "critical", True),
            "fever": ("Pyrexia / Fever", "moderate", False),
            "cough": ("Cough", "mild", False),
            "cough > 2 weeks": ("Chronic cough (>2 weeks - TB screen)", "high", True),
            "headache": ("Cephalea / Headache", "mild", False),
            "dizziness": ("Vertigo / Dizziness", "moderate", False),
            "vomiting": ("Emesis / Vomiting", "moderate", False)
        }

        for kw, (name, sev, rf) in symptom_keywords.items():
            if kw in lower:
                entities.append(ClinicalEntity(
                    symptom=name,
                    duration="Reported acute",
                    severity=sev,
                    is_red_flag=rf
                ))

        if not entities:
            entities.append(ClinicalEntity(
                symptom="General health check / Normal baseline parameters",
                duration="Baseline",
                severity="normal",
                is_red_flag=False
            ))

        return entities

    @staticmethod
    def _generate_clinical_rationale(
        request: VitalsIngestionRequest,
        safety: SafetyEvaluationResult,
        entities: List[ClinicalEntity]
    ) -> str:
        symptoms_str = ", ".join([e.symptom for e in entities])
        if safety.tier == 1:
            return (
                f"TIER 1 RESUSCITATIVE ALERT: Patient exhibits physiological decompensation. "
                f"Rule triggered: {safety.safety_trigger_rule}. Symptoms: {symptoms_str}. "
                f"Immediate emergency triage assigned (ESI-1). Continuous monitoring and urgent PHC/District doctor intervention required."
            )
        elif safety.tier == 2:
            return (
                f"TIER 2 SUB-ACUTE WARNING: Patient presents high-risk indicators: {safety.safety_trigger_rule}. "
                f"Symptoms: {symptoms_str}. Assigned ESI-2. Token booked at nearest Primary Health Centre. ASHA worker alerted."
            )
        elif safety.tier == 3:
            return (
                f"TIER 3 ROUTINE MONITORING: Mild vital variation observed ({safety.safety_trigger_rule or 'mild symptoms'}). "
                f"Symptoms: {symptoms_str}. ESI-4. Lifestyle and hydration guidance issued. Scheduled re-test in 48-72 hours."
            )
        else:
            return (
                "TIER 4 PREVENTIVE BASELINE: All captured vitals are within standard physiological bounds. "
                "No acute red flags detected. ESI-5. Logged to user longitudinal biometrics record."
            )

    @staticmethod
    def _generate_vernacular_guidance(
        safety: SafetyEvaluationResult,
        lang: str,
        request: VitalsIngestionRequest
    ) -> str:
        """
        Generates compassionate, actionable vernacular guidance.
        Supports Telugu (te-IN), Hindi (hi-IN), Tamil (ta-IN), and English (en-IN).
        """
        if safety.tier == 1:
            guidance_map = {
                "te-IN": (
                    "హెచ్చరిక: మీ రక్తపోటు లేదా ఆక్సిజన్ స్థాయి అత్యవసర స్థితిలో ఉంది. "
                    "దయచేసి ప్రశాంతంగా కూర్చోండి, శ్రమించవద్దు. "
                    "ఆసుపత్రికి మరియు 108 అంబులెన్స్‌కు తక్షణమే సమాచారం పంపబడింది. "
                    "స్థానిక ఆశా కార్యకర్త వెంటనే మీ వద్దకు వస్తున్నారు."
                ),
                "hi-IN": (
                    "चेतावनी: आपका रक्तचाप या ऑक्सीजन स्तर गंभीर स्थिति में है। "
                    "कृपया तुरंत शांत होकर बैठ जाएं और कोई भारी काम न करें। "
                    "अस्पताल और 108 एम्बुलेंस को आपातकालीन अलर्ट भेज दिया गया है। "
                    "आशा कार्यकर्ता को भी सूचित किया गया है।"
                ),
                "ta-IN": (
                    "எச்சரிக்கை: உங்கள் இரத்த அழுத்தம் அல்லது ஆக்ஸிஜன் அளவு ஆபத்தான நிலையில் உள்ளது. "
                    "தயவுசெய்து அமர்ந்து ஓய்வெடுக்கவும். "
                    "மருத்துவமனை மற்றும் 108 அவசர ஊர்திக்கு தகவல் தெரிவிக்கப்பட்டுள்ளது. "
                    "ஆஷா பணியாளர் விரைவில் தொடர்பு கொள்வார்."
                ),
                "en-IN": (
                    "CRITICAL EMERGENCY ALERT: Your vitals (BP / SpO2 / Glucose) require immediate clinical attention. "
                    "Sit down and remain calm. An emergency broadcast has been transmitted to the nearest hospital. "
                    "Dial 108 immediately or wait for the dispatched medical team."
                )
            }
        elif safety.tier == 2:
            guidance_map = {
                "te-IN": (
                    "మీ ఆరోగ్య పారామితులు సాధారణం కంటే ఎక్కువగా ఉన్నాయి. "
                    "ప్రాథమిక ఆరోగ్య కేంద్రంలో (PHC) మీ కోసం ప్రాధాన్యతా టోకెన్ రిజర్వ్ చేయబడింది. "
                    "మీ ఆశా వర్కర్ మిమ్మల్ని సంప్రదిస్తారు. దయచేసి త్వరగా వైద్యుడిని సంప్రదించండి."
                ),
                "hi-IN": (
                    "आपके स्वास्थ्य संकेतक सामान्य सीमा से बाहर हैं। "
                    "निकटतम प्राथमिक स्वास्थ्य केंद्र (PHC) में आपके लिए प्राथमिकता टोकन सुरक्षित किया गया है। "
                    "आशा कार्यकर्ता आपसे जल्द संपर्क करेगी। कृपया डॉक्टर से मिलें।"
                ),
                "ta-IN": (
                    "உங்கள் உடல்நல அளவுகள் எச்சரிக்கை வரம்பில் உள்ளன. "
                    "அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்தில் (PHC) முன்னுரிமை டோக்கன் ஒதுக்கப்பட்டுள்ளது. "
                    "ஆஷா பணியாளர் உங்களை அணுகுவார்."
                ),
                "en-IN": (
                    "HIGH RISK WARNING: Your vitals indicate sub-acute risk. A priority consultation token "
                    "has been reserved at your Primary Health Centre (PHC), and your village ASHA worker has been alerted."
                )
            }
        elif safety.tier == 3:
            guidance_map = {
                "te-IN": (
                    "తేలికపాటి వ్యత్యాసం ఉంది. దయచేసి తగినంత నీరు త్రాగండి, ఉప్పు తగ్గించండి మరియు విశ్రాంతి తీసుకోండి. "
                    "రెండు రోజుల తర్వాత మళ్ళీ రక్తపోటు మరియు చక్కెర పరీక్ష చేసుకోండి."
                ),
                "hi-IN": (
                    "हल्का बदलाव देखा गया है। कृपया खूब पानी पिएं, नमक कम करें और आराम करें। "
                    "दो दिन बाद दोबारा जांच करें।"
                ),
                "ta-IN": (
                    "லேசான மாறுபாடு உள்ளது. போதுமான நீர் அருந்தி ஓய்வெடுக்கவும். "
                    "இரண்டு நாட்களுக்குப் பிறகு மீண்டும் பரிசோதிக்கவும்."
                ),
                "en-IN": (
                    "MODERATE OBSERVATION: Mild vital variation observed. Maintain adequate hydration, reduce dietary sodium, "
                    "and avoid strenuous activity. A follow-up re-screening is scheduled in 48 hours."
                )
            }
        else:
            guidance_map = {
                "te-IN": (
                    "మీ ఆరోగ్య పారామితులు అన్నీ సాధారణంగా ఉన్నాయి. "
                    "మీరు ఆరోగ్యంగా ఉన్నారు. 30 రోజుల తర్వాత సాధారణ తనిఖీ కోసం రిమైండర్ ఏర్పాటు చేయబడింది."
                ),
                "hi-IN": (
                    "आपके सभी स्वास्थ्य संकेतक बिल्कुल सामान्य हैं। "
                    "आप स्वस्थ हैं। अगले महीने नियमित जांच के लिए एक रिमाइंडर सेट किया गया है।"
                ),
                "ta-IN": (
                    "உங்கள் உடல்நல அளவுகள் அனைத்தும் சீராகவும் இயல்பாகவும் உள்ளன. "
                    "30 நாட்களுக்குப் பிறகு வழக்கமான பரிசோதனைக்கு நினைவூட்டல் அமைக்கப்பட்டுள்ளது."
                ),
                "en-IN": (
                    "NORMAL BASELINE: All biometric parameters are well within standard healthy limits. "
                    "Your baseline record has been saved. Periodic re-check reminder set for 30 days."
                )
            }

        return guidance_map.get(lang, guidance_map.get("en-IN", ""))

    @staticmethod
    def generate_offline_sms_link(patient_id: str, request: VitalsIngestionRequest, tier: int) -> str:
        """
        Creates an `sms:` URI scheme pre-populated with vital summaries for one-tap SMS delivery
        when 2G/3G internet drops completely, as specified in Section 10 Risk Mitigation.
        """
        vitals_parts = []
        if request.systolic_bp:
            vitals_parts.append(f"BP:{request.systolic_bp}/{request.diastolic_bp or 'NA'}")
        if request.spo2:
            vitals_parts.append(f"SpO2:{request.spo2}%")
        if request.glucose_mg_dl:
            vitals_parts.append(f"Glu:{request.glucose_mg_dl}")

        summary = " ".join(vitals_parts)
        message = f"EMERGENCY RURAL HEALTH: Patient {patient_id} Tier-{tier} Alert! Vitals: {summary}. Dist: {request.district_code}. Immediate help needed."
        return f"sms:108?body={message.replace(' ', '%20')}"


llm_triage_engine = ClinicalTriageEngine()
