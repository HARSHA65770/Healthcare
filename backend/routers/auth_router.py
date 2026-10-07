import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.database import get_db, User
from ..models.schemas import UserDTO

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Users"])


class RegisterPatientRequest(BaseModel):
    full_name: str
    phone_number: str
    village_code: str
    preferred_lang: str = "te-IN"
    role: str = "Patient"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None


@router.post("/register", response_model=UserDTO)
def register_or_get_user(req: RegisterPatientRequest, db: Session = Depends(get_db)):
    # Hash or mask phone for privacy
    phone_hash = f"HASH-{hash(req.phone_number) & 0xFFFFFFFF:08x}"
    
    # Check if exists
    user = db.query(User).filter(User.phone_hash == phone_hash).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            full_name=req.full_name,
            phone_hash=phone_hash,
            village_code=req.village_code,
            role=req.role,
            preferred_lang=req.preferred_lang,
            latitude=req.latitude,
            longitude=req.longitude,
            location_name=req.location_name,
            created_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update location or details if supplied
        if req.latitude is not None and req.longitude is not None:
            user.latitude = req.latitude
            user.longitude = req.longitude
        if req.location_name:
            user.location_name = req.location_name
        db.commit()
        db.refresh(user)

    return user


@router.get("/users", response_model=List[UserDTO])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).limit(20).all()


class LoginRequest(BaseModel):
    phone_number: str
    passcode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None


@router.post("/login", response_model=UserDTO)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    phone_hash = f"HASH-{hash(req.phone_number) & 0xFFFFFFFF:08x}"
    user = db.query(User).filter(User.phone_hash == phone_hash).first()
    if not user:
        # If user does not exist in DB yet, create a default session record for seamless intake
        user = User(
            id=str(uuid.uuid4()),
            full_name="Registered Patient",
            phone_hash=phone_hash,
            village_code="Cluster-104",
            role="Patient",
            preferred_lang="te-IN",
            latitude=req.latitude,
            longitude=req.longitude,
            location_name=req.location_name,
            created_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user location on login if provided
        if req.latitude is not None and req.longitude is not None:
            user.latitude = req.latitude
            user.longitude = req.longitude
        if req.location_name:
            user.location_name = req.location_name
        db.commit()
        db.refresh(user)
    return user
