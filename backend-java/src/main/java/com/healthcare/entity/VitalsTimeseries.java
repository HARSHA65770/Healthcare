package com.healthcare.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vitals_timeseries")
public class VitalsTimeseries {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "recorded_at")
    private Instant recordedAt = Instant.now();

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    private Integer systolic;
    private Integer diastolic;
    private Integer spo2;
    private Integer glucose;

    @Column(name = "urgency_level", length = 32)
    private String urgencyLevel = "NORMAL";

    public VitalsTimeseries() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public VitalsTimeseries(String userId, Integer systolic, Integer diastolic, Integer spo2, Integer glucose, String urgencyLevel) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.systolic = systolic;
        this.diastolic = diastolic;
        this.spo2 = spo2;
        this.glucose = glucose;
        this.urgencyLevel = urgencyLevel != null ? urgencyLevel : "NORMAL";
        this.recordedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Integer getSystolic() { return systolic; }
    public void setSystolic(Integer systolic) { this.systolic = systolic; }

    public Integer getDiastolic() { return diastolic; }
    public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }

    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer spo2) { this.spo2 = spo2; }

    public Integer getGlucose() { return glucose; }
    public void setGlucose(Integer glucose) { this.glucose = glucose; }

    public String getUrgencyLevel() { return urgencyLevel; }
    public void setUrgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; }
}
