package com.healthcare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.dto.DoctorAcknowledgeRequest;
import com.healthcare.dto.IngestionResponse;
import com.healthcare.dto.NearestHospitalResponse;
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
    private final HospitalService hospitalService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TriageService(UserRepository userRepository,
                         VitalsRepository vitalsRepository,
                         TriageRecordRepository triageRecordRepository,
                         WebSocketTelemetryHub telemetryHub,
                         HospitalService hospitalService) {
        this.userRepository = userRepository;
        this.vitalsRepository = vitalsRepository;
        this.triageRecordRepository = triageRecordRepository;
        this.telemetryHub = telemetryHub;
        this.hospitalService = hospitalService;
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
        String safetyUrgency = verifyClinicalSafety(payload);
        String symptomText = payload.getSymptomText() != null ? payload.getSymptomText().toLowerCase() : "";
        String lang = payload.getLanguageCode() != null ? payload.getLanguageCode() : "en-IN";

        int tier = 4;
        int esiScore = 5;
        int severityScore = 2;
        String tierTitle = "Tier 4: Routine Preventive Baseline";
        String conditionCategory = "General Medicine / Preventive Baseline";
        String actionWindow = "Self-monitoring over 3 to 5 days";
        String expectedRecovery = "Expected resolution in 3 to 5 days with supportive care";
        String hospitalRec = "HOME_CARE_ONLY";
        String hospitalBanner = "✅ HOME CARE RECOMMENDED — HOSPITAL VISIT NOT REQUIRED CURRENTLY";
        String facilityType = "Home Care / Local Community Wellness Center";
        String hospitalReason = "Symptoms or vitals represent mild or baseline indicators. Emergency hospital admission is not needed.";
        String englishSummary = "Routine health baseline. Normal clinical vitals screening.";
        String rationale = "Vitals are within clinically acceptable reference intervals.";

        List<String> immediateSteps = new ArrayList<>(List.of(
                "Rest well and get 7-8 hours of sound sleep.",
                "Stay hydrated with clean drinking water and fresh nutritious food.",
                "Monitor for any change in temperature, pain, or vitals over the next 48 hours."
        ));
        List<String> precautions = new ArrayList<>(List.of(
                "Do not take unprescribed antibiotics or heavy analgesics.",
                "Avoid unnecessary physical stress and dehydration."
        ));
        List<String> redFlags = new ArrayList<>(List.of(
                "Sudden sharp chest pain radiating to left arm or back.",
                "Sudden breathing difficulty, wheezing, or loss of balance.",
                "Fever rising above 101°F for more than 48 hours."
        ));

        String vernacularGuidance;
        String speechPhrase;

        // Clinical Symptom & Biometric Rule Matching
        if ("CRITICAL".equals(safetyUrgency) && (payload.getSystolicBp() != null && payload.getSystolicBp() >= 180)) {
            tier = 1;
            esiScore = 1;
            severityScore = 10;
            tierTitle = "Tier 1: Hypertensive Emergency / Immediate Hospital Transfer";
            conditionCategory = "Cardiovascular / Hypertensive Crisis";
            actionWindow = "Immediate (0 – 30 minutes)";
            expectedRecovery = "Requires urgent physician intervention to prevent end-organ damage";
            hospitalRec = "GO_TO_HOSPITAL_IMMEDIATELY";
            hospitalBanner = "🚨 GO TO HOSPITAL IMMEDIATELY — HYPERTENSIVE CRISIS";
            facilityType = "Emergency Department / Cardiac ICU";
            hospitalReason = "Systolic blood pressure >= 180 mmHg risks acute stroke, aortic dissection, or heart failure.";
            englishSummary = "Hypertensive Emergency: Severe blood pressure elevation detected.";
            rationale = "BP exceeds critical bound. Urgent intravenous antihypertensive protocol required.";
            immediateSteps = List.of(
                    "Sit quietly in a comfortable chair, do not move around.",
                    "Call 108 Emergency Ambulance immediately.",
                    "Take prescribed emergency BP tablet if previously advised by physician."
            );
            precautions = List.of("Do not exert or walk", "Do not consume extra salt or stimulants");
            redFlags = List.of("Severe headache, blurred vision, chest heaviness");
            vernacularGuidance = getLocalizedText("hypertension_critical", lang);
            speechPhrase = getLocalizedShortSpeech("hypertension_critical", lang);
        } else if ("CRITICAL".equals(safetyUrgency) && (payload.getSpo2() != null && payload.getSpo2() < 90)) {
            tier = 1;
            esiScore = 1;
            severityScore = 10;
            tierTitle = "Tier 1: Critical Respiratory Desaturation / Oxygen Support Needed";
            conditionCategory = "Pulmonary / Acute Hypoxia";
            actionWindow = "Immediate (0 – 15 minutes)";
            expectedRecovery = "Emergency supplemental oxygen and bronchodilator therapy needed";
            hospitalRec = "GO_TO_HOSPITAL_IMMEDIATELY";
            hospitalBanner = "🚨 GO TO HOSPITAL IMMEDIATELY — SEVERE HYPOXIA DETECTED";
            facilityType = "Hospital Emergency Room with High-Flow Oxygen Pipeline";
            hospitalReason = "Oxygen saturation below 90% leads to tissue hypoxia and organ failure.";
            englishSummary = "Critical Hypoxia: Blood oxygen saturation below 90%.";
            rationale = "Low SpO2 represents immediate respiratory compromise requiring urgent hospital transfer.";
            immediateSteps = List.of(
                    "Sit fully upright in tripod position.",
                    "Call 108 Emergency Ambulance for immediate oxygen support.",
                    "Administer rescue inhaler puffs if diagnosed with asthma."
            );
            precautions = List.of("Do not lie flat on your back", "Do not panic; breathe slowly");
            redFlags = List.of("Bluish lips, confusion, inability to speak full sentences");
            vernacularGuidance = getLocalizedText("breathing_critical", lang);
            speechPhrase = getLocalizedShortSpeech("breathing_critical", lang);
        } else if (matchesAny(symptomText, "chest pain", "heart", "left arm", "radiating", "angina", "ఛాతీ నొప్పి", "గుండె", "सीना", "நெஞ்சு வலி", "ಎದೆ ನೋವು")) {
            tier = 1;
            esiScore = 1;
            severityScore = 10;
            tierTitle = "Tier 1: Emergency Resuscitation / Suspected Cardiac Event";
            conditionCategory = "Cardiovascular / Acute Coronary Syndrome";
            actionWindow = "Immediate (0 – 15 minutes)";
            expectedRecovery = "Requires urgent emergency catheterization / cardiac ICU care";
            hospitalRec = "GO_TO_HOSPITAL_IMMEDIATELY";
            hospitalBanner = "🚨 GO TO HOSPITAL IMMEDIATELY — CALL 108 AMBULANCE";
            facilityType = "District Hospital / Cardiac Emergency Unit with ICCU";
            hospitalReason = "Symptoms indicate possible myocardial infarction. Immediate ECG and resuscitation needed.";
            englishSummary = "Acute Coronary Syndrome / Suspected Heart Attack detected.";
            rationale = "Chest pressure radiating to left arm is a primary red-flag cardiac marker.";
            immediateSteps = List.of(
                    "Stop physical exertion immediately and sit in half-sitting position.",
                    "Call 108 Emergency Ambulance immediately. Do not drive yourself.",
                    "Chew 300mg Soluble Aspirin if not allergic.",
                    "Loosen all tight clothing around neck and chest."
            );
            precautions = List.of("Do not assume this is simple gastric acid", "Do not walk or exert");
            redFlags = List.of("Pain radiating to jaw or left arm", "Profuse cold sweat", "Dizziness");
            vernacularGuidance = getLocalizedText("cardiac", lang);
            speechPhrase = getLocalizedShortSpeech("cardiac", lang);
        } else if (matchesAny(symptomText, "breath", "difficulty breathing", "asthma", "wheezing", "can't breathe", "suffocat", "శ్వాస", "दమ్ము", "सांस", "மூச்சு", "ಉಸಿರಾಟ")) {
            tier = 1;
            esiScore = 2;
            severityScore = 9;
            tierTitle = "Tier 1: Acute Respiratory Distress / Severe Bronchospasm";
            conditionCategory = "Pulmonary / Acute Respiratory Distress";
            actionWindow = "Immediate (0 – 30 minutes)";
            expectedRecovery = "Requires nebulization and supplemental oxygen";
            hospitalRec = "GO_TO_HOSPITAL_IMMEDIATELY";
            hospitalBanner = "🚨 GO TO HOSPITAL IMMEDIATELY — RESPIRATORY SUPPORT REQUIRED";
            facilityType = "Emergency Ward with Nebulizer & Oxygen Facility";
            hospitalReason = "Severe airway constriction poses imminent hypoxia risk.";
            englishSummary = "Acute Respiratory Distress / Severe Asthma detected.";
            rationale = "Airway compromise requires priority hospital emergency stabilization.";
            immediateSteps = List.of(
                    "Sit upright and lean slightly forward (tripod position).",
                    "Take 2-4 puffs of emergency rescue inhaler (Salbutamol) with spacer.",
                    "Ensure maximum fresh ventilation and call 108 for emergency transit."
            );
            precautions = List.of("Do not lie flat", "Do not crowd around patient");
            redFlags = List.of("Blue coloration of lips or nails", "Inability to speak complete words");
            vernacularGuidance = getLocalizedText("breathing_critical", lang);
            speechPhrase = getLocalizedShortSpeech("breathing_critical", lang);
        } else if (matchesAny(symptomText, "stroke", "paralysis", "face drooping", "speech", "slurred", "faint", "seizure", "fits", "పక్షవాతం", "లక్వా", "लकवा", "வலிப்பு", "ದೌರಾ")) {
            tier = 1;
            esiScore = 1;
            severityScore = 10;
            tierTitle = "Tier 1: Acute Neurological Emergency / Stroke FAST Protocol";
            conditionCategory = "Neurological / Stroke & Seizure";
            actionWindow = "Golden Hour (Immediate within 60 minutes)";
            expectedRecovery = "Requires CT Scan & thrombolysis within 3-4 hours";
            hospitalRec = "GO_TO_HOSPITAL_IMMEDIATELY";
            hospitalBanner = "🚨 GO TO HOSPITAL IMMEDIATELY — STROKE NEURO RESCUE";
            facilityType = "Hospital with 24/7 CT Scan & Emergency Neurology";
            hospitalReason = "Acute focal neurological signs risk permanent brain injury without urgent clot retrieval or anti-epileptic therapy.";
            englishSummary = "Suspected Stroke or Neurological Emergency detected.";
            rationale = "Sudden weakness, facial deviation, or seizures require emergency tertiary admission.";
            immediateSteps = List.of(
                    "Note the exact time symptoms started.",
                    "Turn patient onto their side in recovery position to protect airway.",
                    "Call 108 for immediate transport to CT-equipped hospital."
            );
            precautions = List.of("Do NOT give water, food, or oral tablets (choking risk)", "Do not restrain seizures");
            redFlags = List.of("Sudden loss of speech", "Repeated convulsions", "Loss of consciousness");
            vernacularGuidance = getLocalizedText("stroke", lang);
            speechPhrase = getLocalizedShortSpeech("stroke", lang);
        } else if (matchesAny(symptomText, "snake", "bite", "dog bite", "poison", "scorpion", "rabies", "పాము", "కుక్క", "सांप", "कुत्ता", "பாம்பு", "நாய்க்கடி", "ಹಾವು")) {
            tier = 1;
            esiScore = 1;
            severityScore = 9;
            tierTitle = "Tier 1: Envenomation / Animal Bite Post-Exposure Prophylaxis";
            conditionCategory = "Toxicology / Envenomation & Rabies";
            actionWindow = "Immediate (Within 30 minutes)";
            expectedRecovery = "Requires Polyvalent Antivenom (ASV) or Anti-Rabies Vaccine";
            hospitalRec = "GO_TO_HOSPITAL_IMMEDIATELY";
            hospitalBanner = "🚨 GO TO HOSPITAL IMMEDIATELY — ANTIVENOM / RABIES VACCINE REQUIRED";
            facilityType = "Government Area Hospital / CHC with Antivenom & Vaccine Stock";
            hospitalReason = "Venom spreading or rabies exposure requires immediate medical antidote administration.";
            englishSummary = "Bite or Envenomation Emergency requiring emergency hospital antidote.";
            rationale = "Acute envenomation / rabies exposure demands hospital triage and immobilization.";
            immediateSteps = List.of(
                    "For snake bite: Keep patient completely calm and still. Immobilize bitten limb with a splint.",
                    "For dog bite: Wash vigorously under running tap water with soap for 15 minutes.",
                    "Head straight to government hospital for Anti-Snake Venom or Anti-Rabies Vaccine."
            );
            precautions = List.of("Do NOT cut the bite wound or suck venom", "Do NOT apply tight tourniquets");
            redFlags = List.of("Drooping eyelids", "Difficulty swallowing or breathing", "Spontaneous bleeding");
            vernacularGuidance = getLocalizedText("bites", lang);
            speechPhrase = getLocalizedShortSpeech("bites", lang);
        } else if (matchesAny(symptomText, "fever", "chills", "dengue", "malaria", "typhoid", "temperature", "జ్వరం", "బుఖార్", "बुखार", "காய்ச்சல்", "ಜ್ವರ", "ताप", "জ্বর")) {
            tier = 2;
            esiScore = 3;
            severityScore = 7;
            tierTitle = "Tier 2: High Risk - Acute Febrile Illness / Vector-Borne Risk";
            conditionCategory = "Infectious Diseases / Acute Febrile Illness";
            actionWindow = "Same-day consultation (Within 12 – 24 hours)";
            expectedRecovery = "Resolves in 4 to 7 days with diagnostic CBC testing and antipyretics";
            hospitalRec = "VISIT_HOSPITAL_TODAY";
            hospitalBanner = "⚠️ VISIT HOSPITAL / PHC TODAY — DIAGNOSTIC BLOOD TEST RECOMMENDED";
            facilityType = "Nearest Primary Health Centre (PHC), CHC, or Area Hospital";
            hospitalReason = "Persistent fever with chills requires CBC, Dengue NS1, and Malarial smear to prevent complications.";
            englishSummary = "Acute Febrile Illness: Possible Dengue / Malaria / Vector-borne infection.";
            rationale = "Persistent fever requires laboratory investigation and hydration monitoring.";
            immediateSteps = List.of(
                    "Drink plenty of ORS, tender coconut water, and clean fluids (at least 2.5 liters daily).",
                    "Do tepid sponging with normal water cloth on forehead and neck.",
                    "Take Paracetamol (500mg-650mg) for fever > 100°F if recommended.",
                    "Visit nearest PHC today for blood test (CBC & malaria smear)."
            );
            precautions = List.of("Do NOT take Brufen, Aspirin, or Combiflam (bleed risk in Dengue)", "Do not use ice cold water");
            redFlags = List.of("Bleeding from gums or nose", "Persistent vomiting", "Extreme drowsiness");
            vernacularGuidance = getLocalizedText("fever", lang);
            speechPhrase = getLocalizedShortSpeech("fever", lang);
        } else if (matchesAny(symptomText, "stomach", "vomit", "diarrhea", "loose motion", "belly", "abdominal", "కడుపు", "విరేచనాలు", "వాంతులు", "पेट", "दस्त", "उल्टी", "வயிறு", "ಹೊಟ್ಟೆ", "পোট", "পেট")) {
            tier = 2;
            esiScore = 3;
            severityScore = 6;
            tierTitle = "Tier 2: Acute Gastroenteritis / Dehydration Risk";
            conditionCategory = "Gastroenterology / Acute Gastroenteritis";
            actionWindow = "Consult within 12 – 24 hours (Immediate if unable to keep fluids)";
            expectedRecovery = "Resolves in 2 to 4 days with electrolyte hydration";
            hospitalRec = "VISIT_HOSPITAL_TODAY";
            hospitalBanner = "⚠️ VISIT HOSPITAL / PHC IF UNABLE TO RETAIN FLUIDS OR HIGH PAIN";
            facilityType = "Primary Health Centre / Community Health Centre (CHC)";
            hospitalReason = "Fluid loss from vomiting or diarrhea causes rapid electrolyte depletion and dehydration shock.";
            englishSummary = "Acute Gastroenteritis / Dehydration Risk detected.";
            rationale = "Fluid loss demands ORS oral rehydration therapy and clinical exclusion of bacterial dysentery.";
            immediateSteps = List.of(
                    "Prepare ORS (1 packet in 1 liter clean water) and sip after every loose stool.",
                    "Eat light bland foods: curd rice, ripe bananas, boiled potatoes.",
                    "If continuous vomiting prevents drinking fluids, visit clinic for IV fluids."
            );
            precautions = List.of("Do not eat spicy or street food", "Avoid painkillers that irritate stomach");
            redFlags = List.of("Blood in vomit or stools", "Severe lower right belly pain", "No urine for 8 hours");
            vernacularGuidance = getLocalizedText("gastro", lang);
            speechPhrase = getLocalizedShortSpeech("gastro", lang);
        } else if (matchesAny(symptomText, "sugar", "diabetes", "glucose", "షుగర్", "మధుమేహం", "मधुमेह", "शुगर", "சர்க்கரை", "ಸಕ್ಕರೆ", "ডায়াবেটিস")) {
            tier = 2;
            esiScore = 3;
            severityScore = 7;
            tierTitle = "Tier 2: Glycemic Imbalance / Diabetic Consultation Required";
            conditionCategory = "Endocrinology / Diabetic Glycemic Dysregulation";
            actionWindow = "Immediate 15 mins (for low sugar) / Within 24 hours (for high sugar)";
            expectedRecovery = "Requires medication review and clinical glycemic control";
            hospitalRec = "VISIT_HOSPITAL_TODAY";
            hospitalBanner = "⚠️ DIABETIC RISK — CHECK BLOOD GLUCOSE & CONSULT PHYSICIAN";
            facilityType = "Primary Health Centre / District NCD Clinic";
            hospitalReason = "Significant glucose fluctuation requires prescription review to prevent ketoacidosis or hypoglycemia.";
            englishSummary = "Diabetic Glycemic Dysregulation detected.";
            rationale = "Abnormal blood sugar levels require clinical management.";
            immediateSteps = List.of(
                    "If feeling shaky or trembling (Low Sugar): Eat 3 teaspoons of sugar or sweets immediately.",
                    "If High Sugar: Drink plenty of water and take regular prescribed medication.",
                    "Visit nearest PHC NCD clinic for doctor checkup."
            );
            precautions = List.of("Do not skip meals after taking diabetes tablets", "Do not drive when shaky");
            redFlags = List.of("Fruity breath odor", "Extreme drowsiness", "Sugar > 350 mg/dL or < 60 mg/dL");
            vernacularGuidance = getLocalizedText("diabetes", lang);
            speechPhrase = getLocalizedShortSpeech("diabetes", lang);
        } else if (matchesAny(symptomText, "mild headache", "cold", "runny nose", "sore throat", "cough", "sneez", "tired", "తేలికపాటి", "జలుబు", "తలనొప్పి", "सिरदर्द", "जुकाम", "सर्दी", "தலைவலி", "சளி", "ನೆಗಡಿ", "सर्द")) {
            tier = 4;
            esiScore = 5;
            severityScore = 2;
            tierTitle = "Tier 4: Mild Tension Headache / Common Cold";
            conditionCategory = "General Medicine / Minor Self-Limiting Condition";
            actionWindow = "Self-monitoring over 3 to 5 days";
            expectedRecovery = "Expected full recovery within 3 to 5 days with simple home care and rest";
            hospitalRec = "HOME_CARE_ONLY";
            hospitalBanner = "✅ HOME CARE RECOMMENDED — HOSPITAL VISIT NOT REQUIRED CURRENTLY";
            facilityType = "Home Care / Local Community Wellness";
            hospitalReason = "Symptoms represent a common mild cold or tension headache. Hospital emergency visit is unnecessary.";
            englishSummary = "Mild Tension Headache / Common Cold (Self-Limiting condition).";
            rationale = "Symptoms are benign and self-limiting. Supportive home fluids and rest are sufficient.";
            immediateSteps = List.of(
                    "Rest adequately and sleep 7 to 8 hours.",
                    "Drink warm water, herbal ginger tea, and warm soups.",
                    "Steam inhalation twice daily for nasal congestion.",
                    "Warm salt water gargling 3 times daily for throat irritation."
            );
            precautions = List.of("Do not take unnecessary antibiotics", "Avoid cold items and heavy screen time");
            redFlags = List.of("Sudden explosive thunderclap headache", "Fever rising above 101°F > 3 days");
            vernacularGuidance = getLocalizedText("mild", lang);
            speechPhrase = getLocalizedShortSpeech("mild", lang);
        } else {
            // General condition
            tier = 3;
            esiScore = 4;
            severityScore = 4;
            tierTitle = "Tier 3: Clinical Outpatient Evaluation";
            conditionCategory = "General Clinical Consultation";
            actionWindow = "Consult healthcare provider within 24 to 48 hours";
            expectedRecovery = "Assessment and observation recommended over 2 to 3 days";
            hospitalRec = "CONSULT_CLINIC_IF_PERSISTS";
            hospitalBanner = "ℹ️ CONSULT NEARBY CLINIC / PHC IF SYMPTOMS PERSIST OVER 48 HOURS";
            facilityType = "Nearest Primary Health Centre (PHC) or Local Clinic";
            hospitalReason = "Symptoms require standard clinical checkup by a medical officer.";
            englishSummary = "Clinical consultation recommended based on reported health symptoms.";
            rationale = "Non-emergency symptom profile. Outpatient observation advised.";
            vernacularGuidance = getLocalizedText("general", lang);
            speechPhrase = getLocalizedShortSpeech("general", lang);
        }

        String urgency = tier == 1 ? "CRITICAL" : (tier == 2 ? "HIGH" : (tier == 3 ? "MODERATE" : "NORMAL"));

        // 1. Ensure user exists
        User user = userRepository.findById(payload.getPatientId()).orElse(null);
        if (user == null) {
            user = new User();
            user.setId(payload.getPatientId());
            user.setFullName("Rural Citizen #" + payload.getPatientId().substring(0, Math.min(6, payload.getPatientId().length())));
            user.setPhoneHash("PH-" + UUID.randomUUID().toString().substring(0, 8));
            user.setVillageCode(payload.getDistrictCode() != null ? payload.getDistrictCode() : "VIL-ANDHRA-01");
            user.setRole("Patient");
            user.setPreferredLang(lang);
            user = userRepository.save(user);
        }

        // 2. Save vitals timeseries
        VitalsTimeseries vitalsEntry = new VitalsTimeseries(
                user.getId(),
                payload.getSystolicBp(),
                payload.getDiastolicBp(),
                payload.getSpo2(),
                payload.getGlucoseMgDl(),
                urgency
        );
        vitalsRepository.save(vitalsEntry);

        // 3. Clinical Entities
        List<IngestionResponse.ClinicalEntity> entities = new ArrayList<>();
        entities.add(new IngestionResponse.ClinicalEntity(conditionCategory, "Current evaluation", tier <= 2 ? "critical" : "moderate", tier <= 2));
        if (payload.getSystolicBp() != null && payload.getSystolicBp() >= 140) {
            entities.add(new IngestionResponse.ClinicalEntity("Elevated BP (" + payload.getSystolicBp() + "/" + payload.getDiastolicBp() + " mmHg)", "Current reading", "HIGH".equals(urgency) ? "moderate" : "critical", "CRITICAL".equals(urgency)));
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

        // 4. Find Nearest Hospital based on user coordinates if available
        NearestHospitalResponse.NearestHospitalItem nearestHospitalItem = null;
        try {
            Double lat = payload.getUserLat();
            Double lng = payload.getUserLng();
            String locName = payload.getUserLocationName() != null ? payload.getUserLocationName() : payload.getDistrictCode();
            NearestHospitalResponse hospResp = hospitalService.getNearestHospitals(lat, lng, locName, 3);
            if (hospResp != null && hospResp.getNearestHospital() != null) {
                nearestHospitalItem = hospResp.getNearestHospital();
            }
        } catch (Exception ignored) {}

        // 5. Broadcast to Doctor Telemetry Feed
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

        // 6. Build DTO Response
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
        triage.setSpeechPhrase(speechPhrase);
        triage.setEnglishSummary(englishSummary);
        triage.setSafetyRuleTriggered("CRITICAL".equals(urgency) ? "CRITICAL_BOUND_EXCEEDED" : null);
        triage.setPrescriptionsBlocked(tier <= 2 ? List.of("Vasodilator Beta-Blockers", "Empirical Antibiotics") : List.of());
        triage.setActionsTaken(List.of("Pattern Triage Evaluated", "Location Hospital Geocoded", "Doctor Telemetry Streamed"));
        triage.setPhcDispatchNeeded(tier <= 2);
        triage.setEmergencyBroadcastActive("CRITICAL".equals(urgency));

        // Rich clinical triage additions
        triage.setSeverityRange(new IngestionResponse.SeverityRange(
                severityScore,
                tier == 1 ? "Critical Emergency" : (tier == 2 ? "High Risk - Urgent" : (tier == 3 ? "Moderate Risk" : "Mild - Low Risk")),
                conditionCategory,
                actionWindow,
                expectedRecovery
        ));

        triage.setHospitalGuidance(new IngestionResponse.HospitalGuidance(
                hospitalRec,
                hospitalBanner,
                tier == 1 ? "Critical" : (tier == 2 ? "Urgent" : (tier == 3 ? "Moderate" : "Home Care")),
                facilityType,
                hospitalReason
        ));

        triage.setWhatToDoNext(new IngestionResponse.WhatToDoNext(
                immediateSteps,
                precautions,
                redFlags,
                tier == 4 ? List.of("Warm ginger tea", "Steam inhalation", "Adequate hydration") : List.of()
        ));

        triage.setNearestHospitalRecommendation(nearestHospitalItem);

        response.setTriage(triage);
        response.setOfflineFallbackSms("sms:108?body=" + user.getId() + "%20" + urgency);

        return response;
    }

    private boolean matchesAny(String text, String... keywords) {
        if (text == null || text.isEmpty()) return false;
        for (String kw : keywords) {
            if (text.contains(kw.toLowerCase())) return true;
        }
        return false;
    }

    private String getLocalizedText(String condition, String lang) {
        if ("cardiac".equals(condition)) {
            if ("te-IN".equals(lang)) return "అత్యవసర హెచ్చరిక: తీవ్రమైన ఛాతీ నొప్పి గుర్తించబడింది. వెంటనే 108 అంబులెన్స్‌కు కాల్ చేయండి. నిశ్శబ్దంగా కూర్చోండి, శ్రమ చేయకండి.";
            if ("hi-IN".equals(lang)) return "आपातकालीन चेतावनी: सीने में तेज़ दर्द के लक्षण मिले हैं। तुरंत 108 एम्बुलेंस को कॉल करें। शांत होकर बैठ जाएं, कपड़े ढीले करें।";
            if ("ta-IN".equals(lang)) return "அவசர எச்சரிக்கை: கடுமையான நெஞ்சு வலி கண்டறியப்பட்டது. உடனடியாக 108 ஆம்புலன்ஸை அழைக்கவும். அமைதியாக அமரவும்.";
            if ("kn-IN".equals(lang)) return "ತುರ್ತು ಎಚ್ಚರಿಕೆ: ಎದೆಯಲ್ಲಿ ತೀವ್ರವಾದ ನೋವು ಕಾಣಿಸಿಕೊಂಡಿದೆ. ತಕ್ಷಣವೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ.";
            if ("mr-IN".equals(lang)) return "तातडीचा इशारा: छातीत तीव्र वेदना जाणवत आहेत. ताबडतोब 108 रुग्णवाहिकेला कॉल करा.";
            if ("bn-IN".equals(lang)) return "জরুরি সতর্কতা: বুকে তীব্র ব্যথা শনাক্ত হয়েছে। অবিলম্বে 108 অ্যাম্বুলেন্সে কল করুন।";
            return "Critical Emergency: Severe chest pain detected. Call 108 ambulance immediately. Sit down, loosen tight clothes, and do not exert.";
        }
        if ("breathing_critical".equals(condition)) {
            if ("te-IN".equals(lang)) return "తీవ్ర సమస్య: శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది ఉంది. నిటారుగా కూర్చోండి, వెంటనే ఆక్సిజన్ సదుపాయం ఉన్న ఆసుపత్రికి వెళ్ళండి.";
            if ("hi-IN".equals(lang)) return "गंभीर स्थिति: सांस लेने में अत्यधिक कठिनाई हो रही है। सीधे बैठें और तुरंत ऑक्सीजन सुविधा वाले अस्पताल जाएं।";
            return "Critical: Severe breathing difficulty detected. Sit upright and proceed immediately to hospital emergency for oxygen support.";
        }
        if ("stroke".equals(condition)) {
            if ("te-IN".equals(lang)) return "అత్యవసర హెచ్చరిక: పక్షవాతం లక్షణాలు ఉన్నాయి. రోగికి నీరు లేదా ఆహారం ఇవ్వవద్దు, వెంటనే సిటీ స్కాన్ ఉన్న ఆసుపత్రికి తీసుకెళ్లండి.";
            if ("hi-IN".equals(lang)) return "आपातकालीन चेतावनी: लकवा के लक्षण दिखे हैं। मरीज को पानी या खाना न दें और तुरंत अस्पताल ले जाएं।";
            return "Critical Emergency: Acute stroke warning signs detected. Do not give water or food, and rush to CT-scan hospital immediately.";
        }
        if ("bites".equals(condition)) {
            if ("te-IN".equals(lang)) return "అత్యవసర హెచ్చరిక: పాము లేదా జంతువు కాటు గుర్తించబడింది. గాయాన్ని కదల్చకండి, తక్షణమే యాంటీ-వీనమ్ ఉన్న ప్రభుత్వ ఆసుపత్రికి వెళ్ళండి.";
            if ("hi-IN".equals(lang)) return "आपातकालीन चेतावनी: सांप या जानवर के काटने का मामला। तुरंत सरकारी अस्पताल जाएं।";
            return "Critical Emergency: Bite or poisoning detected. Keep patient still and rush to government hospital for antivenom.";
        }
        if ("fever".equals(condition)) {
            if ("te-IN".equals(lang)) return "అధిక ప్రమాదం: చలితో కూడిన తీవ్ర జ్వరం ఉంది. రక్త పరీక్షల కోసం ఈరోజే దగ్గరి పిహెచ్‌సి లేదా ఆసుపత్రిని సంప్రదించండి. ద్రవాలు ఎక్కువగా తాగండి.";
            if ("hi-IN".equals(lang)) return "उच्च जोखिम: ठंड के साथ तेज़ बुखार है। खून की जांच के लिए आज ही नज़दीकी पीएचसी या अस्पताल जाएं।";
            return "High Risk: Persistent high fever with chills detected. Visit your nearest hospital or PHC today for blood tests. Drink plenty of fluids.";
        }
        if ("gastro".equals(condition)) {
            if ("te-IN".equals(lang)) return "శ్రద్ధ వహించండి: కడుపు నొప్పి లేదా విరేచనాలు ఉన్నాయి. ప్రతిసారీ ఓఆర్ఎస్ ద్రావణం తాగండి. వాంతులు ఆగకపోతే ఆసుపత్రికి వెళ్ళండి.";
            if ("hi-IN".equals(lang)) return "सावधानी: पेट दर्द या दस्त/उल्टी की समस्या। हर दस्त के बाद ओआरएस का घोल पिएं और समस्या बढ़ने पर अस्पताल जाएं।";
            return "Urgent: Acute stomach pain or diarrhea detected. Start ORS electrolyte water immediately and visit clinic if unable to retain fluids.";
        }
        if ("diabetes".equals(condition)) {
            if ("te-IN".equals(lang)) return "షుగర్ హెచ్చరిక: రక్తంలో చక్కెర స్థాయిల్లో మార్పు ఉంది. నీరసం లేదా వణుకు ఉంటే వెంటనే చక్కెర తినండి, ఈరోజే డాక్టర్‌ను కలవండి.";
            if ("hi-IN".equals(lang)) return "डायबिटीज अलर्ट: ब्लड शुगर में असंतुलन। चक्कर या कंपन होने पर तुरंत मीठा लें और डॉक्टर से मिलें।";
            return "Diabetes Alert: Abnormal blood sugar detected. For low sugar take sweets immediately. Consult your PHC doctor today.";
        }
        if ("hypertension_critical".equals(condition)) {
            if ("te-IN".equals(lang)) return "అత్యవసర హెచ్చరిక: ప్రమాదకరమైన అధిక రక్తపోటు గుర్తించబడింది. వెంటనే ఆసుపత్రి అత్యవసర విభాగానికి వెళ్లండి.";
            if ("hi-IN".equals(lang)) return "आपातकालीन चेतावनी: अत्यधिक बढ़ा हुआ रक्तचाप। तुरंत अस्पताल की इमरजेंसी में जाएं।";
            return "Critical Warning: Severe hypertensive crisis detected. Seek immediate emergency medical care.";
        }
        if ("mild".equals(condition)) {
            if ("te-IN".equals(lang)) return "సాధారణ సమస్య: తేలికపాటి తలనొప్పి లేదా జలుబు గుర్తించబడింది. ఆసుపత్రికి వెళ్లవలసిన అవసరం లేదు. విశ్రాంతి తీసుకోండి, గోరువెచ్చని నీరు తాగండి.";
            if ("hi-IN".equals(lang)) return "सामान्य स्थिति: हल्का सिरदर्द या सामान्य जुकाम। अस्पताल जाने की आवश्यकता नहीं है। पर्याप्त आराम करें और गुनगुना पानी पिएं।";
            return "Mild Condition: Common cold or mild headache detected. Hospital visit is not required. Take adequate rest and drink warm fluids.";
        }
        if ("te-IN".equals(lang)) return "ఆరోగ్య సమాచారం: మీ సమస్య పరిశీలించబడింది. ప్రస్తుతానికి విశ్రాంతి తీసుకోండి, తగ్గకపోతే దగ్గరి పిహెచ్‌సిలో వైద్యుడిని సంప్రదించండి.";
        if ("hi-IN".equals(lang)) return "स्वास्थ्य सलाह: समस्या का विश्लेषण किया गया है। आराम करें और नज़दीकी स्वास्थ्य केंद्र में डॉक्टर से मिलें।";
        return "Health Notice: Your symptoms have been evaluated. Take adequate rest and consult your nearby healthcare provider if symptoms persist.";
    }

    private String getLocalizedShortSpeech(String condition, String lang) {
        if ("cardiac".equals(condition)) {
            if ("te-IN".equals(lang)) return "అత్యవసర హెచ్చరిక. తీవ్రమైన ఛాతీ నొప్పి ఉంది. వెంటనే 108 కి కాల్ చేయండి.";
            if ("hi-IN".equals(lang)) return "आपातकालीन चेतावनी. सीने में तेज़ दर्द है. तुरंत 108 पर कॉल करें.";
            return "Critical emergency. Severe chest pain detected. Call 108 immediately.";
        }
        if ("breathing_critical".equals(condition)) {
            if ("te-IN".equals(lang)) return "శ్వాస ఆడటం కష్టంగా ఉంది. నిటారుగా కూర్చోండి, వెంటనే ఆసుపత్రికి వెళ్ళండి.";
            return "Severe breathing difficulty. Sit upright and head to hospital emergency immediately.";
        }
        if ("fever".equals(condition)) {
            if ("te-IN".equals(lang)) return "తీవ్ర జ్వరం ఉంది. ఈరోజే రక్త పరీక్షల కోసం ఆసుపత్రికి వెళ్ళండి.";
            return "Persistent high fever detected. Visit nearest PHC today for blood tests.";
        }
        if ("gastro".equals(condition)) {
            if ("te-IN".equals(lang)) return "కడుపు నొప్పి లేదా విరేచనాలు ఉన్నాయి. ఓఆర్ఎస్ నీరు వెంటనే తాగండి.";
            return "Stomach pain and dehydration risk detected. Drink ORS electrolyte water immediately.";
        }
        if ("mild".equals(condition)) {
            if ("te-IN".equals(lang)) return "సాధారణ తలనొప్పి లేదా జలుబు. ఆసుపత్రికి వెళ్ళాల్సిన పనిలేదు. విశ్రాంతి తీసుకోండి.";
            return "Mild common cold or headache. Hospital visit not needed. Rest well.";
        }
        if ("te-IN".equals(lang)) return "మీ సమస్య నమోదు చేయబడింది. విశ్రాంతి తీసుకోండి.";
        return "Your symptoms have been recorded. Take rest and visit your clinic if problems continue.";
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
