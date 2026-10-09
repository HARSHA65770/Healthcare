package com.healthcare.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "phone_hash", nullable = false, length = 64)
    private String phoneHash;

    @Column(name = "village_code", nullable = false, length = 32)
    private String villageCode;

    @Column(length = 32)
    private String role = "Patient";

    @Column(name = "preferred_lang", length = 10)
    private String preferredLang = "te-IN";

    private Double latitude;
    private Double longitude;

    @Column(name = "location_name", length = 200)
    private String locationName;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public User() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public User(String id, String fullName, String phoneHash, String villageCode, String role, String preferredLang) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.fullName = fullName;
        this.phoneHash = phoneHash;
        this.villageCode = villageCode;
        this.role = role != null ? role : "Patient";
        this.preferredLang = preferredLang != null ? preferredLang : "te-IN";
        this.createdAt = Instant.now();
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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
