package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class UserDTO {
    private String id;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("phone_hash")
    private String phoneHash;

    @JsonProperty("village_code")
    private String villageCode;

    private String role;

    @JsonProperty("preferred_lang")
    private String preferredLang;

    private Double latitude;
    private Double longitude;

    @JsonProperty("location_name")
    private String locationName;

    @JsonProperty("created_at")
    private String createdAt;

    public UserDTO() {}

    public UserDTO(String id, String fullName, String phoneHash, String villageCode, String role, String preferredLang, Double latitude, Double longitude, String locationName, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.phoneHash = phoneHash;
        this.villageCode = villageCode;
        this.role = role;
        this.preferredLang = preferredLang;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
        this.createdAt = createdAt != null ? createdAt.toString() : null;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneHash() { return phoneHash; }
    public void setPhoneHash(String phoneHash) { this.phoneHash = phoneHash; }

    public String getVillageCode() { return villageCode; }
    public void setVillageCode(String villageCode) { this.villageCode = villageCode; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPreferredLang() { return preferredLang; }
    public void setPreferredLang(String preferredLang) { this.preferredLang = preferredLang; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
