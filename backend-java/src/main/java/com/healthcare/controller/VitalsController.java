package com.healthcare.controller;

import com.healthcare.service.VitalsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/vitals")
public class VitalsController {

    private final VitalsService vitalsService;

    public VitalsController(VitalsService vitalsService) {
        this.vitalsService = vitalsService;
    }

    @GetMapping("/history/{patientId}")
    public ResponseEntity<Map<String, Object>> getPatientHistory(
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "limit", defaultValue = "30") int limit
    ) {
        return ResponseEntity.ok(vitalsService.getPatientHistory(patientId, limit));
    }

    @GetMapping("/analytics/summary")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary() {
        return ResponseEntity.ok(vitalsService.getAnalyticsSummary());
    }
}
