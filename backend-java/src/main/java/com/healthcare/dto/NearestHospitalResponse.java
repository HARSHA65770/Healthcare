package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.*;

public class NearestHospitalResponse {

    @JsonProperty("user_location")
    private UserLocation userLocation;

    @JsonProperty("nearest_hospital")
    private NearestHospitalItem nearestHospital;

    @JsonProperty("nearby_hospitals")
    private List<NearestHospitalItem> nearbyHospitals = new ArrayList<>();

    @JsonProperty("emergency_helplines")
    private Map<String, String> emergencyHelplines = new LinkedHashMap<>();

    public static class UserLocation {
        private Double latitude;
        private Double longitude;
        private String source;

        @JsonProperty("location_name")
        private String locationName;

        public UserLocation() {}
        public UserLocation(Double latitude, Double longitude, String source, String locationName) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.source = source;
            this.locationName = locationName;
        }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getLocationName() { return locationName; }
        public void setLocationName(String locationName) { this.locationName = locationName; }
    }

    public static class NearestHospitalItem {
        private String id;
        private String name;

        @JsonProperty("hospital_type")
        private String hospitalType;

        @JsonProperty("district_code")
        private String districtCode;

        private String address;

        @JsonProperty("distance_km")
        private Double distanceKm;

        @JsonProperty("estimated_time_mins")
        private Integer estimatedTimeMins;

        @JsonProperty("emergency_phone")
        private String emergencyPhone;

        @JsonProperty("general_phone")
        private String generalPhone;

        @JsonProperty("ambulance_phone")
        private String ambulancePhone;

        @JsonProperty("is_open_24x7")
        private Boolean isOpen24x7;

        @JsonProperty("opd_timings")
        private String opdTimings;

        private List<String> facilities = new ArrayList<>();

        @JsonProperty("ayushman_empaneled")
        private Boolean ayushmanEmpaneled;

        @JsonProperty("google_maps_url")
        private String googleMapsUrl;

        @JsonProperty("how_to_contact")
        private Map<String, String> howToContact = new HashMap<>();

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getHospitalType() { return hospitalType; }
        public void setHospitalType(String hospitalType) { this.hospitalType = hospitalType; }

        public String getDistrictCode() { return districtCode; }
        public void setDistrictCode(String districtCode) { this.districtCode = districtCode; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public Double getDistanceKm() { return distanceKm; }
        public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

        public Integer getEstimatedTimeMins() { return estimatedTimeMins; }
        public void setEstimatedTimeMins(Integer estimatedTimeMins) { this.estimatedTimeMins = estimatedTimeMins; }

        public String getEmergencyPhone() { return emergencyPhone; }
        public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }

        public String getGeneralPhone() { return generalPhone; }
        public void setGeneralPhone(String generalPhone) { this.generalPhone = generalPhone; }

        public String getAmbulancePhone() { return ambulancePhone; }
        public void setAmbulancePhone(String ambulancePhone) { this.ambulancePhone = ambulancePhone; }

        public Boolean getIsOpen24x7() { return isOpen24x7; }
        public void setIsOpen24x7(Boolean open24x7) { isOpen24x7 = open24x7; }

        public String getOpdTimings() { return opdTimings; }
        public void setOpdTimings(String opdTimings) { this.opdTimings = opdTimings; }

        public List<String> getFacilities() { return facilities; }
        public void setFacilities(List<String> facilities) { this.facilities = facilities; }

        public Boolean getAyushmanEmpaneled() { return ayushmanEmpaneled; }
        public void setAyushmanEmpaneled(Boolean ayushmanEmpaneled) { this.ayushmanEmpaneled = ayushmanEmpaneled; }

        public String getGoogleMapsUrl() { return googleMapsUrl; }
        public void setGoogleMapsUrl(String googleMapsUrl) { this.googleMapsUrl = googleMapsUrl; }

        public Map<String, String> getHowToContact() { return howToContact; }
        public void setHowToContact(Map<String, String> howToContact) { this.howToContact = howToContact; }
    }

    // Getters and Setters
    public UserLocation getUserLocation() { return userLocation; }
    public void setUserLocation(UserLocation userLocation) { this.userLocation = userLocation; }

    public NearestHospitalItem getNearestHospital() { return nearestHospital; }
    public void setNearestHospital(NearestHospitalItem nearestHospital) { this.nearestHospital = nearestHospital; }

    public List<NearestHospitalItem> getNearbyHospitals() { return nearbyHospitals; }
    public void setNearbyHospitals(List<NearestHospitalItem> nearbyHospitals) { this.nearbyHospitals = nearbyHospitals; }

    public Map<String, String> getEmergencyHelplines() { return emergencyHelplines; }
    public void setEmergencyHelplines(Map<String, String> emergencyHelplines) { this.emergencyHelplines = emergencyHelplines; }
}
