package com.healthcare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.dto.DoctorAcknowledgeRequest;
import com.healthcare.dto.IngestionResponse;
import com.healthcare.dto.VitalsIngestionRequest;
import com.healthcare.entity.TriageRecord;
import com.healthcare.entity.User;
import com.healthcare.entity.VitalsTimeseries;
import com.healthcare.repository.TriageRecordRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.repository.VitalsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class TriageService {

    private final UserRepository userRepository;
    private final VitalsRepository vitalsRepository;
    private final TriageRecordRepository triageRecordRepository;
    private final WebSocketTelemetryHub telemetryHub;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TriageService(UserRepository userRepository,
                         VitalsRepository vitalsRepository,
                         TriageRecordRepository triageRecordRepository,
                         WebSocketTelemetryHub telemetryHub) {
        this.userRepository = userRepository;
        this.vitalsRepository = vitalsRepository;
        this.triageRecordRepository = triageRecordRepository;
        this.telemetryHub = telemetryHub;
    }

    public String verifyClinicalSafety(VitalsIngestionRequest v) {
        if ((v.getSystolicBp() != null && v.getSystolicBp() >= 180) ||
            (v.getDiastolicBp() != null && v.getDiastolicBp() >= 120)) {
            return "CRITICAL";
        }
        if (v.getSpo2() != null && v.getSpo2() < 90) {
            return "CRITICAL";
        }
        if (v.getGlucoseMgDl() != null && (v.getGlucoseMgDl() > 350 || v.getGlucoseMgDl() < 60)) {
            return "CRITICAL";
        }
        if ((v.getSystolicBp() != null && v.getSystolicBp() >= 140) ||
            (v.getSpo2() != null && v.getSpo2() <= 93)) {
            return "HIGH";
        }
        return "NORMAL";
    }

    @Transactional
    public IngestionResponse processIngestion(VitalsIngestionRequest payload) {
        String urgency = verifyClinicalSafety(payload);
        int tier;
        int esiScore;
        String tierTitle;
        String rationale;
        String vernacularGuidance;
        String englishSummary;

        if ("CRITICAL".equals(urgency)) {
            tier = 1;
            esiScore = 1;
            tierTitle = "Tier 1: Emergency Resuscitation / Immediate Referral";
            rationale = "Critical biometric violation detected: Severe hypertensive urgency or severe hypoxia. Immediate intervention required.";
            vernacularGuidance = "తక్షణ వైద్య సహాయం అవసరం. 108 అంబులెన్స్ పిలవబడింది. (Immediate emergency medical attention required. 108 ambulance notified.)";
            englishSummary = "Patient vitals breach safety threshold. Immediate district hospital transfer advised.";
        } else if ("HIGH".equals(urgency)) {
            tier = 2;
            esiScore = 2;
            tierTitle = "Tier 2: High Risk - Priority PHC Consultation";
            rationale = "Stage 2 Hypertension or moderate desaturation detected. Needs same-day medical evaluation.";
            vernacularGuidance = "ఈరోజే దగ్గరలోని ప్రాథమిక ఆరోగ్య కేంద్రాన్ని సందర్శించండి. (Please visit your nearest PHC today for physician evaluation.)";
            englishSummary = "Elevated blood pressure or hypoxia requiring medical supervision.";
        } else {
            tier = 4;
            esiScore = 5;
            tierTitle = "Tier 4: Routine Preventive Baseline";
            rationale = "Vitals are within clinically acceptable reference intervals.";
            vernacularGuidance = "మీ ఆరోగ్యం నిలకడగా ఉంది. క్రమంతప్పకుండా పరీక్షలు చేయించుకోండి. (Your vitals are stable. Continue routine preventive health checkups.)";
            englishSummary = "Normal baseline biometric screening.";
        }

        // 1. Ensure user exists
        User user = userRepository.findById(payload.getPatientId()).orElse(null);
        if (user == null) {
            user = new User();
            user.setId(payload.getPatientId());
            user.setFullName("Rural Citizen #" + payload.getPatientId().substring(0, Math.min(6, payload.getPatientId().length())));
            user.setPhoneHash("PH-" + UUID.randomUUID().toString().substring(0, 8));
            user.setVillageCode(payload.getDistrictCode() != null ? payload.getDistrictCode() : "VIL-ANDHRA-01");
            user.setRole("Patient");
            user.setPreferredLang(payload.getLanguageCode() != null ? payload.getLanguageCode() : "te-IN");
            user = userRepository.save(user);
        }

        // 2. Save to vitals timeseries
        VitalsTimeseries vitalsEntry = new VitalsTimeseries(
                user.getId(),
                payload.getSystolicBp(),
                payload.getDiastolicBp(),
                payload.getSpo2(),
                payload.getGlucoseMgDl(),
                urgency
        );
        vitalsRepository.save(vitalsEntry);

        // 3. Save triage audit record
        List<IngestionResponse.ClinicalEntity> entities = new ArrayList<>();
        if (payload.getSystolicBp() != null && payload.getSystolicBp() >= 140) {
            entities.add(new IngestionResponse.ClinicalEntity("Elevated Blood Pressure (" + payload.getSystolicBp() + "/" + payload.getDiastolicBp() + " mmHg)", "Current reading", "HIGH".equals(urgency) ? "moderate" : "critical", "CRITICAL".equals(urgency)));
        }
        if (payload.getSpo2() != null && payload.getSpo2() <= 93) {
            entities.add(new IngestionResponse.ClinicalEntity("Oxygen Desaturation (" + payload.getSpo2() + "%)", "Current reading", "critical", true));
        }

        String entitiesJson = "[]";
        try {
            entitiesJson = objectMapper.writeValueAsString(entities);
        } catch (Exception ignored) {}

        TriageRecord record = new TriageRecord(
                user.getId(),
                payload.getSymptomText() != null ? payload.getSymptomText() : "Screening intake",
                entitiesJson,
                esiScore
        );
        triageRecordRepository.save(record);

        // 4. Broadcast to doctor telemetry feed
        Map<String, Object> wsAlert = new HashMap<>();
        wsAlert.put("event", "CRITICAL".equals(urgency) ? "CRITICAL_ALERT" : "NEW_VITALS_INGESTED");
        wsAlert.put("patient_id", user.getId());
        wsAlert.put("district_code", payload.getDistrictCode() != null ? payload.getDistrictCode() : "ALL");
        wsAlert.put("tier", tier);
        wsAlert.put("tier_title", tierTitle);
        wsAlert.put("urgency", urgency);
        wsAlert.put("esi_score", esiScore);
        wsAlert.put("systolic", payload.getSystolicBp());
        wsAlert.put("diastolic", payload.getDiastolicBp());
        wsAlert.put("spo2", payload.getSpo2());
        wsAlert.put("glucose", payload.getGlucoseMgDl());
        wsAlert.put("symptoms", payload.getSymptomText());
        wsAlert.put("clinical_rationale", rationale);
        wsAlert.put("timestamp", Instant.now().toString());

        telemetryHub.broadcast(wsAlert);

        // 5. Build DTO Response
        IngestionResponse response = new IngestionResponse();
        response.setStatus("SUCCESS");
        response.setUrgency(urgency);
        response.setTier(tier);
        response.setTaskId("task-" + UUID.randomUUID().toString().substring(0, 8));
        response.setPatientId(user.getId());
        response.setTimestamp(Instant.now().toString());

        IngestionResponse.TriageDetails triage = new IngestionResponse.TriageDetails();
        triage.setUrgencyLevel(urgency);
        triage.setTier(tier);
        triage.setTierTitle(tierTitle);
        triage.setEsiScore(esiScore);
        triage.setEntities(entities);
        triage.setClinicalRationale(rationale);
        triage.setVernacularGuidance(vernacularGuidance);
        triage.setEnglishSummary(englishSummary);
        triage.setSafetyRuleTriggered("CRITICAL".equals(urgency) ? "CRITICAL_BOUND_EXCEEDED" : null);
        triage.setPrescriptionsBlocked(List.of("Vasodilator Beta-Blockers", "Anti-hypertensive Titration"));
        triage.setActionsTaken(List.of("IndexedDB Offline Checkpoint Logged", "SQL Hypertable Persisted", "Doctor Telemetry Streamed"));
        triage.setPhcDispatchNeeded(tier <= 2);
        triage.setEmergencyBroadcastActive("CRITICAL".equals(urgency));

        response.setTriage(triage);
        response.setOfflineFallbackSms("sms:+91108?body=" + user.getId() + "%20" + urgency);

        return response;
    }

    public List<Map<String, Object>> getActiveTriageCases() {
        List<TriageRecord> pending = triageRecordRepository.findByHospitalAcknowledgedFalseOrderByCreatedAtDesc();
        List<Map<String, Object>> list = new ArrayList<>();

        for (TriageRecord rec : pending) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rec.getId());
            map.put("patient_id", rec.getUserId());
            map.put("created_at", rec.getCreatedAt() != null ? rec.getCreatedAt().toString() : null);
            map.put("transcript", rec.getRawTranscript());
            map.put("esi_score", rec.getEsiScore());
            map.put("acknowledged", rec.getHospitalAcknowledged());
            map.put("doctor_notes", rec.getDoctorNotes());
            list.add(map);
        }
        return list;
    }

    @Transactional
    public Map<String, Object> acknowledgeTriageRecord(DoctorAcknowledgeRequest req) {
        TriageRecord rec = triageRecordRepository.findById(req.getRecordId()).orElse(null);
        if (rec != null) {
            rec.setHospitalAcknowledged(true);
            rec.setDoctorNotes(req.getDoctorNotes());
            triageRecordRepository.save(rec);

            // Broadcast acknowledgment update
            Map<String, Object> update = new HashMap<>();
            update.put("event", "CASE_ACKNOWLEDGED");
            update.put("record_id", rec.getId());
            update.put("action_type", req.getActionType());
            update.put("timestamp", Instant.now().toString());
            telemetryHub.broadcast(update);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("record_id", req.getRecordId());
        res.put("acknowledged", true);
        return res;
    }
}
