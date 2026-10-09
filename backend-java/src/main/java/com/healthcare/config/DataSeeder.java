package com.healthcare.config;

import com.healthcare.entity.HospitalRegistry;
import com.healthcare.entity.User;
import com.healthcare.entity.VitalsTimeseries;
import com.healthcare.repository.HospitalRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.repository.VitalsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final VitalsRepository vitalsRepository;

    public DataSeeder(HospitalRepository hospitalRepository,
                      UserRepository userRepository,
                      VitalsRepository vitalsRepository) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.vitalsRepository = vitalsRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Seed hospitals
        if (hospitalRepository.count() == 0) {
            log.info("Seeding initial rural demonstration hospitals into SQL database...");

            HospitalRegistry rims = new HospitalRegistry(
                    "gov-rims-adilabad",
                    "Rajiv Gandhi Institute of Medical Sciences (RIMS) & District Hospital",
                    "DIST-ADILABAD-01",
                    "+91-8732-220108",
                    19.6641,
                    78.5320
            );
            rims.setAddress("National Highway 44, Collectorate Road, Adilabad, Telangana - 504001");
            rims.setGeneralPhone("+91-8732-226999");
            rims.setFacilitiesJson("[\"24/7 Emergency Casualty & Trauma Care\", \"Intensive Care Unit (ICU)\", \"Free Blood Bank\", \"Jan Aushadhi Generic Pharmacy\"]");
            rims.setIsOpen24x7(true);
            rims.setAyushmanEmpaneled(true);

            HospitalRegistry phc = new HospitalRegistry(
                    "gov-phc-rural",
                    "Adilabad Rural Primary Health Centre (Cluster 104 PHC)",
                    "DIST-ADILABAD-RURAL",
                    "+91-8732-221104",
                    19.6450,
                    78.5250
            );
            phc.setAddress("PHC Compound, Mavala Village, Adilabad Rural - 504002");
            phc.setGeneralPhone("+91-8732-221105");
            phc.setFacilitiesJson("[\"Free NCD Screenings (BP & Diabetes)\", \"Routine Immunization\", \"First Aid & Dressing\", \"ASHA Coordination\"]");
            phc.setIsOpen24x7(false);
            phc.setAyushmanEmpaneled(true);

            HospitalRegistry utnoor = new HospitalRegistry(
                    "gov-chc-utnoor",
                    "Utnoor Community Health Centre (CHC & Tribal Specialty Centre)",
                    "DIST-UTNOOR-02",
                    "+91-8731-274100",
                    19.3670,
                    78.7830
            );
            utnoor.setAddress("Near ITDA Office, Main Road, Utnoor, Adilabad - 504311");
            utnoor.setFacilitiesJson("[\"24/7 Snakebite Antivenom Unit\", \"Maternal & Child Health Wing\", \"Oxygen Pipeline Beds\"]");
            utnoor.setIsOpen24x7(true);
            utnoor.setAyushmanEmpaneled(true);

            hospitalRepository.saveAll(List.of(rims, phc, utnoor));
            log.info("Successfully seeded {} demonstration hospitals into SQL.", hospitalRepository.count());
        }

        // 2. Seed initial sample patients
        if (userRepository.count() == 0) {
            log.info("Seeding initial demo patient & doctor into SQL database...");

            User patient1 = new User("pat-demo-001", "Lakshmi Devi", "HASH-98480123", "VIL-ADILABAD-104", "Patient", "te-IN");
            patient1.setLatitude(19.6641);
            patient1.setLongitude(78.5320);
            patient1.setLocationName("Adilabad Rural (Cluster 104)");

            User doctor1 = new User("doc-demo-001", "Dr. Sunita K., MD (Community Medicine)", "HASH-94401122", "DIST-ADILABAD-01", "Doctor", "en-IN");
            doctor1.setLatitude(19.6641);
            doctor1.setLongitude(78.5320);

            userRepository.saveAll(List.of(patient1, doctor1));

            // Seed historical readings for Lakshmi Devi
            VitalsTimeseries v1 = new VitalsTimeseries(patient1.getId(), 128, 82, 98, 110, "NORMAL");
            VitalsTimeseries v2 = new VitalsTimeseries(patient1.getId(), 135, 86, 97, 124, "MODERATE");
            VitalsTimeseries v3 = new VitalsTimeseries(patient1.getId(), 148, 94, 95, 145, "HIGH");

            vitalsRepository.saveAll(List.of(v1, v2, v3));
            log.info("Demo patient and historical vitals seeded successfully.");
        }
    }
}
