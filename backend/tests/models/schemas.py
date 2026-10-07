from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class UrgencyLevel(str, Enum):
    CRITICAL = "CRITICAL"   # Tier 1: Resuscitative Emergency
    HIGH = "HIGH"           # Tier 2: High Risk / Sub-Acute
    MODERATE = "MODERATE"   # Tier 3: Moderate Risk / Routine Monitoring
    NORMAL = "NORMAL"       # Tier 4: Preventive Baseline


class VitalsIngestionRequest(BaseModel):
    """
    Ingestion schema matching Section 6 of Engineering Spec.
    Enforces strict physiological boundary checks with Pydantic v2.
    """
    patient_id: str = Field(..., description="UUID or identifier of patient")
    systolic_bp: Optional[int] = Field(None, ge=40, le=260, description="Systolic blood pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=30, le=160, description="Diastolic blood pressure (mmHg)")
    spo2: Optional[int] = Field(None, ge=40, le=100, description="Blood oxygen saturation percentage")
    glucose_mg_dl: Optional[int] = Field(None, ge=20, le=600, description="Blood glucose reading (mg/dL)")
    symptom_audio_base64: Optional[str] = Field(None, description="Raw PCM/WebM/WAV Base64 audio blob from browser")
    symptom_text: Optional[str] = Field(None, description="Direct text input or browser Web Speech transcription")
    language_code: str = Field("te-IN", description="Vernacular language code: te-IN, hi-IN, ta-IN, en-IN")
    district_code: Optional[str] = Field("DIST-AP-01", description="Rural district code for PHC mapping")


class ClinicalEntity(BaseModel):
    symptom: str
    duration: Optional[str] = None
    severity: Optional[str] = "moderate"
    is_red_flag: bool = False


class TriageEvaluation(BaseModel):
    urgency_level: UrgencyLevel
    tier: int
    tier_title: str
    esi_score: int  # 1 to 5 (Emergency Severity Index)
    entities: List[ClinicalEntity] = []
    clinical_rationale: str
    vernacular_guidance: str
    english_summary: str
    safety_rule_triggered: Optional[str] = None
    prescriptions_blocked: List[str] = []
    actions_taken: List[str] = []
    phc_dispatch_needed: bool = False
    emergency_broadcast_active: bool = False


class IngestionResponse(BaseModel):
    status: str
    urgency: UrgencyLevel
    tier: int
    task_id: str
    patient_id: str
    timestamp: datetime
    triage: TriageEvaluation
    offline_fallback_sms: str


class VitalsHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recorded_at: datetime
    systolic: Optional[int]
    diastolic: Optional[int]
    spo2: Optional[int]
    glucose: Optional[int]
    urgency_level: str


class UserDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    phone_hash: str
    village_code: str
    role: str
    preferred_lang: str
    created_at: datetime


class HospitalDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    district_code: str
    emergency_phone: str
    active_websocket_connections: int


class DoctorAcknowledgeRequest(BaseModel):
    record_id: str
    doctor_notes: Optional[str] = None
    action_type: str = "ACKNOWLEDGE"  # "ACKNOWLEDGE", "DISPATCH_AMBULANCE", "RESERVE_PHC_TOKEN"
