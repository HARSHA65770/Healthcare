import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.database import init_db
from backend.models.schemas import VitalsIngestionRequest, UrgencyLevel
from backend.services.safety_gate import evaluate_deterministic_safety
from backend.services.guardrails import filter_prescription_guardrails

init_db()
client = TestClient(app)


def test_tier_1_hypertensive_crisis():
    req = VitalsIngestionRequest(
        patient_id="test-pt-1",
        systolic_bp=195,
        diastolic_bp=125,
        spo2=96,
        glucose_mg_dl=130
    )
    res = evaluate_deterministic_safety(req)
    assert res.urgency == UrgencyLevel.CRITICAL
    assert res.tier == 1
    assert res.esi_score == 1
    assert "Hypertensive Crisis" in res.safety_trigger_rule


def test_tier_1_severe_hypoxemia():
    req = VitalsIngestionRequest(
        patient_id="test-pt-2",
        systolic_bp=120,
        diastolic_bp=80,
        spo2=86,
        glucose_mg_dl=100
    )
    res = evaluate_deterministic_safety(req)
    assert res.urgency == UrgencyLevel.CRITICAL
    assert res.tier == 1
    assert res.esi_score == 1
    assert "Critical Hypoxemia" in res.safety_trigger_rule


def test_tier_2_high_risk():
    req = VitalsIngestionRequest(
        patient_id="test-pt-3",
        systolic_bp=150,
        diastolic_bp=95,
        spo2=95,
        glucose_mg_dl=120,
        symptom_text="Fever persisting > 3 days"
    )
    res = evaluate_deterministic_safety(req)
    assert res.urgency == UrgencyLevel.HIGH
    assert res.tier == 2
    assert res.esi_score == 2


def test_tier_4_preventive_baseline():
    req = VitalsIngestionRequest(
        patient_id="test-pt-4",
        systolic_bp=118,
        diastolic_bp=78,
        spo2=99,
        glucose_mg_dl=95,
        symptom_text="No symptoms, routine check"
    )
    res = evaluate_deterministic_safety(req)
    assert res.urgency == UrgencyLevel.NORMAL
    assert res.tier == 4
    assert res.esi_score == 5


def test_nemo_guardrails_blocks_drug_names():
    unsafe_prescription = "Take paracetamol 650mg twice daily and amoxicillin 500mg for 5 days."
    sanitized, violations, was_blocked = filter_prescription_guardrails(unsafe_prescription)
    assert was_blocked is True
    assert "paracetamol" in [v.lower() for v in violations]
    assert "amoxicillin" in [v.lower() for v in violations]
    assert "[PRESCRIPTION DRUG BLOCKED BY CLINICAL SAFETY GATE]" in sanitized
    assert "licensed physician" in sanitized


def test_ingestion_api_endpoint():
    payload = {
        "patient_id": "test-pat-api-001",
        "systolic_bp": 185,
        "diastolic_bp": 110,
        "spo2": 92,
        "glucose_mg_dl": 140,
        "language_code": "te-IN",
        "symptom_text": "Severe crushing chest pain"
    }
    response = client.post("/api/v1/triage/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processed"
    assert data["urgency"] == "CRITICAL"
    assert data["tier"] == 1
    assert data["triage"]["esi_score"] == 1
    assert "sms:108?body=" in data["offline_fallback_sms"]
