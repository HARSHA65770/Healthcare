package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class DoctorAcknowledgeRequest {

    @NotBlank
    @JsonProperty("record_id")
    private String recordId;

    @JsonProperty("doctor_notes")
    private String doctorNotes;

    @JsonProperty("action_type")
    private String actionType = "ACKNOWLEDGE";

    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
}
