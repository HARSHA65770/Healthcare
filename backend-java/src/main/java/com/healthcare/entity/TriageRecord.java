package com.healthcare.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "triage_records")
public class TriageRecord {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Lob
    @Column(name = "raw_transcript")
    private String rawTranscript;

    @Lob
    @Column(name = "clinical_entities_json")
    private String clinicalEntitiesJson;

    @Column(name = "esi_score")
    private Integer esiScore;

    @Column(name = "hospital_acknowledged")
    private Boolean hospitalAcknowledged = false;

    @Lob
    @Column(name = "doctor_notes")
    private String doctorNotes;

    @Column(name = "ne_mo_filtered")
    private Boolean neMoFiltered = false;

    public TriageRecord() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public TriageRecord(String userId, String rawTranscript, String clinicalEntitiesJson, Integer esiScore) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.rawTranscript = rawTranscript;
        this.clinicalEntitiesJson = clinicalEntitiesJson;
        this.esiScore = esiScore;
        this.hospitalAcknowledged = false;
        this.neMoFiltered = false;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getRawTranscript() { return rawTranscript; }
    public void setRawTranscript(String rawTranscript) { this.rawTranscript = rawTranscript; }

    public String getClinicalEntitiesJson() { return clinicalEntitiesJson; }
    public void setClinicalEntitiesJson(String clinicalEntitiesJson) { this.clinicalEntitiesJson = clinicalEntitiesJson; }

    public Integer getEsiScore() { return esiScore; }
    public void setEsiScore(Integer esiScore) { this.esiScore = esiScore; }

    public Boolean getHospitalAcknowledged() { return hospitalAcknowledged; }
    public void setHospitalAcknowledged(Boolean hospitalAcknowledged) { this.hospitalAcknowledged = hospitalAcknowledged; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public Boolean getNeMoFiltered() { return neMoFiltered; }
    public void setNeMoFiltered(Boolean neMoFiltered) { this.neMoFiltered = neMoFiltered; }
}
