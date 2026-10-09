package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class VitalsIngestionRequest {

    @NotBlank
    @JsonProperty("patient_id")
    private String patientId;

    @JsonProperty("systolic_bp")
    private Integer systolicBp;

    @JsonProperty("diastolic_bp")
    private Integer diastolicBp;

    @JsonProperty("spo2")
    private Integer spo2;

    @JsonProperty("glucose_mg_dl")
    private Integer glucoseMgDl;

    @JsonProperty("symptom_audio_base64")
    private String symptomAudioBase64;

    @JsonProperty("symptom_text")
    private String symptomText;

    @JsonProperty("language_code")
    private String languageCode = "te-IN";

    @JsonProperty("district_code")
    private String districtCode = "ALL";

    // Getters and Setters
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public Integer getSystolicBp() { return systolicBp; }
    public void setSystolicBp(Integer systolicBp) { this.systolicBp = systolicBp; }

    public Integer getDiastolicBp() { return diastolicBp; }
    public void setDiastolicBp(Integer diastolicBp) { this.diastolicBp = diastolicBp; }

    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer spo2) { this.spo2 = spo2; }

    public Integer getGlucoseMgDl() { return glucoseMgDl; }
    public void setGlucoseMgDl(Integer glucoseMgDl) { this.glucoseMgDl = glucoseMgDl; }

    public String getSymptomAudioBase64() { return symptomAudioBase64; }
    public void setSymptomAudioBase64(String symptomAudioBase64) { this.symptomAudioBase64 = symptomAudioBase64; }

    public String getSymptomText() { return symptomText; }
    public void setSymptomText(String symptomText) { this.symptomText = symptomText; }

    public String getLanguageCode() { return languageCode; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }

    public String getDistrictCode() { return districtCode; }
    public void setDistrictCode(String districtCode) { this.districtCode = districtCode; }
}
