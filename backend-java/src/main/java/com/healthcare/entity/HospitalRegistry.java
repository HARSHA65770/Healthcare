package com.healthcare.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hospital_registry")
public class HospitalRegistry {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "hospital_type", length = 100)
    private String hospitalType = "Primary Health Centre (PHC)";

    @Column(name = "district_code", nullable = false, length = 64)
    private String districtCode;

    @Column(length = 300)
    private String address;

    private Double latitude;
    private Double longitude;

    @Column(name = "emergency_phone", nullable = false, length = 32)
    private String emergencyPhone;

    @Column(name = "general_phone", length = 32)
    private String generalPhone;

    @Column(name = "ambulance_phone", length = 32)
    private String ambulancePhone = "108";

    @Column(name = "is_open_24x7")
    private Boolean isOpen24x7 = true;

    @Column(name = "opd_timings", length = 150)
    private String opdTimings;

    @Lob
    @Column(name = "facilities_json")
    private String facilitiesJson;

    @Column(name = "ayushman_empaneled")
    private Boolean ayushmanEmpaneled = true;

    @Column(name = "active_websocket_connections")
    private Integer activeWebsocketConnections = 0;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public HospitalRegistry() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public HospitalRegistry(String id, String name, String districtCode, String emergencyPhone, Double latitude, Double longitude) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.name = name;
        this.districtCode = districtCode;
        this.emergencyPhone = emergencyPhone;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = Instant.now();
    }

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

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

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

    public String getFacilitiesJson() { return facilitiesJson; }
    public void setFacilitiesJson(String facilitiesJson) { this.facilitiesJson = facilitiesJson; }

    public Boolean getAyushmanEmpaneled() { return ayushmanEmpaneled; }
    public void setAyushmanEmpaneled(Boolean ayushmanEmpaneled) { this.ayushmanEmpaneled = ayushmanEmpaneled; }

    public Integer getActiveWebsocketConnections() { return activeWebsocketConnections; }
    public void setActiveWebsocketConnections(Integer activeWebsocketConnections) { this.activeWebsocketConnections = activeWebsocketConnections; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
