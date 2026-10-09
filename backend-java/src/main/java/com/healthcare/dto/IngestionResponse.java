package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class IngestionResponse {

    private String status;
    private String urgency;
    private Integer tier;

    @JsonProperty("task_id")
    private String taskId;

    @JsonProperty("patient_id")
    private String patientId;

    private String timestamp;
    private TriageDetails triage;

    @JsonProperty("offline_fallback_sms")
    private String offlineFallbackSms;

    public static class ClinicalEntity {
        private String symptom;
        private String duration;
        private String severity;

        @JsonProperty("is_red_flag")
        private boolean isRedFlag;

        public ClinicalEntity() {}
        public ClinicalEntity(String symptom, String duration, String severity, boolean isRedFlag) {
            this.symptom = symptom;
            this.duration = duration;
            this.severity = severity;
            this.isRedFlag = isRedFlag;
        }

        public String getSymptom() { return symptom; }
        public void setSymptom(String symptom) { this.symptom = symptom; }

        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public boolean isRedFlag() { return isRedFlag; }
        public void setRedFlag(boolean redFlag) { isRedFlag = redFlag; }
    }

    public static class TriageDetails {
        @JsonProperty("urgency_level")
        private String urgencyLevel;

        private Integer tier;

        @JsonProperty("tier_title")
        private String tierTitle;

        @JsonProperty("esi_score")
        private Integer esiScore;

        private List<ClinicalEntity> entities = new ArrayList<>();

        @JsonProperty("clinical_rationale")
        private String clinicalRationale;

        @JsonProperty("vernacular_guidance")
        private String vernacularGuidance;

        @JsonProperty("english_summary")
        private String englishSummary;

        @JsonProperty("safety_rule_triggered")
        private String safetyRuleTriggered;

        @JsonProperty("prescriptions_blocked")
        private List<String> prescriptionsBlocked = new ArrayList<>();

        @JsonProperty("actions_taken")
        private List<String> actionsTaken = new ArrayList<>();

        @JsonProperty("phc_dispatch_needed")
        private boolean phcDispatchNeeded;

        @JsonProperty("emergency_broadcast_active")
        private boolean emergencyBroadcastActive;

        // Getters and Setters
        public String getUrgencyLevel() { return urgencyLevel; }
        public void setUrgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; }

        public Integer getTier() { return tier; }
        public void setTier(Integer tier) { this.tier = tier; }

        public String getTierTitle() { return tierTitle; }
        public void setTierTitle(String tierTitle) { this.tierTitle = tierTitle; }

        public Integer getEsiScore() { return esiScore; }
        public void setEsiScore(Integer esiScore) { this.esiScore = esiScore; }

        public List<ClinicalEntity> getEntities() { return entities; }
        public void setEntities(List<ClinicalEntity> entities) { this.entities = entities; }

        public String getClinicalRationale() { return clinicalRationale; }
        public void setClinicalRationale(String clinicalRationale) { this.clinicalRationale = clinicalRationale; }

        public String getVernacularGuidance() { return vernacularGuidance; }
        public void setVernacularGuidance(String vernacularGuidance) { this.vernacularGuidance = vernacularGuidance; }

        public String getEnglishSummary() { return englishSummary; }
        public void setEnglishSummary(String englishSummary) { this.englishSummary = englishSummary; }

        public String getSafetyRuleTriggered() { return safetyRuleTriggered; }
        public void setSafetyRuleTriggered(String safetyRuleTriggered) { this.safetyRuleTriggered = safetyRuleTriggered; }

        public List<String> getPrescriptionsBlocked() { return prescriptionsBlocked; }
        public void setPrescriptionsBlocked(List<String> prescriptionsBlocked) { this.prescriptionsBlocked = prescriptionsBlocked; }

        public List<String> getActionsTaken() { return actionsTaken; }
        public void setActionsTaken(List<String> actionsTaken) { this.actionsTaken = actionsTaken; }

        public boolean isPhcDispatchNeeded() { return phcDispatchNeeded; }
        public void setPhcDispatchNeeded(boolean phcDispatchNeeded) { this.phcDispatchNeeded = phcDispatchNeeded; }

        public boolean isEmergencyBroadcastActive() { return emergencyBroadcastActive; }
        public void setEmergencyBroadcastActive(boolean emergencyBroadcastActive) { this.emergencyBroadcastActive = emergencyBroadcastActive; }
    }

    // Getters and Setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public Integer getTier() { return tier; }
    public void setTier(Integer tier) { this.tier = tier; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public TriageDetails getTriage() { return triage; }
    public void setTriage(TriageDetails triage) { this.triage = triage; }

    public String getOfflineFallbackSms() { return offlineFallbackSms; }
    public void setOfflineFallbackSms(String offlineFallbackSms) { this.offlineFallbackSms = offlineFallbackSms; }
}
