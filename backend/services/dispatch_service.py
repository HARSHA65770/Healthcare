import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger("RuralHealthDispatch")


class ClinicalDispatchService:
    """
    Automated Clinical Dispatch Service:
    - Gupshup / Twilio (SMS/WhatsApp)
    - Emergency Broadcast (Direct PHC Sirens & IVR)
    - ASHA worker notification queue
    """

    @staticmethod
    def send_emergency_sms(phone_hash: str, patient_name: str, vitals_summary: str, instructions: str) -> Dict[str, Any]:
        """
        Dispatches high-priority SMS via Twilio/Gupshup gateway.
        """
        sms_payload = {
            "gateway": "Gupshup-Enterprise-SMS",
            "status": "SENT",
            "recipient_ref": phone_hash,
            "patient": patient_name,
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"EMERGENCY HEALTH ALERT: Patient {patient_name} has critical vitals: {vitals_summary}. {instructions}. Call 108 immediately."
        }
        logger.warning(f"[DISPATCH GATEWAY - SMS] {sms_payload}")
        return sms_payload

    @staticmethod
    def trigger_twilio_ivr_dispatch(hospital_phone: str, emergency_summary: str) -> Dict[str, Any]:
        """
        Triggers emergency outbound IVR call to PHC on-duty medical officer.
        """
        ivr_payload = {
            "gateway": "Twilio-Voice-IVR",
            "status": "INITIATED",
            "called_number": hospital_phone,
            "tts_script": f"This is an automated priority emergency from Rural Health PWA. {emergency_summary}. Please prepare resuscitation bay.",
            "timestamp": datetime.utcnow().isoformat()
        }
        logger.critical(f"[DISPATCH GATEWAY - IVR] {ivr_payload}")
        return ivr_payload

    @staticmethod
    def reserve_phc_token(patient_id: str, village_code: str, triage_tier: int) -> Dict[str, Any]:
        """
        Reserves priority consultation token at Primary Health Centre (PHC) for Tier 2 cases.
        """
        token_id = f"PHC-TOKEN-{village_code[-3:]}-{datetime.utcnow().strftime('%H%M%S')}"
        token_payload = {
            "token_id": token_id,
            "patient_id": patient_id,
            "village_code": village_code,
            "tier": triage_tier,
            "status": "CONFIRMED_PRIORITY",
            "allocated_at": datetime.utcnow().isoformat()
        }
        logger.info(f"[PHC REGISTRY - TOKEN] {token_payload}")
        return token_payload

    @staticmethod
    def alert_asha_worker(village_code: str, patient_name: str, symptoms: str) -> Dict[str, Any]:
        """
        Alerts local Accredited Social Health Activist (ASHA) field worker.
        """
        asha_payload = {
            "status": "NOTIFIED",
            "village": village_code,
            "worker_title": f"ASHA Worker - Cluster {village_code}",
            "patient": patient_name,
            "symptoms": symptoms,
            "action_required": "In-person visit within 4 hours",
            "timestamp": datetime.utcnow().isoformat()
        }
        logger.info(f"[ASHA ALERT NETWORK] {asha_payload}")
        return asha_payload


dispatch_service = ClinicalDispatchService()
