package com.healthcare.controller;

import com.healthcare.dto.NearestHospitalResponse;
import com.healthcare.entity.HospitalRegistry;
import com.healthcare.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping("/")
    public ResponseEntity<List<HospitalRegistry>> listHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/nearest")
    public ResponseEntity<NearestHospitalResponse> getNearest(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "village", required = false) String village,
            @RequestParam(value = "limit", defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(hospitalService.getNearestHospitals(lat, lng, village, limit));
    }
}
