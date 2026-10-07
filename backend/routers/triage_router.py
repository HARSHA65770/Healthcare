import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.database import get_db, User, VitalsTimeseries, TriageRecord, HospitalRegistry
from ..models.schemas import (
    UrgencyLevel,
    VitalsIngestionRequest,
    IngestionResponse,
    DoctorAcknowledgeRequest
)
from ..services.safety_gate import evaluate_deterministic_safety
from ..services.llm_triage import llm_triage_engine
from ..services.websocket_hub import telemetry_hub
from ..services.dispatch_service import dispatch_service

router = APIRouter(prefix="/api/v1/triage", tags=["Triage"])


async def dispatch_critical_broadcast(payload: VitalsIngestionRequest, triage_eval, db: Session = None):
    """
    Immediate background broadcast to hospital WebSocket channels and SMS gateways (Section 6).
    """
    vitals_summary = f"BP: {payload.systolic_bp}/{payload.diastolic_bp} mmHg, SpO2: {payload.spo2}%, Glucose: {payload.glucose_mg_dl} mg/dL"
    
    # 1. Fire live WebSocket broadcast to all subscribed doctor dashboards
    await telemetry_hub.broadcast_critical_alert({
        "patient_id": payload.patient_id,
        "district_code": payload.district_code,
        "tier": triage_eval.tier,
        "tier_title": triage_eval.tier_title,
        "urgency": triage_eval.urgency_level.value,
        "esi_score": triage_eval.esi_score,
        "systolic": payload.systolic_bp,
        "diastolic": payload.diastolic_bp,
        "spo2": payload.spo2,
        "glucose": payload.glucose_mg_dl,
        "symptoms": payload.symptom_text,
        "safety_rule_triggered": triage_eval.safety_rule_triggered,
        "clinical_rationale": triage_eval.clinical_rationale,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, district_code=payload.district_code or "ALL")

    # 2. Dispatch automated SMS & IVR
    dispatch_service.send_emergency_sms(
        phone_hash=f"PATIENT-TEL-{payload.patient_id[:6]}",
        patient_name=f"Patient {payload.patient_id[:8]}",
        vitals_summary=vitals_summary,
        instructions="Emergency triage protocol activated."
    )

    if triage_eval.tier == 1:
        dispatch_service.trigger_twilio_ivr_dispatch(
            hospital_phone="+91-108-EMERGENCY",
            emergency_summary=f"Critical vital bound violation for patient {payload.patient_id[:8]}"
        )


def verify_clinical_safety(v: VitalsIngestionRequest) -> UrgencyLevel:
    """
    Deterministic safety evaluation matching Section 6 of Engineering Spec:
    if (v.systolic_bp and v.systolic_bp >= 180) or (v.diastolic_bp and v.diastolic_bp >= 120): return CRITICAL
    if v.spo2 and v.spo2 < 90: return CRITICAL
    if v.glucose_mg_dl and (v.glucose_mg_dl > 350 or v.glucose_mg_dl < 60): return CRITICAL
    if (v.systolic_bp and v.systolic_bp >= 140) or (v.spo2 and v.spo2 <= 93): return HIGH
    return NORMAL
    """
    if (v.systolic_bp and v.systolic_bp >= 180) or (v.diastolic_bp and v.diastolic_bp >= 120):
        return UrgencyLevel.CRITICAL
    if v.spo2 and v.spo2 < 90:
        return UrgencyLevel.CRITICAL
    if v.glucose_mg_dl and (v.glucose_mg_dl > 350 or v.glucose_mg_dl < 60):
        return UrgencyLevel.CRITICAL
    if (v.systolic_bp and v.systolic_bp >= 140) or (v.spo2 and v.spo2 <= 93):
        return UrgencyLevel.HIGH
    return UrgencyLevel.NORMAL


@router.post("/ingest", response_model=IngestionResponse)
async def ingest_patient_data(
    payload: VitalsIngestionRequest,
    bg_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Core backend ingestion & safety endpoint (Section 6).
    Enforces deterministic safety validations before executing asynchronous LLM triage tasks.
    """
    # 1. Deterministic safety verification
    urgency = verify_clinical_safety(payload)

    # 2. Complete Clinical Evaluation (Schema-locked AI + Safety Gate + Guardrails)
    triage_eval = llm_triage_engine.evaluate(payload)

    # Override urgency if symptoms raised it higher (e.g. crushing chest pain)
    if triage_eval.urgency_level == UrgencyLevel.CRITICAL:
        urgency = UrgencyLevel.CRITICAL

    # 3. Check or Create Patient user record
    user = db.query(User).filter(User.id == payload.patient_id).first()
    if not user:
        user = User(
            id=payload.patient_id,
            full_name=f"Rural Citizen #{payload.patient_id[:6]}",
            phone_hash=f"PH-{uuid.uuid4().hex[:8]}",
            village_code=payload.district_code or "VIL-ANDHRA-01",
            role="Patient",
            preferred_lang=payload.language_code
        )
        db.add(user)
        db.commit()

    # 4. Save to TimescaleDB Hypertable (VitalsTimeseries)
    vitals_entry = VitalsTimeseries(
        recorded_at=datetime.now(timezone.utc),
        user_id=user.id,
        systolic=payload.systolic_bp,
        diastolic=payload.diastolic_bp,
        spo2=payload.spo2,
        glucose=payload.glucose_mg_dl,
        urgency_level=urgency.value
    )
    db.add(vitals_entry)

    # 5. Save audit log to TriageRecord
    triage_record = TriageRecord(
        user_id=user.id,
        raw_transcript=payload.symptom_text or "",
        clinical_entities_json=str([e.model_dump() for e in triage_eval.entities]),
        esi_score=triage_eval.esi_score,
        hospital_acknowledged=False,
        ne_mo_filtered=bool(triage_eval.prescriptions_blocked)
    )
    db.add(triage_record)
    db.commit()

    # 6. Critical & High-risk dispatch actions
    task_id = f"task-{uuid.uuid4().hex[:8]}"
    if urgency == UrgencyLevel.CRITICAL or triage_eval.tier == 1:
        # Immediate background broadcast to hospital WebSocket channels and SMS gateways
        bg_tasks.add_task(dispatch_critical_broadcast, payload, triage_eval)
    elif triage_eval.tier == 2:
        # High Risk: Reserve PHC token & alert ASHA worker
        dispatch_service.reserve_phc_token(user.id, user.village_code, triage_eval.tier)
        dispatch_service.alert_asha_worker(user.village_code, user.full_name, payload.symptom_text or "High risk vitals")
        # Notify doctor board of high-risk case
        bg_tasks.add_task(telemetry_hub.broadcast_update, "NEW_HIGH_RISK_CASE", {
            "patient_id": user.id,
            "tier": triage_eval.tier,
            "summary": triage_eval.clinical_rationale,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    # 7. Generate offline SMS link fallback (Section 10)
    offline_sms_link = llm_triage_engine.generate_offline_sms_link(
        payload.patient_id,
        payload,
        triage_eval.tier
    )

    return IngestionResponse(
        status="processed",
        urgency=urgency,
        tier=triage_eval.tier,
        task_id=task_id,
        patient_id=payload.patient_id,
        timestamp=datetime.now(timezone.utc),
        triage=triage_eval,
        offline_fallback_sms=offline_sms_link
    )


@router.get("/active-triage")
def get_active_triage_cases(db: Session = Depends(get_db)):
    """
    Returns live list of active triage cases for the hospital doctor dashboard.
    """
    records = db.query(TriageRecord, User, VitalsTimeseries).\
        join(User, TriageRecord.user_id == User.id).\
        outerjoin(VitalsTimeseries, VitalsTimeseries.user_id == User.id).\
        order_by(TriageRecord.created_at.desc()).\
        limit(50).\
        all()

    results = []
    seen_records = set()
    for rec, usr, vit in records:
        if rec.id in seen_records:
            continue
        seen_records.add(rec.id)
        results.append({
            "id": rec.id,
            "patient_id": usr.id,
            "patient_name": usr.full_name,
            "village_code": usr.village_code,
            "created_at": rec.created_at.isoformat() if rec.created_at else None,
            "esi_score": rec.esi_score,
            "raw_transcript": rec.raw_transcript,
            "clinical_entities_json": rec.clinical_entities_json,
            "hospital_acknowledged": rec.hospital_acknowledged,
            "doctor_notes": rec.doctor_notes,
            "ne_mo_filtered": rec.ne_mo_filtered,
            "latest_vitals": {
                "systolic": vit.systolic if vit else None,
                "diastolic": vit.diastolic if vit else None,
                "spo2": vit.spo2 if vit else None,
                "glucose": vit.glucose if vit else None,
                "urgency_level": vit.urgency_level if vit else "NORMAL"
            } if vit else None
        })

    return results


@router.post("/acknowledge")
async def acknowledge_triage_record(
    req: DoctorAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    """
    Doctor acknowledgment or dispatch command from the hospital portal.
    """
    record = db.query(TriageRecord).filter(TriageRecord.id == req.record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Triage record not found")

    record.hospital_acknowledged = True
    if req.doctor_notes:
        record.doctor_notes = req.doctor_notes
    db.commit()

    # Broadcast update to connected doctor screens
    await telemetry_hub.broadcast_update("RECORD_ACKNOWLEDGED", {
        "record_id": req.record_id,
        "action": req.action_type,
        "notes": req.doctor_notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {"status": "success", "record_id": req.record_id, "acknowledged": True}
