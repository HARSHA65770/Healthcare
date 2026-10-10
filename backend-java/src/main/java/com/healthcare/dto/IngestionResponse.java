package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    public static class SeverityRange {
        private int score;

        @JsonProperty("max_score")
        private int maxScore = 10;

        @JsonProperty("level_label")
        private String levelLabel;

        @JsonProperty("condition_category")
        private String conditionCategory;

        @JsonProperty("action_window")
        private String actionWindow;

        @JsonProperty("expected_recovery")
        private String expectedRecovery;

        public SeverityRange() {}
        public SeverityRange(int score, String levelLabel, String conditionCategory, String actionWindow, String expectedRecovery) {
            this.score = score;
            this.maxScore = 10;
            this.levelLabel = levelLabel;
            this.conditionCategory = conditionCategory;
            this.actionWindow = actionWindow;
            this.expectedRecovery = expectedRecovery;
        }

        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }

        public int getMaxScore() { return maxScore; }
        public void setMaxScore(int maxScore) { this.maxScore = maxScore; }

        public String getLevelLabel() { return levelLabel; }
        public void setLevelLabel(String levelLabel) { this.levelLabel = levelLabel; }

        public String getConditionCategory() { return conditionCategory; }
        public void setConditionCategory(String conditionCategory) { this.conditionCategory = conditionCategory; }

        public String getActionWindow() { return actionWindow; }
        public void setActionWindow(String actionWindow) { this.actionWindow = actionWindow; }

        public String getExpectedRecovery() { return expectedRecovery; }
        public void setExpectedRecovery(String expectedRecovery) { this.expectedRecovery = expectedRecovery; }

        @JsonProperty("maxScore")
        public int getMaxScoreCamel() { return maxScore; }

        @JsonProperty("levelLabel")
        public String getLevelLabelCamel() { return levelLabel; }

        @JsonProperty("conditionCategory")
        public String getConditionCategoryCamel() { return conditionCategory; }

        @JsonProperty("actionWindow")
        public String getActionWindowCamel() { return actionWindow; }

        @JsonProperty("expectedRecovery")
        public String getExpectedRecoveryCamel() { return expectedRecovery; }
    }

    public static class HospitalGuidance {
        private String recommendation;

        @JsonProperty("banner_text")
        private String bannerText;

        @JsonProperty("urgency_badge")
        private String urgencyBadge;

        @JsonProperty("facility_type")
        private String facilityType;

        private String reason;

        public HospitalGuidance() {}
        public HospitalGuidance(String recommendation, String bannerText, String urgencyBadge, String facilityType, String reason) {
            this.recommendation = recommendation;
            this.bannerText = bannerText;
            this.urgencyBadge = urgencyBadge;
            this.facilityType = facilityType;
            this.reason = reason;
        }

        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

        public String getBannerText() { return bannerText; }
        public void setBannerText(String bannerText) { this.bannerText = bannerText; }

        public String getUrgencyBadge() { return urgencyBadge; }
        public void setUrgencyBadge(String urgencyBadge) { this.urgencyBadge = urgencyBadge; }

        public String getFacilityType() { return facilityType; }
        public void setFacilityType(String facilityType) { this.facilityType = facilityType; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        @JsonProperty("bannerText")
        public String getBannerTextCamel() { return bannerText; }

        @JsonProperty("urgencyBadge")
        public String getUrgencyBadgeCamel() { return urgencyBadge; }

        @JsonProperty("facilityType")
        public String getFacilityTypeCamel() { return facilityType; }
    }

    public static class WhatToDoNext {
        @JsonProperty("immediate_steps")
        private List<String> immediateSteps = new ArrayList<>();

        private List<String> precautions = new ArrayList<>();

        @JsonProperty("red_flags")
        private List<String> redFlags = new ArrayList<>();

        @JsonProperty("home_remedies")
        private List<String> homeRemedies = new ArrayList<>();

        public WhatToDoNext() {}
        public WhatToDoNext(List<String> immediateSteps, List<String> precautions, List<String> redFlags, List<String> homeRemedies) {
            this.immediateSteps = immediateSteps != null ? immediateSteps : new ArrayList<>();
            this.precautions = precautions != null ? precautions : new ArrayList<>();
            this.redFlags = redFlags != null ? redFlags : new ArrayList<>();
            this.homeRemedies = homeRemedies != null ? homeRemedies : new ArrayList<>();
        }

        public List<String> getImmediateSteps() { return immediateSteps; }
        public void setImmediateSteps(List<String> immediateSteps) { this.immediateSteps = immediateSteps; }

        public List<String> getPrecautions() { return precautions; }
        public void setPrecautions(List<String> precautions) { this.precautions = precautions; }

        public List<String> getRedFlags() { return redFlags; }
        public void setRedFlags(List<String> redFlags) { this.redFlags = redFlags; }

        public List<String> getHomeRemedies() { return homeRemedies; }
        public void setHomeRemedies(List<String> homeRemedies) { this.homeRemedies = homeRemedies; }

        @JsonProperty("immediateSteps")
        public List<String> getImmediateStepsCamel() { return immediateSteps; }

        @JsonProperty("redFlags")
        public List<String> getRedFlagsCamel() { return redFlags; }

        @JsonProperty("homeRemedies")
        public List<String> getHomeRemediesCamel() { return homeRemedies; }
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

        @JsonProperty("speech_phrase")
        private String speechPhrase;

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

        @JsonProperty("severity_range")
        private SeverityRange severityRange;

        @JsonProperty("hospital_guidance")
        private HospitalGuidance hospitalGuidance;

        @JsonProperty("what_to_do_next")
        private WhatToDoNext whatToDoNext;

        @JsonProperty("nearest_hospital_recommendation")
        private NearestHospitalResponse.NearestHospitalItem nearestHospitalRecommendation;

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

        public String getSpeechPhrase() { return speechPhrase; }
        public void setSpeechPhrase(String speechPhrase) { this.speechPhrase = speechPhrase; }

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

        public SeverityRange getSeverityRange() { return severityRange; }
        public void setSeverityRange(SeverityRange severityRange) { this.severityRange = severityRange; }

        public HospitalGuidance getHospitalGuidance() { return hospitalGuidance; }
        public void setHospitalGuidance(HospitalGuidance hospitalGuidance) { this.hospitalGuidance = hospitalGuidance; }

        public WhatToDoNext getWhatToDoNext() { return whatToDoNext; }
        public void setWhatToDoNext(WhatToDoNext whatToDoNext) { this.whatToDoNext = whatToDoNext; }

        public NearestHospitalResponse.NearestHospitalItem getNearestHospitalRecommendation() { return nearestHospitalRecommendation; }
        public void setNearestHospitalRecommendation(NearestHospitalResponse.NearestHospitalItem nearestHospitalRecommendation) { this.nearestHospitalRecommendation = nearestHospitalRecommendation; }
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
