import os
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models.database import init_db, SessionLocal, User, HospitalRegistry, VitalsTimeseries, TriageRecord
from .routers.triage_router import router as triage_router
from .routers.vitals_router import router as vitals_router
from .routers.hospitals_router import router as hospitals_router
from .routers.auth_router import router as auth_router
from .services.websocket_hub import telemetry_hub

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_initial_demo_data()
    yield

# Initialize FastAPI application
app = FastAPI(
    title="Autonomous Rural Preventive Healthcare Platform Core API",
    description="Client-Side Web PWA, Browser WASM-OCR, Vernacular Voice AI & Hospital Telemetry Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for PWA and Doctor Dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(triage_router)
app.include_router(vitals_router)
app.include_router(hospitals_router)
app.include_router(auth_router)


def seed_initial_demo_data():
    """
    Populates default demonstration hospitals, patients, and initial vitals
    to give a rich experience on first boot.
    """
    db = SessionLocal()
    try:
        # Seed hospitals
        if db.query(HospitalRegistry).count() == 0:
            hospitals = [
                HospitalRegistry(
                    id="hosp-001",
                    name="Adilabad District Headquarters Hospital (Emergency Bay)",
                    district_code="DIST-ADILABAD-01",
                    emergency_phone="+91-8732-220108",
                    active_websocket_connections=1
                ),
                HospitalRegistry(
                    id="hosp-002",
                    name="Utnoor Primary Health Centre (PHC Triage)",
                    district_code="DIST-UTNOOR-02",
                    emergency_phone="+91-8731-274100",
                    active_websocket_connections=1
                )
            ]
            db.add_all(hospitals)
            db.commit()

        # Seed sample patients
        if db.query(User).count() == 0:
            patient1 = User(
                id="pat-demo-001",
                full_name="Lakshmi Devi",
                phone_hash="HASH-98480123",
                village_code="VIL-ADILABAD-104",
                role="Patient",
                preferred_lang="te-IN"
            )
            patient2 = User(
                id="pat-demo-002",
                full_name="Rameshwar Rao",
                phone_hash="HASH-99887766",
                village_code="VIL-UTNOOR-205",
                role="Patient",
                preferred_lang="te-IN"
            )
            doctor1 = User(
                id="doc-demo-001",
                full_name="Dr. Sunita K., MD (Community Medicine)",
                phone_hash="HASH-94401122",
                village_code="DIST-ADILABAD-01",
                role="Doctor",
                preferred_lang="en-IN"
            )
            db.add_all([patient1, patient2, doctor1])
            db.commit()

            # Seed sample timeseries vitals for patient 1 (Lakshmi Devi) showing trend
            now = datetime.now(timezone.utc)
            sample_readings = [
                VitalsTimeseries(
                    user_id=patient1.id,
                    recorded_at=now - timedelta(days=14),
                    systolic=128,
                    diastolic=82,
                    spo2=98,
                    glucose=110,
                    urgency_level="NORMAL"
                ),
                VitalsTimeseries(
                    user_id=patient1.id,
                    recorded_at=now - timedelta(days=7),
                    systolic=135,
                    diastolic=86,
                    spo2=97,
                    glucose=124,
                    urgency_level="MODERATE"
                ),
                VitalsTimeseries(
                    user_id=patient1.id,
                    recorded_at=now - timedelta(days=1),
                    systolic=148,
                    diastolic=94,
                    spo2=95,
                    glucose=145,
                    urgency_level="HIGH"
                ),
            ]
            db.add_all(sample_readings)

            # Sample triage record
            sample_triage = TriageRecord(
                user_id=patient1.id,
                created_at=now - timedelta(days=1),
                raw_transcript="Severe headache and slight blurry vision for two days",
                clinical_entities_json='[{"symptom": "Elevated blood pressure (148/94 mmHg)", "duration": "Current reading", "severity": "moderate", "is_red_flag": false}]',
                esi_score=3,
                hospital_acknowledged=False,
                doctor_notes=None,
                ne_mo_filtered=False
            )
            db.add(sample_triage)
            db.commit()
    finally:
        db.close()


from fastapi.responses import FileResponse

# Check if production frontend build exists to serve unified PWA
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")
        # Serve exact file if it exists (e.g. favicon.svg, manifest.json, sw.js)
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback to SPA index.html
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {
            "platform": "Autonomous Rural Preventive Healthcare Web Platform",
            "status": "operational",
            "docs": "/docs"
        }
else:
    @app.get("/")
    def root():
        return {
            "platform": "Autonomous Rural Preventive Healthcare Web Platform",
            "specification": "Client-Side Web PWA, Browser WASM-OCR, Vernacular Voice AI & Hospital Telemetry",
            "status": "operational",
            "docs": "/docs",
            "version": "1.0.0"
        }


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket, district: str = "ALL"):
    """
    Sub-second live broadcast channel for hospital doctors and rural triage officers.
    Section 1 & 2 of Engineering Specification.
    """
    await telemetry_hub.connect(websocket, district_code=district)
    try:
        # Send initial confirmation message
        await websocket.send_json({
            "event": "CONNECTED",
            "message": "Connected to Rural Hospital Live Telemetry Feed",
            "district": district,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        while True:
            # Keep connection open and accept heartbeats or acknowledgments
            data = await websocket.receive_text()
            # Handle client doctor ping/keepalive
    except WebSocketDisconnect:
        telemetry_hub.disconnect(websocket, district_code=district)
    except Exception as e:
        telemetry_hub.disconnect(websocket, district_code=district)
