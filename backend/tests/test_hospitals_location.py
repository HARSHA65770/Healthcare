import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.routers.hospitals_router import haversine_distance, estimate_ambulance_travel_time

client = TestClient(app)


def test_haversine_distance_calculation():
    # Adilabad to Utnoor (~38-42 km straight line)
    d = haversine_distance(19.6641, 78.5320, 19.3670, 78.7830)
    assert 35.0 <= d <= 45.0


def test_estimate_ambulance_travel_time():
    # 45 km travel should estimate around 63 mins
    t = estimate_ambulance_travel_time(45.0)
    assert t >= 60


def test_nearest_hospital_api_by_village():
    response = client.get("/api/v1/hospitals/nearest?village=Utnoor+Tribal+Cluster+(ITDA)")
    assert response.status_code == 200
    data = response.json()
    assert "user_location" in data
    assert "nearest_hospital" in data
    assert data["nearest_hospital"]["name"] == "Utnoor Community Health Centre (CHC & Tribal Specialty Centre)"
    assert data["nearest_hospital"]["emergency_phone"] == "+91-8731-274100"
    assert data["nearest_hospital"]["ambulance_phone"] == "108"
    assert "google_maps_url" in data["nearest_hospital"]
    assert len(data["nearby_hospitals"]) > 0


def test_nearest_hospital_api_by_gps():
    # Hyderabad coordinates (17.3850, 78.4867)
    response = client.get("/api/v1/hospitals/nearest?lat=17.3850&lng=78.4867")
    assert response.status_code == 200
    data = response.json()
    assert data["user_location"]["source"] == "gps"
    assert "Osmania" in data["nearest_hospital"]["name"] or "Gandhi" in data["nearest_hospital"]["name"]
    assert data["nearest_hospital"]["distance_km"] < 10.0
