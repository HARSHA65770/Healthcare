import os
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rural_health.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For SQLite, enable check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    """
    Users table - Manages patient identity, role-based permissions (Patient, ASHA, Doctor),
    and assigned primary clinic.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(120), nullable=False)
    phone_hash = Column(String(64), nullable=False, index=True)
    village_code = Column(String(32), nullable=False, index=True)
    role = Column(String(32), default="Patient")  # "Patient", "ASHA", "Doctor", "Admin"
    preferred_lang = Column(String(10), default="te-IN")  # te-IN (Telugu), hi-IN (Hindi), ta-IN (Tamil), en-IN
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vitals = relationship("VitalsTimeseries", back_populates="user", cascade="all, delete-orphan")
    triage_records = relationship("TriageRecord", back_populates="user", cascade="all, delete-orphan")


class VitalsTimeseries(Base):
    """
    Vitals timeseries table (TimescaleDB hypertable specification).
    Chunked daily for continuous biometrics and longitudinal trends.
    """
    __tablename__ = "vitals_timeseries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    systolic = Column(Integer, nullable=True)
    diastolic = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    glucose = Column(Integer, nullable=True)
    urgency_level = Column(String(32), default="NORMAL", index=True)

    user = relationship("User", back_populates="vitals")


class TriageRecord(Base):
    """
    Triage Records table.
    Full medical audit trail of clinical AI extractions, ESI scores, doctor override notes,
    and incident resolutions.
    """
    __tablename__ = "triage_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    raw_transcript = Column(Text, nullable=True)
    clinical_entities_json = Column(Text, nullable=True)  # JSON string of extracted symptoms, severity, duration
    esi_score = Column(Integer, nullable=True)            # ESI 1 (Resuscitative) to 5 (Non-urgent)
    hospital_acknowledged = Column(Boolean, default=False)
    doctor_notes = Column(Text, nullable=True)
    ne_mo_filtered = Column(Boolean, default=False)

    user = relationship("User", back_populates="triage_records")


class HospitalRegistry(Base):
    """
    Hospital Registry table.
    Directory of partner primary health centres (PHC) and district hospitals equipped
    with live receiving boards.
    """
    __tablename__ = "hospital_registry"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    hospital_type = Column(String(100), default="Primary Health Centre (PHC)")
    district_code = Column(String(64), nullable=False, index=True)
    address = Column(String(300), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    emergency_phone = Column(String(32), nullable=False)
    general_phone = Column(String(32), nullable=True)
    ambulance_phone = Column(String(32), default="108")
    is_open_24x7 = Column(Boolean, default=True)
    opd_timings = Column(String(150), nullable=True)
    facilities_json = Column(Text, nullable=True)
    ayushman_empaneled = Column(Boolean, default=True)
    active_websocket_connections = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
