package com.healthcare.service;

import com.healthcare.entity.VitalsTimeseries;
import com.healthcare.repository.VitalsRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VitalsService {

    private final VitalsRepository vitalsRepository;

    public VitalsService(VitalsRepository vitalsRepository) {
        this.vitalsRepository = vitalsRepository;
    }

    public Map<String, Object> getPatientHistory(String patientId, int limit) {
        List<VitalsTimeseries> entries = vitalsRepository.findByUserIdOrderByRecordedAtDesc(
                patientId,
                PageRequest.of(0, Math.min(limit, 100))
        );

        // Reverse so it's in chronological order for charting
        Collections.reverse(entries);

        List<Map<String, Object>> results = new ArrayList<>();
        for (VitalsTimeseries v : entries) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", v.getId());
            map.put("recorded_at", v.getRecordedAt() != null ? v.getRecordedAt().toString() : null);
            map.put("systolic", v.getSystolic());
            map.put("diastolic", v.getDiastolic());
            map.put("spo2", v.getSpo2());
            map.put("glucose", v.getGlucose());
            map.put("urgency_level", v.getUrgencyLevel());
            results.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("patient_id", patientId);
        response.put("count", results.size());
        response.put("history", results);
        return response;
    }

    public Map<String, Object> getAnalyticsSummary() {
        long total = vitalsRepository.count();
        long critical = vitalsRepository.countByUrgencyLevel("CRITICAL");
        long high = vitalsRepository.countByUrgencyLevel("HIGH");
        long normal = vitalsRepository.countByUrgencyLevel("NORMAL");

        double ratio = total > 0 ? ((double) high / total) * 100.0 : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("total_screenings", total);
        summary.put("critical_cases", critical);
        summary.put("high_risk_cases", high);
        summary.put("baseline_screenings", normal);
        summary.put("hypertension_prevented_ratio", String.format("%.1f%%", ratio));
        return summary;
    }
}
