package com.healthcare.controller;

import com.healthcare.dto.DoctorAcknowledgeRequest;
import com.healthcare.dto.IngestionResponse;
import com.healthcare.dto.VitalsIngestionRequest;
import com.healthcare.service.TriageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/triage")
public class TriageController {

    private final TriageService triageService;

    public TriageController(TriageService triageService) {
        this.triageService = triageService;
    }

    @PostMapping("/ingest")
    public ResponseEntity<IngestionResponse> ingestPatientData(@Valid @RequestBody VitalsIngestionRequest payload) {
        return ResponseEntity.ok(triageService.processIngestion(payload));
    }

    @GetMapping("/active-triage")
    public ResponseEntity<List<Map<String, Object>>> getActiveTriage() {
        return ResponseEntity.ok(triageService.getActiveTriageCases());
    }

    @PostMapping("/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledgeCase(@Valid @RequestBody DoctorAcknowledgeRequest request) {
        return ResponseEntity.ok(triageService.acknowledgeTriageRecord(request));
    }
}
