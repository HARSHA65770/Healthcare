import json
import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from ..models.database import get_db, HospitalRegistry
from ..models.schemas import HospitalDTO, NearestHospitalResponse, NearestHospitalItem

router = APIRouter(prefix="/api/v1/hospitals", tags=["Hospitals & Geolocation"])

# Predefined coordinates for rural cluster presets
VILLAGE_COORDINATES: Dict[str, Dict[str, Any]] = {
    "Adilabad Rural (Cluster 104)": {"lat": 19.6641, "lng": 78.5320, "name": "Adilabad Rural (Cluster 104)"},
    "Asifabad Sector 2 (Komaram Bheem)": {"lat": 19.3600, "lng": 79.2800, "name": "Asifabad Sector 2 (Komaram Bheem)"},
    "Utnoor Tribal Cluster (ITDA)": {"lat": 19.3667, "lng": 78.7833, "name": "Utnoor Tribal Cluster (ITDA)"},
    "Nirmal Town Mandal": {"lat": 19.0964, "lng": 78.3434, "name": "Nirmal Town Mandal"},
    "Bela Border Hamlet": {"lat": 19.7800, "lng": 78.8000, "name": "Bela Border Hamlet"},
    "Hyderabad / Secunderabad": {"lat": 17.3850, "lng": 78.4867, "name": "Hyderabad City Center"}
}

MASTER_HOSPITALS = [
    {
        "id": "gov-rims-adilabad",
        "name": "Rajiv Gandhi Institute of Medical Sciences (RIMS) & District Hospital",
        "hospital_type": "Medical College & District Hospital",
        "district_code": "DIST-ADILABAD-01",
        "address": "National Highway 44, Collectorate Road, Adilabad, Telangana - 504001",
        "latitude": 19.6641,
        "longitude": 78.5320,
        "emergency_phone": "+91-8732-220108",
        "general_phone": "+91-8732-226999",
        "ambulance_phone": "108",
        "is_open_24x7": True,
        "opd_timings": "8:30 AM – 1:30 PM (Mon to Sat), Emergency Casualty 24/7",
        "facilities": [
            "24/7 Emergency Casualty & Trauma Care",
            "Intensive Care Unit (ICU & ICCU)",
            "Free Government Blood Bank",
            "Maternal & Neonatal Intensive Care (NICU)",
            "Hemodialysis Unit (Free under Aarogyasri)",
            "Digital X-Ray, CT Scan & Ultrasound",
            "Jan Aushadhi Free Generic Pharmacy"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-8732-220108 or 108. Head directly to Gate No. 1 Casualty Ward.",
            "opdAppointment": "Walk-in OP registration counter opens at 8:00 AM. Free consultation.",
            "ambulanceSupport": "Dial 108 for free rural ambulance transport directly to RIMS Emergency."
        }
    },
    {
        "id": "gov-phc-rural",
        "name": "Adilabad Rural Primary Health Centre (Cluster 104 PHC)",
        "hospital_type": "Primary Health Centre (PHC)",
        "district_code": "DIST-ADILABAD-RURAL",
        "address": "PHC Compound, Mavala Village, Adilabad Rural - 504002",
        "latitude": 19.6450,
        "longitude": 78.5250,
        "emergency_phone": "+91-8732-221104",
        "general_phone": "+91-8732-221105",
        "ambulance_phone": "108",
        "is_open_24x7": False,
        "opd_timings": "9:00 AM – 4:00 PM (Emergency stabilized & referred via 108)",
        "facilities": [
            "Free NCD Screenings (BP & Diabetes Monthly Medication)",
            "Routine Immunization & Mother Care",
            "First Aid & Rapid Wound Dressing",
            "Malaria & Water-borne Disease Screening",
            "ASHA & ANM Village Field Worker Coordination"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-8732-221104 or notify village ASHA worker for 108 referral.",
            "opdAppointment": "Walk in directly from 9 AM to 4 PM. Completely free for all villagers.",
            "ambulanceSupport": "ASHA worker coordinates 108 / 102 ambulance pickup directly to home."
        }
    },
    {
        "id": "gov-chc-utnoor",
        "name": "Utnoor Community Health Centre (CHC & Tribal Specialty Centre)",
        "hospital_type": "Community Health Centre (CHC)",
        "district_code": "DIST-UTNOOR-02",
        "address": "Near ITDA Office, Main Road, Utnoor, Adilabad - 504311",
        "latitude": 19.3670,
        "longitude": 78.7830,
        "emergency_phone": "+91-8731-274100",
        "general_phone": "+91-8731-274108",
        "ambulance_phone": "108",
        "is_open_24x7": True,
        "opd_timings": "9:00 AM – 2:00 PM (Emergency 24x7)",
        "facilities": [
            "24/7 Snakebite Antivenom & Anti-Rabies Unit",
            "Maternal & Child Health (MCH) Wing",
            "Malaria & Dengue Rapid Diagnostic Laboratory",
            "Basic ICU & Oxygen Pipeline Beds",
            "Free Ambulance Link to Village Clusters"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-8731-274100 for on-duty Medical Officer or inform local ASHA worker.",
            "opdAppointment": "Walk-in OP counter free of cost. Special tribal health camps held weekly.",
            "ambulanceSupport": "Dial 108 or contact Utnoor CHC Dispatch Unit."
        }
    },
    {
        "id": "gov-chc-asifabad",
        "name": "Asifabad Community Health Centre (CHC - Komaram Bheem)",
        "hospital_type": "Community Health Centre (CHC)",
        "district_code": "DIST-ASIFABAD-03",
        "address": "Civil Hospital Road, Asifabad - 504293",
        "latitude": 19.3630,
        "longitude": 79.2850,
        "emergency_phone": "+91-8733-255108",
        "general_phone": "+91-8733-255200",
        "ambulance_phone": "108",
        "is_open_24x7": True,
        "opd_timings": "9:00 AM – 1:30 PM (Emergency 24x7)",
        "facilities": [
            "24/7 Emergency Maternity Delivery & Labor Room",
            "Pediatric Care Unit",
            "General Medicine & Surgical Ward",
            "Free Diagnostic Blood & Urine Testing",
            "Free Essential Drugs Dispensary"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-8733-255108 for emergency triage and casualty admitting.",
            "opdAppointment": "No prior appointment needed. Visit between 9 AM and 1 PM with Aadhaar card.",
            "ambulanceSupport": "Dial 108 for immediate ambulance dispatch."
        }
    },
    {
        "id": "gov-ah-nirmal",
        "name": "Nirmal District Government Area Hospital",
        "hospital_type": "Area Hospital",
        "district_code": "DIST-NIRMAL-04",
        "address": "Near Old Bus Stand, Mancherial Road, Nirmal - 504106",
        "latitude": 19.0964,
        "longitude": 78.3434,
        "emergency_phone": "+91-8734-242108",
        "general_phone": "+91-8734-242199",
        "ambulance_phone": "108",
        "is_open_24x7": True,
        "opd_timings": "8:30 AM – 1:30 PM (Emergency 24x7)",
        "facilities": [
            "Trauma Care & Orthopedics",
            "General Surgery & ENT Specialists",
            "Gynecology & Newborn Care (SNCU)",
            "Free Dialysis Unit",
            "24/7 Pharmacy & Laboratory"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-8734-242108. Direct casualty entrance at Emergency Gate.",
            "opdAppointment": "Registration counters open 8:30 AM daily.",
            "ambulanceSupport": "108 Ambulance service available 24 hours."
        }
    },
    {
        "id": "gov-osmania-hyd",
        "name": "Osmania General Hospital & State Apex Emergency Care",
        "hospital_type": "State Apex Referral & Multi-Specialty Hospital",
        "district_code": "DIST-HYD-01",
        "address": "Afzal Gunj, Hyderabad, Telangana - 500012",
        "latitude": 17.3753,
        "longitude": 78.4744,
        "emergency_phone": "+91-40-24600121",
        "general_phone": "+91-40-24600125",
        "ambulance_phone": "108",
        "is_open_24x7": True,
        "opd_timings": "24/7 Casualty & Comprehensive Multi-Specialty OPD",
        "facilities": [
            "Level-1 State Trauma Care Centre",
            "Advanced Coronary & Neuro ICU",
            "Comprehensive Toxicology & Snakebite Core",
            "Full Surgical Theatres & Free Dialysis Wing"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-40-24600121 or 108. Casualty reception open 24x7.",
            "opdAppointment": "Central Registration Block opens 7:30 AM daily.",
            "ambulanceSupport": "Dial 108 emergency dispatch."
        }
    },
    {
        "id": "gov-gandhi-sec",
        "name": "Gandhi Hospital & Medical College",
        "hospital_type": "Medical College & Super Specialty Hospital",
        "district_code": "DIST-HYD-02",
        "address": "Musheerabad, Padmarao Nagar, Secunderabad, Telangana - 500003",
        "latitude": 17.4244,
        "longitude": 78.5039,
        "emergency_phone": "+91-40-27505566",
        "general_phone": "+91-40-27505500",
        "ambulance_phone": "108",
        "is_open_24x7": True,
        "opd_timings": "24/7 Emergency Casualty & All Specialty Departments",
        "facilities": [
            "Emergency Resuscitation & High Dependency Unit",
            "Pediatric & Maternal Emergency Centre",
            "Advanced Cardiology & Nephrology Services",
            "Central 24x7 Pathology & Blood Bank"
        ],
        "ayushman_empaneled": True,
        "how_to_contact": {
            "emergency": "Call +91-40-27505566 or 108. Direct ambulance ramp to Casualty.",
            "opdAppointment": "Free general OPD counters open Monday through Saturday.",
            "ambulanceSupport": "Dial 108 for emergency transit."
        }
    }
]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def estimate_ambulance_travel_time(distance_km: float) -> int:
    """
    Estimates rural ambulance response & travel time in minutes.
    Assumes average ambulance travel speed of 45 km/h + 3 min response staging.
    """
    travel_mins = int((distance_km / 45.0) * 60) + 3
    return max(4, travel_mins)


@router.get("/", response_model=List[HospitalDTO])
def list_hospitals(db: Session = Depends(get_db)):
    """
    Returns registered Primary Health Centres (PHC) and District Hospitals.
    Falls back to master registry if database entries are minimal.
    """
    db_hospitals = db.query(HospitalRegistry).all()
    if not db_hospitals:
        seed_default_hospitals(db)
        db_hospitals = db.query(HospitalRegistry).all()
    return db_hospitals


@router.get("/nearest", response_model=NearestHospitalResponse)
def get_nearest_hospitals(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    village: Optional[str] = None,
    limit: int = 5
):
    """
    Calculates distance from logged-in user's GPS coordinates or registered village
    to all registered hospitals and returns nearest facility with full emergency contact info.
    """
    # 1. Determine user coordinates
    user_lat: float
    user_lng: float
    loc_source: str
    location_name: str

    clean_lat = float(lat) if (lat is not None and not hasattr(lat, 'default')) else None
    clean_lng = float(lng) if (lng is not None and not hasattr(lng, 'default')) else None
    clean_village = str(village) if (village is not None and not hasattr(village, 'default')) else None

    if clean_lat is not None and clean_lng is not None:
        user_lat = clean_lat
        user_lng = clean_lng
        loc_source = "gps"
        location_name = clean_village or f"GPS ({round(clean_lat, 4)}, {round(clean_lng, 4)})"
    elif clean_village and clean_village in VILLAGE_COORDINATES:
        preset = VILLAGE_COORDINATES[clean_village]
        user_lat = preset["lat"]
        user_lng = preset["lng"]
        loc_source = "village_preset"
        location_name = preset["name"]
    elif clean_village:
        # Check partial match in village names
        matched = next((v for k, v in VILLAGE_COORDINATES.items() if clean_village.lower() in k.lower()), None)
        if matched:
            user_lat = matched["lat"]
            user_lng = matched["lng"]
            loc_source = "village_preset"
            location_name = matched["name"]
        else:
            default_p = VILLAGE_COORDINATES["Adilabad Rural (Cluster 104)"]
            user_lat = default_p["lat"]
            user_lng = default_p["lng"]
            loc_source = "default_fallback"
            location_name = clean_village
    else:
        default_p = VILLAGE_COORDINATES["Adilabad Rural (Cluster 104)"]
        user_lat = default_p["lat"]
        user_lng = default_p["lng"]
        loc_source = "default_fallback"
        location_name = default_p["name"]

    # 2. Compute distances to all hospitals
    calculated_hospitals: List[NearestHospitalItem] = []
    for h in MASTER_HOSPITALS:
        h_lat = h["latitude"]
        h_lng = h["longitude"]
        dist_km = haversine_distance(user_lat, user_lng, h_lat, h_lng)
        time_mins = estimate_ambulance_travel_time(dist_km)
        maps_url = f"https://www.google.com/maps/dir/?api=1&destination={h_lat},{h_lng}"

        item = NearestHospitalItem(
            id=h["id"],
            name=h["name"],
            hospital_type=h["hospital_type"],
            district_code=h["district_code"],
            address=h["address"],
            distance_km=dist_km,
            estimated_time_mins=time_mins,
            emergency_phone=h["emergency_phone"],
            general_phone=h.get("general_phone"),
            ambulance_phone=h.get("ambulance_phone", "108"),
            is_open_24x7=h.get("is_open_24x7", True),
            opd_timings=h.get("opd_timings"),
            facilities=h.get("facilities", []),
            ayushman_empaneled=h.get("ayushman_empaneled", True),
            google_maps_url=maps_url,
            how_to_contact=h.get("how_to_contact", {})
        )
        calculated_hospitals.append(item)

    # 3. Sort by closest distance
    calculated_hospitals.sort(key=lambda x: x.distance_km)

    nearest = calculated_hospitals[0] if calculated_hospitals else None

    return NearestHospitalResponse(
        user_location={
            "latitude": user_lat,
            "longitude": user_lng,
            "source": loc_source,
            "location_name": location_name
        },
        nearest_hospital=nearest,
        nearby_hospitals=calculated_hospitals[:limit],
        emergency_helplines={
            "national_emergency": "112",
            "ambulance": "108",
            "pregnant_mother_child": "102",
            "tele_manas_mental_health": "14416",
            "ayushman_bharat_helpline": "14555",
            "health_information_advice": "104"
        }
    )


@router.post("/seed-defaults")
def seed_default_hospitals(db: Session = Depends(get_db)):
    """
    Seeds comprehensive rural and district hospitals with exact coordinates.
    """
    existing_ids = {h.id for h in db.query(HospitalRegistry).all()}
    added_count = 0

    for h in MASTER_HOSPITALS:
        if h["id"] not in existing_ids:
            reg = HospitalRegistry(
                id=h["id"],
                name=h["name"],
                hospital_type=h["hospital_type"],
                district_code=h["district_code"],
                address=h["address"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                emergency_phone=h["emergency_phone"],
                general_phone=h.get("general_phone"),
                ambulance_phone=h.get("ambulance_phone", "108"),
                is_open_24x7=h.get("is_open_24x7", True),
                opd_timings=h.get("opd_timings"),
                facilities_json=json.dumps(h.get("facilities", [])),
                ayushman_empaneled=h.get("ayushman_empaneled", True),
                active_websocket_connections=1
            )
            db.add(reg)
            added_count += 1

    if added_count > 0:
        db.commit()
        return {"status": "seeded", "added": added_count}
    return {"status": "up_to_date", "total": len(MASTER_HOSPITALS)}
