package com.healthcare.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.dto.NearestHospitalResponse;
import com.healthcare.entity.HospitalRegistry;
import com.healthcare.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Rural coordinates presets
    private static final Map<String, double[]> VILLAGE_COORDS = Map.of(
            "Adilabad Rural (Cluster 104)", new double[]{19.6641, 78.5320},
            "Asifabad Sector 2 (Komaram Bheem)", new double[]{19.3600, 79.2800},
            "Utnoor Tribal Cluster (ITDA)", new double[]{19.3667, 78.7833},
            "Nirmal Town Mandal", new double[]{19.0964, 78.3434},
            "Bela Border Hamlet", new double[]{19.7800, 78.8000},
            "Hyderabad / Secunderabad", new double[]{17.3850, 78.4867}
    );

    public HospitalService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public List<HospitalRegistry> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((R * c) * 100.0) / 100.0;
    }

    public int estimateAmbulanceTravelTime(double distanceKm) {
        int travelMins = (int) Math.round((distanceKm / 45.0) * 60) + 3;
        return Math.max(4, travelMins);
    }

    public NearestHospitalResponse getNearestHospitals(Double lat, Double lng, String village, int limit) {
        double userLat;
        double userLng;
        String source;
        String locName;

        if (lat != null && lng != null) {
            userLat = lat;
            userLng = lng;
            source = "gps";
            locName = village != null ? village : String.format("GPS (%.4f, %.4f)", lat, lng);
        } else if (village != null && VILLAGE_COORDS.containsKey(village)) {
            double[] coords = VILLAGE_COORDS.get(village);
            userLat = coords[0];
            userLng = coords[1];
            source = "village_preset";
            locName = village;
        } else {
            // Default Adilabad Rural
            userLat = 19.6641;
            userLng = 78.5320;
            source = "default_fallback";
            locName = "Adilabad Rural (Cluster 104)";
        }

        List<HospitalRegistry> all = hospitalRepository.findAll();
        List<NearestHospitalResponse.NearestHospitalItem> items = new ArrayList<>();

        for (HospitalRegistry h : all) {
            if (h.getLatitude() == null || h.getLongitude() == null) continue;
            double dist = calculateHaversineDistance(userLat, userLng, h.getLatitude(), h.getLongitude());
            int mins = estimateAmbulanceTravelTime(dist);

            NearestHospitalResponse.NearestHospitalItem item = new NearestHospitalResponse.NearestHospitalItem();
            item.setId(h.getId());
            item.setName(h.getName());
            item.setHospitalType(h.getHospitalType());
            item.setDistrictCode(h.getDistrictCode());
            item.setAddress(h.getAddress());
            item.setDistanceKm(dist);
            item.setEstimatedTimeMins(mins);
            item.setEmergencyPhone(h.getEmergencyPhone());
            item.setGeneralPhone(h.getGeneralPhone());
            item.setAmbulancePhone(h.getAmbulancePhone());
            item.setIsOpen24x7(h.getIsOpen24x7());
            item.setOpdTimings(h.getOpdTimings());
            item.setAyushmanEmpaneled(h.getAyushmanEmpaneled());
            item.setGoogleMapsUrl("https://www.google.com/maps/dir/?api=1&destination=" + h.getLatitude() + "," + h.getLongitude());

            List<String> facilities = new ArrayList<>();
            if (h.getFacilitiesJson() != null) {
                try {
                    facilities = objectMapper.readValue(h.getFacilitiesJson(), new TypeReference<List<String>>() {});
                } catch (Exception ignored) {}
            }
            item.setFacilities(facilities);

            Map<String, String> contact = new HashMap<>();
            contact.put("emergency", "Call " + h.getEmergencyPhone() + " or dial 108");
            contact.put("opdAppointment", "Walk-in consultation available during OPD hours");
            contact.put("ambulanceSupport", "108 ambulance dispatch available directly to village");
            item.setHowToContact(contact);

            items.add(item);
        }

        // Sort by distance ascending
        items.sort(Comparator.comparingDouble(NearestHospitalResponse.NearestHospitalItem::getDistanceKm));

        NearestHospitalResponse resp = new NearestHospitalResponse();
        resp.setUserLocation(new NearestHospitalResponse.UserLocation(userLat, userLng, source, locName));

        if (!items.isEmpty()) {
            resp.setNearestHospital(items.get(0));
            resp.setNearbyHospitals(items.stream().limit(Math.min(limit, items.size())).toList());
        }

        Map<String, String> helplines = new LinkedHashMap<>();
        helplines.put("emergencyAmbulance", "108");
        helplines.put("maternalJanani", "102");
        helplines.put("disasterHelpline", "1077");
        helplines.put("ayushmanBharat", "14555");
        resp.setEmergencyHelplines(helplines);

        return resp;
    }
}
