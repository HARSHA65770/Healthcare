from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.database import get_db, VitalsTimeseries, User
from ..models.schemas import VitalsHistoryItem

router = APIRouter(prefix="/api/v1/vitals", tags=["Vitals"])


@router.get("/history/{patient_id}")
def get_patient_vitals_history(
    patient_id: str,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves longitudinal biometric history from TimescaleDB hypertable
    for a given patient, ordered chronologically.
    """
    entries = db.query(VitalsTimeseries).\
        filter(VitalsTimeseries.user_id == patient_id).\
        order_by(VitalsTimeseries.recorded_at.desc()).\
        limit(limit).\
        all()

    # Return in forward chronological order for easy charting
    entries.reverse()

    results = []
    for item in entries:
        results.append({
            "id": item.id,
            "recorded_at": item.recorded_at.isoformat() if item.recorded_at else None,
            "systolic": item.systolic,
            "diastolic": item.diastolic,
            "spo2": item.spo2,
            "glucose": item.glucose,
            "urgency_level": item.urgency_level
        })

    return {
        "patient_id": patient_id,
        "count": len(results),
        "history": results
    }


@router.get("/analytics/summary")
def get_vitals_analytics_summary(db: Session = Depends(get_db)):
    """
    Returns high-level statistics across rural screening deployments.
    """
    total_screenings = db.query(VitalsTimeseries).count()
    critical_count = db.query(VitalsTimeseries).filter(VitalsTimeseries.urgency_level == "CRITICAL").count()
    high_count = db.query(VitalsTimeseries).filter(VitalsTimeseries.urgency_level == "HIGH").count()
    normal_count = db.query(VitalsTimeseries).filter(VitalsTimeseries.urgency_level == "NORMAL").count()

    return {
        "total_screenings": total_screenings,
        "critical_cases": critical_count,
        "high_risk_cases": high_count,
        "baseline_screenings": normal_count,
        "hypertension_prevented_ratio": f"{round((high_count / max(total_screenings, 1)) * 100, 1)}%"
    }
