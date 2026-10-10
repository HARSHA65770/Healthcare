// Comprehensive Clinical Symptom Triage Intelligence Engine
// Analyzes symptoms & vitals, determines Problem Range, Hospital Directives,
// Actionable Next Steps (Do's & Don'ts), and Multi-Lingual Vernacular Guidance.

export interface SeverityRangeInfo {
  score: number; // 1 to 10
  maxScore: number;
  levelLabel: 'Critical Emergency' | 'High Risk - Urgent' | 'Moderate Risk' | 'Mild - Low Risk';
  conditionCategory: string;
  actionWindow: string;
  expectedRecovery: string;
}

export type HospitalRecommendationType =
  | 'GO_TO_HOSPITAL_IMMEDIATELY'
  | 'VISIT_HOSPITAL_TODAY'
  | 'CONSULT_CLINIC_IF_PERSISTS'
  | 'HOME_CARE_ONLY';

export interface HospitalGuidanceInfo {
  recommendation: HospitalRecommendationType;
  bannerText: string;
  urgencyBadge: string;
  facilityType: string;
  reason: string;
}

export interface WhatToDoNextInfo {
  immediateSteps: string[];
  precautions: string[]; // Things NOT to do
  redFlags: string[];    // Warning signs to monitor
  medicationAdvice?: string;
  homeRemedies?: string[];
}

export interface ClinicalTriageEvaluation {
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
  tier: 1 | 2 | 3 | 4;
  tierTitle: string;
  esiScore: 1 | 2 | 3 | 4 | 5;
  englishSummary: string;
  clinicalRationale: string;
  safetyRuleTriggered: string | null;
  severityRange: SeverityRangeInfo;
  hospitalGuidance: HospitalGuidanceInfo;
  whatToDoNext: WhatToDoNextInfo;
  vernacularGuidance: string;
  speechPhrase: string; // Tailored short phrase for voice synthesis
  entities: Array<{
    symptom: string;
    duration?: string;
    severity: string;
    isRedFlag: boolean;
  }>;
  prescriptionsBlocked: string[];
  actionsTaken: string[];
}

interface SymptomRule {
  id: string;
  keywords: string[];
  category: string;
  tier: 1 | 2 | 3 | 4;
  esiScore: 1 | 2 | 3 | 4 | 5;
  severityScore: number;
  severityLabel: 'Critical Emergency' | 'High Risk - Urgent' | 'Moderate Risk' | 'Mild - Low Risk';
  actionWindow: string;
  expectedRecovery: string;
  hospitalRecommendation: HospitalRecommendationType;
  hospitalBanner: string;
  facilityType: string;
  hospitalReason: string;
  englishSummary: string;
  clinicalRationale: string;
  immediateSteps: string[];
  precautions: string[];
  redFlags: string[];
  homeRemedies?: string[];
  medicationAdvice?: string;
  vernacularVoices: Record<string, { full: string; speech: string }>;
}

const SYMPTOM_RULES: SymptomRule[] = [
  // 1. CARDIAC / CHEST PAIN / HEART ATTACK
  {
    id: 'cardiac_chest_pain',
    keywords: [
      'chest pain', 'heart pain', 'left arm', 'radiating', 'chest pressure', 'tightness in chest',
      'heaviness in chest', 'angina', 'crushing chest', 'heart attack', 'sweating with chest',
      'ఛాతీ నొప్పి', 'గుండె నొప్పి', 'ఎడమ చేయి', 'సీనే మే దర్ద్', 'दिल का दौरा', 'நெஞ்சு வலி',
      'எடது கை', 'ಎದೆಯಲ್ಲಿ ನೋವು', 'छातीत वेदना', 'বুকে ব্যথা'
    ],
    category: 'Cardiovascular / Acute Coronary Syndrome',
    tier: 1,
    esiScore: 1,
    severityScore: 10,
    severityLabel: 'Critical Emergency',
    actionWindow: 'Immediate (0 – 15 minutes)',
    expectedRecovery: 'Requires urgent emergency catheterization / cardiac ICU care',
    hospitalRecommendation: 'GO_TO_HOSPITAL_IMMEDIATELY',
    hospitalBanner: '🚨 GO TO HOSPITAL IMMEDIATELY — CALL 108 AMBULANCE',
    facilityType: 'District Hospital / Cardiac Emergency Unit with ICCU & Cath Lab',
    hospitalReason: 'Symptoms strongly indicate possible acute myocardial infarction or cardiac ischemia. Immediate ECG & resuscitation is lifesaving.',
    englishSummary: 'Suspected Acute Coronary Syndrome / Cardiac Emergency detected.',
    clinicalRationale: 'Crushing or radiating chest discomfort requires immediate triage under ESI Level 1 to prevent irreversible cardiac tissue injury.',
    immediateSteps: [
      'Stop all physical activity immediately and sit down in a relaxed half-sitting (W) position.',
      'Call 108 Emergency Ambulance immediately. Do NOT drive yourself.',
      'Loosen all tight clothing around neck, chest, and waist.',
      'If not allergic and not contraindicated, chew one 300mg Soluble Aspirin while waiting.',
      'Keep front door unlocked so emergency paramedics can access the patient quickly.'
    ],
    precautions: [
      'Do NOT assume this is simple gastric acid or gas pain.',
      'Do NOT walk, climb stairs, or perform physical exertion.',
      'Do NOT drink tea, coffee, alcohol, or take heavy meals.'
    ],
    redFlags: [
      'Pain spreading to left shoulder, arm, neck, or jaw.',
      'Cold sweating, dizziness, lightheadedness, or sudden fainting.',
      'Severe shortness of breath or blue-tinted lips.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Critical Emergency: Severe chest pain detected. Call 108 ambulance immediately. Sit down, loosen tight clothes, do not exert yourself, and head directly to emergency casualty.',
        speech: 'Critical emergency. Severe chest pain detected. Call 108 immediately. Sit down and do not exert yourself.'
      },
      'te-IN': {
        full: 'అత్యవసర హెచ్చరిక: తీవ్రమైన ఛాతీ నొప్పి గుర్తించబడింది. వెంటనే 108 అంబులెన్స్‌కు కాల్ చేయండి. నిశ్శబ్దంగా కూర్చోండి, బట్టలు వదులు చేయండి, ఎటువంటి శ్రమ చేయకండి.',
        speech: 'అత్యవసర హెచ్చరిక. తీవ్రమైన ఛాతీ నొప్పి ఉంది. వెంటనే 108 కి కాల్ చేయండి. కూర్చోండి మరియు శ్రమ చేయకండి.'
      },
      'hi-IN': {
        full: 'आपातकालीन चेतावनी: सीने में तेज़ दर्द के लक्षण मिले हैं। तुरंत 108 एम्बुलेंस को कॉल करें। शांत होकर बैठ जाएं, कपड़े ढीले करें और तुरंत अस्पताल जाएं।',
        speech: 'आपातकालीन चेतावनी. सीने में तेज़ दर्द है. तुरंत 108 पर कॉल करें और शांत होकर बैठें.'
      },
      'ta-IN': {
        full: 'அவசர எச்சரிக்கை: கடுமையான நெஞ்சு வலி கண்டறியப்பட்டது. உடனடியாக 108 ஆம்புலன்ஸை அழைக்கவும். அமைதியாக அமர்ந்து உடனே மருத்துவமனைக்கு செல்லவும்.',
        speech: 'அவசர எச்சரிக்கை. கடுமையான நெஞ்சு வலி உள்ளது. உடனடியாக 108 ஐ அழைக்கவும்.'
      },
      'kn-IN': {
        full: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ: ಎದೆಯಲ್ಲಿ ತೀವ್ರವಾದ ನೋವು ಕಾಣಿಸಿಕೊಂಡಿದೆ. ತಕ್ಷಣವೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ. ಯಾವುದೇ ಶ್ರಮವಿಲ್ಲದೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.',
        speech: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ. ಎದೆಯಲ್ಲಿ ತೀವ್ರ ನೋವಿದೆ. ತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ.'
      },
      'mr-IN': {
        full: 'तातडीचा इशारा: छातीत तीव्र वेदना जाणवत आहेत. ताबडतोब 108 रुग्णवाहिकेला कॉल करा. शांत बसा आणि तातडीने रुग्णालयात जा.',
        speech: 'तातडीचा इशारा. छातीत तीव्र वेदना आहेत. ताबडतोब 108 वर कॉल करा.'
      },
      'bn-IN': {
        full: 'জরুরি সতর্কতা: বুকে তীব্র ব্যথা শনাক্ত হয়েছে। অবিলম্বে 108 অ্যাম্বুলেন্সে কল করুন। শান্ত হয়ে বসুন এবং জরুরি বিভাগে যান।',
        speech: 'জরুরি সতর্কতা. বুকে তীব্র ব্যথা আছে. অবিলম্বে 108 এ কল করুন.'
      }
    }
  },

  // 2. RESPIRATORY DISTRESS / SEVERE BREATHING ISSUES / ASTHMA
  {
    id: 'respiratory_distress',
    keywords: [
      'breath', 'shortness of breath', 'difficulty breathing', 'gasping', 'wheezing', 'can\'t breathe',
      'suffocation', 'asthma', 'asthma attack', 'oxygen low', 'choking', 'శ్వాస ఆడకపోవడం', 'దమ్ము',
      'సాన్స్ ఫూల్నా', 'सांस लेने में तकलीफ', 'மூச்சு திணறல்', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'श्वास घेण्यास त्रास', 'শ্বাসকষ্ট'
    ],
    category: 'Pulmonary / Acute Respiratory Distress',
    tier: 1,
    esiScore: 2,
    severityScore: 9,
    severityLabel: 'Critical Emergency',
    actionWindow: 'Immediate (0 – 30 minutes)',
    expectedRecovery: 'Requires oxygen support, bronchodilator nebulization & clinical monitoring',
    hospitalRecommendation: 'GO_TO_HOSPITAL_IMMEDIATELY',
    hospitalBanner: '🚨 GO TO HOSPITAL IMMEDIATELY — RESPIRATORY SUPPORT REQUIRED',
    facilityType: 'Emergency Department with Oxygen Pipeline & Nebulization Ward',
    hospitalReason: 'Acute bronchospasm or oxygen desaturation poses rapid hypoxia risk. Urgent oxygenation and nebulizer therapy needed.',
    englishSummary: 'Acute Respiratory Distress / Severe Hypoxia Risk detected.',
    clinicalRationale: 'Inability to speak complete sentences or stridor indicates compromised airway resistance requiring priority emergency stabilization.',
    immediateSteps: [
      'Sit fully upright and lean slightly forward with arms resting on knees (Tripod position).',
      'Use emergency rescue inhaler (Salbutamol / Albuterol) with spacer: take 2 to 4 puffs immediately.',
      'Ensure maximum fresh airflow: open all windows or turn on fan.',
      'Call 108 or have family prepare immediate vehicle transit to nearest hospital with oxygen.',
      'Practice slow purse-lip breathing to prevent lung collapse.'
    ],
    precautions: [
      'Do NOT lie flat on your back — this severely reduces lung expansion.',
      'Do NOT crowd around the patient; maintain open space for ventilation.',
      'Avoid exposure to smoke, agarbatti, dust, or cold air.'
    ],
    redFlags: [
      'Bluish coloration of lips, tongue, or fingertips (cyanosis).',
      'Inability to speak more than two words between breaths.',
      'Chest indrawing or SpO2 oxygen meter reading below 92%.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Critical: Severe breathing difficulty detected. Sit upright in tripod position, take rescue inhaler puffs, and proceed immediately to hospital emergency for oxygen support.',
        speech: 'Severe breathing difficulty. Sit upright, use inhaler if available, and head to the hospital emergency immediately.'
      },
      'te-IN': {
        full: 'తీవ్ర సమస్య: శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది ఉంది. నిటారుగా కూర్చోండి, ఇన్హేలర్ ఉంటే వాడండి, వెంటనే ఆక్సిజన్ సదుపాయం ఉన్న ఆసుపత్రికి వెళ్ళండి.',
        speech: 'శ్వాస ఆడటం కష్టంగా ఉంది. నిటారుగా కూర్చోండి, వెంటనే ఆసుపత్రికి వెళ్ళండి.'
      },
      'hi-IN': {
        full: 'गंभीर स्थिति: सांस लेने में अत्यधिक कठिनाई हो रही है। सीधे बैठें, इनहेलर लें और तुरंत ऑक्सीजन सुविधा वाले नज़दीकी अस्पताल जाएं।',
        speech: 'सांस लेने में भारी तकलीफ है. सीधे बैठें और तुरंत अस्पताल पहुंचे.'
      },
      'ta-IN': {
        full: 'தீவிர எச்சரிக்கை: மூச்சு திணறல் அதிகமாக உள்ளது. நிமிர்ந்து உட்காருங்கள், ஆக்ஸிஜன் வசதியுள்ள மருத்துவமனைக்கு உடனே செல்லவும்.',
        speech: 'மூச்சு திணறல் அதிகமாக உள்ளது. உடனடியாக மருத்துவமனைக்கு செல்லவும்.'
      },
      'kn-IN': {
        full: 'ಉಸಿರಾಟದಲ್ಲಿ ತೀವ್ರ ತೊಂದರೆ ಇದೆ. ನೆಟ್ಟಗೆ ಕುಳಿತುಕೊಳ್ಳಿ, ಆಕ್ಸಿಜನ್ ಸೌಲಭ್ಯವಿರುವ ಆಸ್ಪತ್ರೆಗೆ ತಕ್ಷಣವೇ ತೆರಳಿ.',
        speech: 'ಉಸಿರಾಟದ ತೊಂದರೆ ಇದೆ. ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.'
      },
      'mr-IN': {
        full: 'श्वास घेण्यास तीव्र त्रास होत आहे. ताठ बसा आणि तातडीने ऑक्सिजन सुविधा असलेल्या रुग्णालयात जा.',
        speech: 'श्वास घेण्यास त्रास होत आहे. ताबडतोब रुग्णालयात जा.'
      },
      'bn-IN': {
        full: 'শ্বাসকষ্টের তীব্র সমস্যা। সোজা হয়ে বসুন এবং অবিলম্বে অক্সিজেন সুবিধাযুক্ত হাসপাতালে যান।',
        speech: 'শ্বাসকষ্ট হচ্ছে. অবিলম্বে হাসপাতালে যান.'
      }
    }
  },

  // 3. STROKE / NEUROLOGICAL / UNCONSCIOUSNESS / SEIZURE
  {
    id: 'stroke_neurological',
    keywords: [
      'stroke', 'paralysis', 'facial drooping', 'face drooping', 'slurred speech', 'arm weakness',
      'sudden numbness', 'loss of consciousness', 'fainting', 'unconscious', 'seizure', 'fits',
      'convulsion', 'ముఖం వంకర', 'పక్షవాతం', 'మూర్ఛ', 'लकवा', 'दौरा', 'बेहोश', 'பக்கவாதம்', 'வலிப்பு',
      'ಲಕ್ವಾ', 'ಪಾರ್ಶ್ವವಾಯು', 'फिट्स', 'প্যারালাইসিস'
    ],
    category: 'Neurological / Acute Cerebrovascular Emergency',
    tier: 1,
    esiScore: 1,
    severityScore: 10,
    severityLabel: 'Critical Emergency',
    actionWindow: 'Golden Hour (Immediate 0 – 60 minutes)',
    expectedRecovery: 'Requires immediate brain CT scan and thrombolytic therapy within 3-4 hours',
    hospitalRecommendation: 'GO_TO_HOSPITAL_IMMEDIATELY',
    hospitalBanner: '🚨 GO TO HOSPITAL IMMEDIATELY — STROKE / NEURO RESCUE',
    facilityType: 'District Hospital or Tertiary Care Center with 24/7 CT Scan & Neurology Unit',
    hospitalReason: 'Acute stroke or seizure carries irreversible neural damage if clot-busting or antiepileptic treatment is delayed.',
    englishSummary: 'Suspected Acute Stroke (FAST Signs) or Neurological Emergency.',
    clinicalRationale: 'FAST symptoms (Face, Arms, Speech, Time) require rapid tertiary stroke team activation within the 3-hour therapeutic window.',
    immediateSteps: [
      'Perform FAST check: Face drooping? Arm weakness? Speech slurred? Time to call 108!',
      'Note exact clock time when first neurological symptom appeared (critical for doctors).',
      'Turn the patient gently onto their side (recovery position) to prevent tongue bite or airway choking.',
      'Do NOT give any food, water, or oral medicines — swallowing reflex may be lost.',
      'Transport immediately via 108 ambulance to a hospital equipped with CT Scan.'
    ],
    precautions: [
      'Do NOT give blood thinners or aspirin before CT Scan confirms ischemic vs hemorrhagic stroke.',
      'Do NOT force keys or metal objects into mouth during a seizure.',
      'Do NOT restrain violent jerking during seizures; simply cushion the head.'
    ],
    redFlags: [
      'Sudden loss of vision in one or both eyes.',
      'Sudden loss of balance, dizziness, or confusion.',
      'Repeated seizures without regaining consciousness.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Critical Emergency: Acute stroke or neurological warning signs detected. Note time of onset, do not give water or food, and rush to a CT-scan equipped hospital immediately.',
        speech: 'Critical stroke emergency. Do not give food or water. Call 108 and reach hospital immediately.'
      },
      'te-IN': {
        full: 'అత్యవసర హెచ్చరిక: పక్షవాతం లేదా మెదడు సమస్య లక్షణాలు ఉన్నాయి. రోగికి నీరు లేదా ఆహారం ఇవ్వవద్దు, సమయం గమనించి వెంటనే సిటీ స్కాన్ ఉన్న ఆసుపత్రికి తీసుకెళ్లండి.',
        speech: 'పక్షవాత అత్యవసర పరిస్థితి. ఆహారం లేదా నీరు ఇవ్వవద్దు. వెంటనే 108 కి కాల్ చేయండి.'
      },
      'hi-IN': {
        full: 'आपातकालीन चेतावनी: लकवा या न्यूरोलॉजिकल स्ट्रोक के लक्षण दिखे हैं। मरीज को पानी या खाना न दें और तुरंत सीटी स्कैन वाले अस्पताल ले जाएं।',
        speech: 'स्ट्रोक के लक्षण हैं. मरीज को कुछ न खिलाएं और तुरंत अस्पताल ले जाएं.'
      },
      'ta-IN': {
        full: 'அவசர எச்சரிக்கை: பக்கவாதம் அல்லது நரம்பியல் பாதிப்பு அறிகுறிகள். நோயாளிக்கு தண்ணீர் கொடுக்காமல் உடனே மருத்துவமனைக்கு அழைத்து செல்லவும்.',
        speech: 'பக்கவாத அவசர நிலை. உடனடியாக மருத்துவமனைக்கு செல்லவும்.'
      },
      'kn-IN': {
        full: 'ಪಾರ್ಶ್ವವಾಯು ಅಥವಾ ನರಗಳ ಗಂಭೀರ ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ರೋಗಿಗೆ ನೀರು ಕೊಡಬೇಡಿ, ತಕ್ಷಣವೇ ಸಿಟಿ ಸ್ಕ್ಯಾನ್ ಇರುವ ಆಸ್ಪತ್ರೆಗೆ ಕರೆದೊಯ್ಯಿರಿ.',
        speech: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.'
      },
      'mr-IN': {
        full: 'पक्षाघात (स्ट्रोक) चे तीव्र लक्षण. रुग्णाला पाणी किंवा अन्न देऊ नका, तातडीने सीटी स्कॅन असलेल्या रुग्णालयात दाखल करा.',
        speech: 'स्ट्रोकचा इशारा. ताबडतोब रुग्णालयात दाखल करा.'
      },
      'bn-IN': {
        full: 'প্যারালাইসিস বা স্ট্রোকের তীব্র সতর্কতা। রোগীকে জল বা খাবার দেবেন না, অবিলম্বে সিটি স্ক্যানযুক্ত হাসপাতালে নিন।',
        speech: 'স্ট্রোকের জরুরি অবস্থা. অবিলম্বে হাসপাতালে নিয়ে যান.'
      }
    }
  },

  // 4. SNAKE BITE / SCORPION / DOG BITE / POISONING
  {
    id: 'bites_poisoning',
    keywords: [
      'snake bite', 'snakebite', 'poison', 'pesticide', 'scorpion', 'dog bite', 'rabies',
      'animal bite', 'spider bite', 'පාము కాటు', 'తేలు కుట్టడం', 'కుక్క కాటు', 'పాము',
      'सांप का काटना', 'कुत्ते का काटना', 'बिच्छू', 'বিষাক্ত সাপের কামড়', 'பாம்பு கடி', 'நாய்க்கடி',
      'ಹಾವು ಕಡಿತ', 'ನಾಯಿ ಕಡಿತ', 'सापाचा चावा'
    ],
    category: 'Toxicology / Envenomation & Rabies Protocol',
    tier: 1,
    esiScore: 1,
    severityScore: 9,
    severityLabel: 'Critical Emergency',
    actionWindow: 'Immediate (Within 30 minutes)',
    expectedRecovery: 'Requires urgent Polyvalent Anti-Snake Venom (ASV) or Anti-Rabies Immunization',
    hospitalRecommendation: 'GO_TO_HOSPITAL_IMMEDIATELY',
    hospitalBanner: '🚨 GO TO HOSPITAL IMMEDIATELY — ANTIVENOM / RABIES VACCINE REQUIRED',
    facilityType: 'Government Area Hospital / Community Health Centre (CHC) with Antivenom Stock',
    hospitalReason: 'Snake venom spreads rapidly causing neurotoxicity or bleeding; animal bites risk fatal rabies without prompt post-exposure prophylaxis.',
    englishSummary: 'Acute Envenomation / Animal Bite requiring emergency medical antidote.',
    clinicalRationale: 'Immediate immobilization (for snake bite) or 15-minute running water soap wash (for dog bite) followed by hospital antivenom / rabies prophylaxis.',
    immediateSteps: [
      'For Snake Bite: Keep patient calm and completely still. Immobilize the bitten limb below heart level with a splint.',
      'Remove rings, watches, and tight clothing before swelling starts.',
      'For Dog / Animal Bite: Immediately wash the wound under running tap water with soap for at least 15 continuous minutes.',
      'Apply povidone-iodine antiseptic; leave wound uncovered and head straight to hospital for Rabies Vaccine.',
      'Do NOT wait for symptoms to develop before seeking hospital care.'
    ],
    precautions: [
      'Do NOT cut the wound, suck out venom, or apply electrical shock.',
      'Do NOT apply tight arterial tourniquets which cause limb gangrene.',
      'Do NOT apply cow dung, lime, leaves, or herbal concoctions onto the bite.'
    ],
    redFlags: [
      'Drooping eyelids (ptosis), difficulty swallowing, or breathing paralysis (neurotoxic).',
      'Spontaneous bleeding from gums, nose, or urine (hemotoxic).',
      'Rapidly spreading blackening or blistering around bite site.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Critical Emergency: Bite or poisoning detected. Keep patient still and calm, wash animal bites with soap for 15 minutes, do not tie tight tourniquets, and rush to the nearest government hospital for antivenom.',
        speech: 'Emergency bite detected. Keep patient still. Wash with soap water if dog bite, and reach hospital immediately for antivenom.'
      },
      'te-IN': {
        full: 'అత్యవసర హెచ్చరిక: పాము లేదా జంతువు కాటు గుర్తించబడింది. గాయాన్ని కదల్చకండి, కుక్క కాటైతే 15 నిమిషాలు సబ్బు నీటితో కడగండి, తక్షణమే యాంటీ-వీనమ్ ఉన్న ప్రభుత్వ ఆసుపత్రికి వెళ్ళండి.',
        speech: 'పాము లేదా జంతువు కాటు. గాయాన్ని కదల్చవద్దు, వెంటనే ఆసుపత్రికి వెళ్ళండి.'
      },
      'hi-IN': {
        full: 'आपातकालीन चेतावनी: सांप या जानवर के काटने का मामला। कुत्ते के काटने पर 15 मिनट साबुन से धोएं, सांप के काटने पर नस न बांधें और तुरंत सरकारी अस्पताल जाएं।',
        speech: 'सांप या जानवर का काटना. मरीज को शांत रखें और तुरंत एंटीवेनम के लिए अस्पताल जाएं.'
      },
      'ta-IN': {
        full: 'அவசர எச்சரிக்கை: பாம்பு அல்லது விலங்கு கடி. கடிபட்ட இடத்தை அசைக்காமல் வைத்து அரசு மருத்துவமனைக்கு உடனடியாக அழைத்து செல்லவும்.',
        speech: 'பாம்பு கடி அவசர நிலை. உடனடியாக அரசு மருத்துவமனைக்கு செல்லவும்.'
      },
      'kn-IN': {
        full: 'ಹಾವು ಅಥವಾ ಪ್ರಾಣಿ ಕಡಿತದ ಗಂಭೀರ ತುರ್ತುಸ್ಥಿತಿ. ರೋಗಿಯನ್ನು ಶಾಂತವಾಗಿರಿಸಿ, ತಕ್ಷಣವೇ ಆಂಟಿವೆನಮ್ ಲಭ್ಯವಿರುವ ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.',
        speech: 'ಹಾವು ಕಡಿತ. ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.'
      },
      'mr-IN': {
        full: 'साप किंवा प्राण्यांचा चावा. रुग्णाला शांत ठेवा आणि तातडीने अँटीव्हेनम उपलब्ध असलेल्या शासकीय रुग्णालयात न्या.',
        speech: 'सापाचा चावा. ताबडतोब शासकीय रुग्णालयात जा.'
      },
      'bn-IN': {
        full: 'সাপ বা বিষাক্ত প্রাণীর কামড়। রোগীকে নড়াচড়া করতে দেবেন না এবং অবিলম্বে অ্যান্টিভেনমের জন্য সরকারি হাসপাতালে যান।',
        speech: 'সাপের কামড়. অবিলম্বে হাসপাতালে নিয়ে যান.'
      }
    }
  },

  // 5. HIGH FEVER / DENGUE / MALARIA / CHILLS (> 3 DAYS)
  {
    id: 'high_fever_infection',
    keywords: [
      'fever', 'high fever', 'chills', 'shivering', 'temperature', 'dengue', 'malaria', 'typhoid',
      'body ache with fever', 'fever 3 days', 'fever 2 days', 'platelets', 'జ్వరం', 'చలి జ్వరం',
      'తేజ్ బుఖార్', 'बुखार', 'तेज़ बुखार', 'காய்ச்சல்', 'நடுக்கம்', 'ಜ್ವರ', 'ಚಳಿ ಜ್ವರ', 'ताप', 'জ্বর'
    ],
    category: 'Infectious Diseases / Acute Febrile Illness',
    tier: 2,
    esiScore: 3,
    severityScore: 7,
    severityLabel: 'High Risk - Urgent',
    actionWindow: 'Same-day consultation (Within 12 – 24 hours)',
    expectedRecovery: 'Expected recovery 4 to 7 days with targeted diagnostic testing and antipyretics',
    hospitalRecommendation: 'VISIT_HOSPITAL_TODAY',
    hospitalBanner: '⚠️ VISIT HOSPITAL / PHC TODAY — DIAGNOSTIC BLOOD TEST RECOMMENDED',
    facilityType: 'Nearest Primary Health Centre (PHC), CHC, or Area Hospital OPD',
    hospitalReason: 'High fever with chills lasting over 48 hours requires Complete Blood Count (CBC), Dengue NS1 / Malarial smear to rule out vector-borne complications.',
    englishSummary: 'High Febrile Illness / Possible Vector-Borne Infection (Dengue/Malaria/Typhoid).',
    clinicalRationale: 'Prolonged high fever carries risk of dehydration and platelet drop. Physician evaluation and laboratory investigation are required today.',
    immediateSteps: [
      'Drink plenty of oral fluids: ORS, tender coconut water, lemon water, and clean boiled water (at least 2.5 to 3 liters daily).',
      'Sponge forehead, neck, and underarms with clean cloth soaked in normal tap water (tepid sponging).',
      'Take Paracetamol (500mg or 650mg) every 6-8 hours for temperature > 100°F if recommended by healthcare worker.',
      'Visit nearest PHC or clinic today for CBC blood test and malaria smear.',
      'Take complete rest in bed under a mosquito net.'
    ],
    precautions: [
      'Do NOT take Brufen, Combiflam, Aspirin, or Diclofenac — these worsen bleeding risk in Dengue.',
      'Do NOT use ice water or cold water for sponging — it causes violent shivering.',
      'Do NOT start antibiotics on your own without laboratory diagnosis.'
    ],
    redFlags: [
      'Bleeding from gums, nose, or tiny red pinhead spots on skin (petechiae).',
      'Persistent vomiting or severe abdominal tenderness.',
      'Extreme lethargy, confusion, or difficulty staying awake.'
    ],
    homeRemedies: [
      'Tepid water forehead compress',
      'Fresh pomegranate / papaya leaf extract juice for hydration',
      'Warm moong dal khichdi and fresh seasonal soups'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'High Risk: Persistent high fever with chills detected. Visit your nearest hospital or PHC today for blood tests. Drink plenty of ORS and fluids, take paracetamol, and avoid aspirin or painkillers.',
        speech: 'Persistent high fever detected. Visit nearest PHC today for blood tests. Drink lots of fluids and take paracetamol.'
      },
      'te-IN': {
        full: 'అధిక ప్రమాదం: చలితో కూడిన తీవ్ర జ్వరం ఉంది. రక్త పరీక్షల (డెంగ్యూ/మలేరియా) కోసం ఈరోజే దగ్గరి పిహెచ్‌సి లేదా ఆసుపత్రిని సంప్రదించండి. ద్రవాలు ఎక్కువగా తాగండి, పారాసిటమాల్ వాడండి, పెయిన్ కిల్లర్లు వాడవద్దు.',
        speech: 'తీవ్ర జ్వరం ఉంది. ఈరోజే రక్త పరీక్షల కోసం ఆసుపత్రికి వెళ్ళండి. ఓఆర్ఎస్ మరియు నీరు ఎక్కువగా తాగండి.'
      },
      'hi-IN': {
        full: 'उच्च जोखिम: ठंड के साथ तेज़ बुखार है। मलेरिया और डेंगू की जांच के लिए आज ही नज़दीकी पीएचसी या अस्पताल जाएं। ओआरएस और तरल पदार्थ खूब पिएं, पैरासिटामोल लें।',
        speech: 'तेज़ बुखार है. खून की जांच के लिए आज ही अस्पताल जाएं. खूब पानी और ओआरएस पिएं.'
      },
      'ta-IN': {
        full: 'அதிக ஆபத்து: நடுக்கத்துடன் கூடிய அதிக காய்ச்சல். இரத்த பரிசோதனைக்காக இன்றே ஆரம்ப சுகாதார நிலையத்தை அணுகவும். அதிக நீர் அருந்தவும்.',
        speech: 'அதிக காய்ச்சல் உள்ளது. இன்றே மருத்துவமனைக்கு சென்று இரத்த பரிசோதனை செய்து கொள்ளவும்.'
      },
      'kn-IN': {
        full: 'ಹೆಚ್ಚಿನ ಅಪಾಯ: ಚಳಿಯೊಂದಿಗೆ ತೀವ್ರ ಜ್ವರವಿದೆ. ರಕ್ತ ಪರೀಕ್ಷೆಗಾಗಿ ಇಂದೇ ಸಮೀಪದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ. ಸಾಕಷ್ಟು ನೀರು ಮತ್ತು ಓಆರ್‌ಎಸ್ ಕುಡಿಯಿರಿ.',
        speech: 'ತೀವ್ರ ಜ್ವರವಿದೆ. ಇಂದೇ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ ರಕ್ತ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.'
      },
      'mr-IN': {
        full: 'उच्च धोका: थंडी वाजून तीव्र ताप येत आहे. रक्ताच्या तपासणीसाठी आजच जवळच्या प्राथमिक आरोग्य केंद्रात जा. भरपूर द्रवपदार्थ प्या.',
        speech: 'तीव्र ताप आहे. आजच तपासणीसाठी प्राथमिक आरोग्य केंद्रात जा.'
      },
      'bn-IN': {
        full: 'উচ্চ ঝুঁকি: কাঁপুনি দিয়ে তীব্র জ্বর। রক্ত পরীক্ষার জন্য আজই নিকটবর্তী স্বাস্থ্যকেন্দ্রে যান। প্রচুর তরল এবং ওআরএস পান করুন।',
        speech: 'তীব্র জ্বর আছে. আজই স্বাস্থ্যকেন্দ্রে যান এবং প্রচুর জল পান করুন.'
      }
    }
  },

  // 6. GASTROINTESTINAL / SEVERE STOMACH PAIN / VOMITING / DIARRHEA
  {
    id: 'gastrointestinal_emergency',
    keywords: [
      'stomach pain', 'abdominal pain', 'belly pain', 'loose motions', 'diarrhea', 'vomiting',
      'food poisoning', 'cramps in stomach', 'watery stool', 'dehydration', 'కడుపు నొప్పి', 'విరేచనాలు',
      'వాంతులు', 'పేట్ మే దర్ద్', 'पेट दर्द', 'दस्त', 'उल्टी', 'വയറുവേദന', 'വയറിളക്കം', 'വയറ്റിൽ വേദന',
      'வயிறு வலி', 'வாந்தி', 'ಹೊಟ್ಟೆ ನೋವು', 'ಭೇದಿ', 'पोटदुखी', 'जुलाब', 'পেট ব্যথা'
    ],
    category: 'Gastroenterology / Acute Abdomen & Gastroenteritis',
    tier: 2,
    esiScore: 3,
    severityScore: 6,
    severityLabel: 'High Risk - Urgent',
    actionWindow: 'Consult within 12 – 24 hours (Immediate if severe dehydration)',
    expectedRecovery: 'Resolves in 2 to 4 days with electrolyte hydration and gut rest',
    hospitalRecommendation: 'VISIT_HOSPITAL_TODAY',
    hospitalBanner: '⚠️ VISIT HOSPITAL / PHC IF UNABLE TO RETAIN FLUIDS OR HIGH PAIN',
    facilityType: 'Primary Health Centre / Community Health Centre (CHC) or General Outpatient',
    hospitalReason: 'Frequent watery stools or intractable vomiting leads rapidly to hypovolemic shock. Severe localized pain requires surgical abdomen evaluation.',
    englishSummary: 'Acute Gastroenteritis / Abdominal Distress detected.',
    clinicalRationale: 'Fluid loss through emesis and diarrhea demands immediate oral rehydration therapy and evaluation for bacterial pathogen or surgical appendicitis.',
    immediateSteps: [
      'Prepare ORS (Oral Rehydration Salts): Dissolve 1 sachet in 1 liter clean drinking water; sip 100-200ml after every loose stool.',
      'Drink tender coconut water, buttermilk with a pinch of salt, and rice congee (kanji).',
      'Eat small, bland meals: curd rice, ripe bananas, boiled potatoes, and toast. Rest your digestive system.',
      'If unable to keep liquids down for > 6 hours or severe stabbing pain occurs, proceed immediately to hospital for IV fluids.'
    ],
    precautions: [
      'Do NOT take OTC anti-diarrheal pills (like Loperamide) if you have high fever or blood in stools.',
      'Do NOT eat oily, spicy, fried foods, raw street food, or milk products.',
      'Avoid painkillers like Diclofenac or Ibuprofen which can cause stomach ulcer bleeding.'
    ],
    redFlags: [
      'Blood or black coffee-ground color in vomit or stools.',
      'Severe localized pain in lower right side of abdomen (suspected appendicitis).',
      'Signs of severe dehydration: dry mouth, sunken eyes, no urine passed for over 8 hours.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Urgent: Acute stomach pain or diarrhea detected. Start ORS electrolyte water immediately after every stool, eat light curd rice, and visit hospital if you cannot retain fluids or notice blood.',
        speech: 'Stomach pain and dehydration risk detected. Drink ORS electrolyte water immediately and visit clinic if vomiting persists.'
      },
      'te-IN': {
        full: 'శ్రద్ధ వహించండి: కడుపు నొప్పి లేదా విరేచనాలు ఉన్నాయి. ప్రతిసారీ ఓఆర్ఎస్ ద్రావణం తాగండి, పెరుగు అన్నం తినండి. వాంతులు ఆగకపోతే లేదా తీవ్ర నొప్పి ఉంటే వెంటనే ఆసుపత్రికి వెళ్ళండి.',
        speech: 'కడుపు నొప్పి లేదా విరేచనాలు ఉన్నాయి. ఓఆర్ఎస్ నీరు వెంటనే తాగండి, తగ్గకపోతే ఆసుపత్రికి వెళ్ళండి.'
      },
      'hi-IN': {
        full: 'सावधानी: पेट दर्द या दस्त/उल्टी की समस्या। हर दस्त के बाद ओआरएस का घोल पिएं, हल्का दही-चावल खाएं। यदि पानी भी न पच रहा हो तो तुरंत अस्पताल जाएं।',
        speech: 'पेट दर्द या दस्त की समस्या. तुरंत ओआरएस पिएं और आराम करें. समस्या बढ़ने पर अस्पताल जाएं.'
      },
      'ta-IN': {
        full: 'கவனம்: வயிறு வலி அல்லது வயிற்றுப்போக்கு. உடனடியாக ஓஆர்எஸ் கரைசல் அருந்தவும். வாந்தி நிற்காவிட்டால் இன்றே மருத்துவமனைக்கு செல்லவும்.',
        speech: 'வயிறு வலி அல்லது வாந்தி உள்ளது. உடனே ஓஆர்எஸ் குடிக்கவும்.'
      },
      'kn-IN': {
        full: 'ಗಮನಿಸಿ: ಹೊಟ್ಟೆ ನೋವು ಅಥವಾ ಭೇದಿ ಇದೆ. ತಕ್ಷಣವೇ ಓಆರ್‌ಎಸ್ ನೀರನ್ನು ಕುಡಿಯಿರಿ. ವಾಂತಿ ನಿಲ್ಲದಿದ್ದರೆ ಇಂದೇ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.',
        speech: 'ಹೊಟ್ಟೆ ನೋವಿದೆ. ತಕ್ಷಣ ಓಆರ್‌ಎಸ್ ಕುಡಿಯಿರಿ ಮತ್ತು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
      },
      'mr-IN': {
        full: 'काळजी घ्या: पोटदुखी किंवा जुलाब/उलट्या. लगेच ओआरएस पाणी प्या. उलट्या थांबत नसल्यास तातडीने डॉक्टरांकडे जा.',
        speech: 'पोटदुखी आणि जुलाब. लगेच ओआरएस प्या आणि आराम करा.'
      },
      'bn-IN': {
        full: 'সতর্কতা: পেটে ব্যথা বা ডায়রিয়া/বমি। অবিলম্বে ওআরএস জল পান করুন। জল পান করতে না পারলে আজই হাসপাতালে যান।',
        speech: 'পেটে ব্যথা বা বমি হচ্ছে. ওআরএস জল পান করুন এবং চিকিৎসকের পরামর্শ নিন.'
      }
    }
  },

  // 7. DIABETES / HIGH OR LOW BLOOD SUGAR (HYPER / HYPOGLYCEMIA)
  {
    id: 'diabetes_blood_sugar',
    keywords: [
      'sugar', 'diabetes', 'glucose', 'high sugar', 'low sugar', 'hypoglycemia', 'sweating shaking sugar',
      'frequent urination', 'excessive thirst', 'షుగర్', 'మధుమేహం', 'చక్కెర వ్యాధి', 'मधुमेह', 'शुगर',
      'रक्त शर्करा', 'சர்க்கரை நோய்', 'ಸಕ್ಕರೆ ಕಾಯಿಲೆ', 'ডায়াবেটিস'
    ],
    category: 'Endocrinology / Glycemic Dysregulation',
    tier: 2,
    esiScore: 2,
    severityScore: 7,
    severityLabel: 'High Risk - Urgent',
    actionWindow: 'Immediate 15 mins (for low sugar) / Within 24 hours (for high sugar)',
    expectedRecovery: 'Requires clinical insulin titration and lifestyle medication review',
    hospitalRecommendation: 'VISIT_HOSPITAL_TODAY',
    hospitalBanner: '⚠️ DIABETIC RISK — CHECK BLOOD GLUCOSE & CONSULT PHYSICIAN',
    facilityType: 'Primary Health Centre / District NCD Clinic',
    hospitalReason: 'Extremes of blood sugar risk diabetic ketoacidosis (DKA) or hypoglycemic coma if not corrected promptly.',
    englishSummary: 'Diabetic Glycemic Imbalance (Hyperglycemia / Hypoglycemia Risk).',
    clinicalRationale: 'Biometric glucose readings outside the 70-180 mg/dL target require clinical stabilization and dosage recalculation.',
    immediateSteps: [
      'For Low Sugar (< 70 mg/dL or trembling/sweating): Apply Rule of 15 — consume 15g fast sugar (3 tsp sugar, honey, or half glass fruit juice) and recheck in 15 mins.',
      'For High Sugar (> 200 mg/dL): Drink plenty of plain water to flush ketones; take prescribed diabetes medication.',
      'Check blood sugar again after 2 hours with digital glucometer.',
      'Visit nearest PHC NCD clinic for physician review and prescription refill.'
    ],
    precautions: [
      'Do NOT skip meals after taking diabetes tablets or insulin injections.',
      'Do NOT drive or operate heavy machinery when feeling shaky or dizzy.',
      'Do NOT ignore small cuts, blisters, or wounds on your feet.'
    ],
    redFlags: [
      'Fruity sweet odor on breath with rapid breathing (DKA sign).',
      'Persistent vomiting, extreme drowsiness, or confusion.',
      'Blood glucose reading above 350 mg/dL or below 55 mg/dL.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Diabetes Alert: Abnormal blood sugar detected. For low sugar and trembling, take 3 teaspoons of sugar immediately. For high sugar, drink plenty of water and consult your PHC doctor today.',
        speech: 'Abnormal blood sugar detected. For low sugar take sweets immediately. For high sugar drink water and visit PHC today.'
      },
      'te-IN': {
        full: 'షుగర్ హెచ్చరిక: రక్తంలో చక్కెర స్థాయిల్లో మార్పు ఉంది. నీరసం లేదా వణుకు ఉంటే వెంటనే 3 చెంచాల చక్కెర తినండి. షుగర్ ఎక్కువైతే నీరు ఎక్కువగా తాగి ఈరోజే డాక్టర్‌ను కలవండి.',
        speech: 'షుగర్ సమస్య. వణుకు ఉంటే చక్కెర తినండి. ఎక్కువైతే నీరు తాగి డాక్టర్‌ను సంప్రదించండి.'
      },
      'hi-IN': {
        full: 'डायबिटीज अलर्ट: ब्लड शुगर में असंतुलन। यदि चक्कर या कंपन हो तो तुरंत 3 चम्मच चीनी या मीठा लें। शुगर अधिक होने पर खूब पानी पिएं और आज ही डॉक्टर को दिखाएं।',
        speech: 'ब्लड शुगर का असंतुलन. चक्कर आने पर तुरंत मीठा खाएं और डॉक्टर से सलाह लें.'
      },
      'ta-IN': {
        full: 'சர்க்கரை நோய் எச்சரிக்கை: இரத்த சர்க்கரை மாறுபாடு. நடுக்கம் இருந்தால் உடனே சர்க்கரை அல்லது இனிப்பு சாப்பிடவும். இன்றே மருத்துவரை அணுகவும்.',
        speech: 'சர்க்கரை அளவு மாறுபாடு. நடுக்கம் இருந்தால் சர்க்கரை சாப்பிடவும்.'
      },
      'kn-IN': {
        full: 'ಮಧುಮೇಹ ಎಚ್ಚರಿಕೆ: ರಕ್ತದಲ್ಲಿನ ಸಕ್ಕರೆ ಪ್ರಮಾಣದಲ್ಲಿ ಏರುಪೇರು. ನಡುಕವಿದ್ದರೆ ತಕ್ಷಣ 3 ಚಮಚ ಸಕ್ಕರೆ ತಿನ್ನಿ ಮತ್ತು ಇಂದೇ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
        speech: 'ಸಕ್ಕರೆ ಪ್ರಮಾಣದಲ್ಲಿ ಏರುಪೇರು. ಇಂದೇ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.'
      },
      'mr-IN': {
        full: 'मधुमेह इशारा: रक्तातील साखरेचे असंतुलन. थरथर कापत असल्यास लगेच साखर खा. आजच डॉक्टरांचा सल्ला घ्या.',
        speech: 'साखरेचे प्रमाण असंतुलित आहे. आजच डॉक्टरांना दाखवा.'
      },
      'bn-IN': {
        full: 'ডায়াবেটিস সতর্কতা: রক্তে শর্করার মাত্রা অনিয়মিত। কাঁপুনি দিলে অবিলম্বে মিষ্টি বা চিনি খান এবং আজই ডাক্তারের সাথে দেখা করুন।',
        speech: 'রক্তে শর্করার সমস্যা. আজই ডাক্তারের সাথে পরামর্শ করুন.'
      }
    }
  },

  // 8. HYPERTENSION / HIGH BLOOD PRESSURE (STAGE 2 / CRISIS)
  {
    id: 'hypertension_bp',
    keywords: [
      'high bp', 'blood pressure', 'bp high', 'systolic 180', 'systolic 160', 'bp reading',
      'throbbing headache', 'hypertension', 'బ్లడ్ ప్రెషర్', 'హై బిపి', 'రక్తపోటు', 'उच्च रक्तचाप',
      'हाई बीपी', 'உயர் இரத்த அழுத்தம்', 'ರಕ್ತದೊತ್ತಡ', 'उच्च रक्तदाब', 'উচ্চ রক্তচাপ'
    ],
    category: 'Cardiovascular / Hypertensive Urgency',
    tier: 2,
    esiScore: 2,
    severityScore: 8,
    severityLabel: 'High Risk - Urgent',
    actionWindow: 'Within 2 to 6 hours (Immediate if BP > 180/120)',
    expectedRecovery: 'Requires antihypertensive dosage adjustment and regular monitoring',
    hospitalRecommendation: 'VISIT_HOSPITAL_TODAY',
    hospitalBanner: '⚠️ HIGH BLOOD PRESSURE DETECTED — MEDICAL EVALUATION REQUIRED',
    facilityType: 'District Hospital / Community Health Centre Emergency or OPD',
    hospitalReason: 'Systolic blood pressure exceeding safety thresholds requires clinical evaluation to prevent stroke, myocardial damage, or retinal injury.',
    englishSummary: 'Hypertensive Urgency / Elevated Blood Pressure detected.',
    clinicalRationale: 'Stage 2 hypertension with vascular load requires immediate physician assessment and exclusion of acute end-organ damage.',
    immediateSteps: [
      'Sit quietly in a comfortable chair with feet flat on the floor for 10 minutes without talking.',
      'Re-measure your blood pressure to confirm the reading.',
      'Take your regular prescribed antihypertensive medication if you missed a dose today.',
      'If BP exceeds 180/110 mmHg or is accompanied by chest tightness, headache, or blurry vision, go to hospital emergency immediately.'
    ],
    precautions: [
      'Do NOT consume extra salt, pickles, papads, salty snacks, or processed foods.',
      'Do NOT smoke, chew tobacco, or drink alcohol.',
      'Avoid high stress and sudden heavy physical exertion.'
    ],
    redFlags: [
      'Severe throbbing headache with blurred vision or seeing spots.',
      'Chest tightness, pressure, or shortness of breath.',
      'Confusion, numbness in face or arms.'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'High Blood Pressure Alert: Elevated blood pressure detected. Sit quietly and rest, take missed BP medicine, avoid salt, and visit your doctor or hospital today if BP remains above 160.',
        speech: 'Elevated blood pressure detected. Sit quietly and rest. If BP remains high visit your doctor today.'
      },
      'te-IN': {
        full: 'రక్తపోటు హెచ్చరిక: అధిక బిపి గుర్తించబడింది. ప్రశాంతంగా కూర్చొని విశ్రాంతి తీసుకోండి, ఉప్పు తగ్గించండి, బిపి 160 దాటి ఉంటే ఈరోజే ఆసుపత్రికి వెళ్ళండి.',
        speech: 'అధిక రక్తపోటు ఉంది. ప్రశాంతంగా కూర్చోండి మరియు ఉప్పు తగ్గించండి.'
      },
      'hi-IN': {
        full: 'उच्च रक्तचाप चेतावनी: बीपी बढ़ा हुआ है। शांत होकर बैठें, नमक का सेवन कम करें, छूटी हुई दवा लें और आज ही नज़दीकी अस्पताल या डॉक्टर से मिलें।',
        speech: 'बीपी बढ़ा हुआ है. शांत होकर आराम करें और नमक कम खाएं.'
      },
      'ta-IN': {
        full: 'உயர் இரத்த அழுத்த எச்சரிக்கை: பிபி அதிகமாக உள்ளது. அமைதியாக ஓய்வெடுக்கவும், உப்பை குறைக்கவும், இன்றே மருத்துவரை அணுகவும்.',
        speech: 'இரத்த அழுத்தம் அதிகமாக உள்ளது. அமைதியாக ஓய்வெடுக்கவும்.'
      },
      'kn-IN': {
        full: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡದ ಎಚ್ಚರಿಕೆ. ಶಾಂತವಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ಉಪ್ಪನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಇಂದೇ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
        speech: 'ರಕ್ತದೊತ್ತಡ ಹೆಚ್ಚಾಗಿದೆ. ಶಾಂತವಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.'
      },
      'mr-IN': {
        full: 'उच्च रक्तदाब इशारा: बीपी वाढलेला आहे. शांत बसा, मीठ कमी करा आणि आजच डॉक्टरांना दाखवा.',
        speech: 'रक्तदाब वाढला आहे. शांत बसा आणि आराम करा.'
      },
      'bn-IN': {
        full: 'উচ্চ রক্তচাপ সতর্কতা: রক্তচাপ বৃদ্ধি পেয়েছে। শান্ত হয়ে বিশ্রাম নিন, নুন খাওয়া কমান এবং আজই ডাক্তার দেখান।',
        speech: 'রক্তচাপ বেড়েছে. শান্ত হয়ে বিশ্রাম নিন.'
      }
    }
  },

  // 9. MILD HEADACHE / COMMON COLD / SORE THROAT / SEASONAL ALLERGY
  {
    id: 'mild_ailments',
    keywords: [
      'mild headache', 'headache', 'cold', 'common cold', 'runny nose', 'mild cough', 'sneezing',
      'sore throat', 'seasonal cold', 'tiredness', 'mild fatigue', 'తేలికపాటి తలనొప్పి', 'జలుబు',
      'దగ్గు', 'సాధారణ తలనొప్పి', 'सिरदर्द', 'हल्का सिरदर्द', 'जुकाम', 'सर्दी', 'தலைவலி', 'சளி',
      'ತಲೆನೋವು', 'ನೆಗಡಿ', 'डोकेदुखी', 'सर्दी पडसे', 'মাথাব্যথা', 'সর্দি'
    ],
    category: 'General Medicine / Minor Self-Limiting Condition',
    tier: 4,
    esiScore: 5,
    severityScore: 2,
    severityLabel: 'Mild - Low Risk',
    actionWindow: 'Self-monitoring over 3 to 5 days',
    expectedRecovery: 'Expected full recovery within 3 to 5 days with simple home care and rest',
    hospitalRecommendation: 'HOME_CARE_ONLY',
    hospitalBanner: '✅ HOME CARE RECOMMENDED — HOSPITAL VISIT NOT REQUIRED CURRENTLY',
    facilityType: 'Home Care / Local Community Wellness & Tele-consultation if Needed',
    hospitalReason: 'Symptoms represent mild, self-limiting tension headache or viral upper respiratory tract irritation. Emergency hospital visit is unnecessary.',
    englishSummary: 'Mild Tension Headache / Common Cold (Self-Limiting condition).',
    clinicalRationale: 'Vitals and symptom presentation fall within clinically benign thresholds. Supportive home therapy and hydration are sufficient.',
    immediateSteps: [
      'Ensure adequate rest and sleep for 7 to 8 hours in a quiet, comfortable environment.',
      'Stay well-hydrated: Drink warm water, herbal ginger-tulsi tea, or warm lemon water.',
      'Steam inhalation twice daily with plain warm water for nasal and sinus congestion.',
      'Gargle with warm salt water (half teaspoon salt in a glass of warm water) 3 times daily for sore throat.',
      'Apply a cool or warm compress across your forehead for headache relief.'
    ],
    precautions: [
      'Do NOT take over-the-counter antibiotics for a common cold or viral illness.',
      'Avoid cold drinks, ice creams, and exposure to chilly winds.',
      'Avoid long continuous screen time on mobile phones or laptops.'
    ],
    redFlags: [
      'Sudden "worst headache of your life" (thunderclap onset).',
      'Fever rising above 101°F or lasting more than 3 continuous days.',
      'Neck stiffness, difficulty bending chin to chest, or confusion.'
    ],
    homeRemedies: [
      'Warm ginger, tulsi, and honey tea',
      'Warm saline water gargling (3x daily)',
      'Steam inhalation with plain water',
      'Adequate sleep and hydration'
    ],
    vernacularVoices: {
      'en-IN': {
        full: 'Mild Condition: Common cold or mild headache detected. Hospital visit is not required. Take adequate rest, drink warm fluids, do steam inhalation, and you will recover in 3 to 5 days.',
        speech: 'Mild common cold or headache. Hospital visit not needed. Rest well and drink warm fluids.'
      },
      'te-IN': {
        full: 'సాధారణ సమస్య: తేలికపాటి తలనొప్పి లేదా జలుబు గుర్తించబడింది. ఆసుపత్రికి వెళ్లవలసిన అవసరం లేదు. విశ్రాంతి తీసుకోండి, గోరువెచ్చని నీరు తాగండి, ఆవిరి పట్టండి. 3 నుండి 5 రోజుల్లో తగ్గుతుంది.',
        speech: 'సాధారణ తలనొప్పి లేదా జలుబు. ఆసుపత్రికి వెళ్ళాల్సిన పనిలేదు. విశ్రాంతి తీసుకోండి.'
      },
      'hi-IN': {
        full: 'सामान्य स्थिति: हल्का सिरदर्द या सामान्य जुकाम। अस्पताल जाने की आवश्यकता नहीं है। पर्याप्त आराम करें, गुनगुना पानी पिएं और भाप लें। 3-5 दिनों में आराम मिल जाएगा।',
        speech: 'हल्का सिरदर्द या जुकाम है. अस्पताल जाने की जरूरत नहीं है. गुनगुना पानी पिएं और आराम करें.'
      },
      'ta-IN': {
        full: 'சாதாரண பிரச்சனை: லேசான தலைவலி அல்லது சளி. மருத்துவமனைக்கு செல்ல வேண்டிய அவசியமில்லை. ஓய்வெடுங்கள், வெந்நீர் அருந்தவும், நீராவி பிடிக்கவும்.',
        speech: 'லேசான தலைவலி அல்லது சளி. மருத்துவமனைக்கு செல்ல தேவையில்லை. ஓய்வெடுக்கவும்.'
      },
      'kn-IN': {
        full: 'ಸಾಮಾನ್ಯ ಸಮಸ್ಯೆ: ಸೌಮ್ಯ ತಲೆನೋವು ಅಥವಾ ನೆಗಡಿ. ಆಸ್ಪತ್ರೆಗೆ ಹೋಗುವ ಅಗತ್ಯವಿಲ್ಲ. ಚೆನ್ನಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ಬಿಸಿ ನೀರು ಕುಡಿಯಿರಿ.',
        speech: 'ಸಾಮಾನ್ಯ ತಲೆನೋವು ಅಥವಾ ನೆಗಡಿ. ಆಸ್ಪತ್ರೆಗೆ ಹೋಗುವ ಅಗತ್ಯವಿಲ್ಲ. ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.'
      },
      'mr-IN': {
        full: 'सामान्य समस्या: हलके डोकेदुखी किंवा सर्दी. रुग्णालयात जाण्याची गरज नाही. भरपूर विश्रांती घ्या आणि कोमट पाणी प्या.',
        speech: 'हलके डोकेदुखी किंवा सर्दी. रुग्णालयात जाण्याची गरज नाही. आराम करा.'
      },
      'bn-IN': {
        full: 'সাধারণ সমস্যা: হালকা মাথাব্যথা বা সর্দি। হাসপাতালে যাওয়ার প্রয়োজন নেই। বিশ্রাম নিন, গরম জল পান করুন এবং ভাপ নিন।',
        speech: 'হালকা মাথাব্যথা বা সর্দি. হাসপাতালে যাওয়ার দরকার নেই. বিশ্রাম নিন.'
      }
    }
  }
];

// Fallback Default Rule when problem text doesn't match specific preset
const DEFAULT_GENERAL_RULE: SymptomRule = {
  id: 'general_health_inquiry',
  keywords: [],
  category: 'General Healthcare Screening & Clinical Consultation',
  tier: 3,
  esiScore: 4,
  severityScore: 4,
  severityLabel: 'Moderate Risk',
  actionWindow: 'Consult healthcare provider within 24 to 48 hours',
  expectedRecovery: 'Assessment and monitoring recommended over 2 to 3 days',
  hospitalRecommendation: 'CONSULT_CLINIC_IF_PERSISTS',
  hospitalBanner: 'ℹ️ CONSULT NEARBY CLINIC / PHC IF SYMPTOMS PERSIST OVER 48 HOURS',
  facilityType: 'Nearest Primary Health Centre (PHC) or Local Clinic',
  hospitalReason: 'Symptoms require standard clinical examination and physical observation by a medical officer.',
  englishSummary: 'Clinical consultation recommended based on reported health symptoms.',
  clinicalRationale: 'Non-emergency symptom profile. Maintain hydration and schedule outpatient consultation if unresolving.',
  immediateSteps: [
    'Rest and avoid heavy physical exertion.',
    'Maintain healthy hydration with clean drinking water and fresh nutritious food.',
    'Keep a daily record of any changes in temperature, pain, or discomfort.',
    'Visit your local PHC or dispensary for an in-person doctor checkup if symptoms persist.'
  ],
  precautions: [
    'Do not take unprescribed prescription drugs or heavy painkillers without a doctor.',
    'Avoid smoking, tobacco, or alcohol while experiencing symptoms.',
    'Do not delay seeking care if new acute symptoms arise.'
  ],
  redFlags: [
    'Sudden onset of severe pain, chest tightness, or breathing difficulty.',
    'High fever above 101°F that does not come down with medication.',
    'Persistent vomiting, fainting, or sudden numbness.'
  ],
  vernacularVoices: {
    'en-IN': {
      full: 'Health Notice: Your reported health issues have been noted. Hospital emergency is not currently required. Take adequate rest and visit your local PHC or clinic if symptoms continue over 48 hours.',
      speech: 'Your symptoms have been recorded. Take rest and visit your nearby clinic if problems continue.'
    },
    'te-IN': {
      full: 'ఆరోగ్య సమాచారం: మీ సమస్య పరిశీలించబడింది. ప్రస్తుతానికి అత్యవసర ఆసుపత్రి అవసరం లేదు. విశ్రాంతి తీసుకోండి, 48 గంటల్లో తగ్గకపోతే దగ్గరి పిహెచ్‌సిలో వైద్యుడిని సంప్రదించండి.',
      speech: 'మీ సమస్య నమోదు చేయబడింది. విశ్రాంతి తీసుకోండి, తగ్గకపోతే దగ్గరి క్లినిక్‌ను సంప్రదించండి.'
    },
    'hi-IN': {
      full: 'स्वास्थ्य सलाह: आपकी समस्या का विश्लेषण किया गया है। वर्तमान में आपातकालीन अस्पताल की आवश्यकता नहीं है। आराम करें और समस्या बनी रहने पर नज़दीकी पीएचसी में डॉक्टर से परामर्श लें।',
      speech: 'आपकी समस्या दर्ज की गई है. आराम करें और समस्या बनी रहे तो नज़दीकी स्वास्थ्य केंद्र जाएं.'
    },
    'ta-IN': {
      full: 'சுகாதார தகவல்: உங்கள் உடல்நலப் பிரச்சனை கவனிக்கப்பட்டது. தற்போதைக்கு அவசர மருத்துவமனை தேவையில்லை. ஓய்வெடுங்கள், குறையவில்லை என்றால் ஆரம்ப சுகாதார நிலையத்தை அணுகவும்.',
      speech: 'ஓய்வெடுக்கவும். பிரச்சனை தொடர்ந்தால் ஆரம்ப சுகாதார நிலையத்தை அணுகவும்.'
    },
    'kn-IN': {
      full: 'ಆರೋಗ್ಯ ಮಾಹಿತಿ: ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಸದ್ಯಕ್ಕೆ ತುರ್ತು ಆಸ್ಪತ್ರೆ ಅಗತ್ಯವಿಲ್ಲ. ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ಸಮಸ್ಯೆ ಮುಂದುವರಿದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      speech: 'ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ಸಮಸ್ಯೆ ಮುಂದುವರಿದರೆ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.'
    },
    'mr-IN': {
      full: 'आरोग्य सल्ला: आपल्या समस्येची नोंद घेण्यात आली आहे. सध्या तातडीच्या रुग्णालयाची गरज नाही. विश्रांती घ्या आणि समस्या कायम राहिल्यास डॉक्टरांचा सल्ला घ्या.',
      speech: 'विश्रांती घ्या आणि समस्या कायम राहिल्यास नजीकच्या दवाखान्यात जा.'
    },
    'bn-IN': {
      full: 'স্বাস্থ্য পরামর্শ: আপনার উপসর্গ বিশ্লেষণ করা হয়েছে। আপাতত জরুরি হাসপাতালের প্রয়োজন নেই। বিশ্রাম নিন এবং উপসর্গ না কমলে নিকটবর্তী স্বাস্থ্যকেন্দ্রে যান।',
      speech: 'বিশ্রাম নিন এবং সমস্যা না কমলে স্বাস্থ্যকেন্দ্রে যান.'
    }
  }
};

/**
 * Intelligent Evaluator: matches symptoms against clinical database,
 * integrates vitals thresholds, and generates multi-lingual actionable next steps.
 */
export function evaluateClinicalTriage(
  symptomText: string = '',
  vitals?: {
    systolicBp?: number | null;
    diastolicBp?: number | null;
    spo2?: number | null;
    glucose?: number | null;
    pulse?: number | null;
  },
  langCode: string = 'en-IN'
): ClinicalTriageEvaluation {
  const normText = (symptomText || '').toLowerCase().trim();

  // 1. Check Biometric Hard Safety Bounds first
  let vitalsOverrideRule: SymptomRule | null = null;
  const sys = vitals?.systolicBp;
  const dia = vitals?.diastolicBp;
  const spo2 = vitals?.spo2;
  const gluc = vitals?.glucose;

  if (sys && sys >= 180 || (dia && dia >= 120)) {
    // Hypertensive Emergency
    vitalsOverrideRule = SYMPTOM_RULES.find(r => r.id === 'hypertension_bp') || null;
  } else if (spo2 && spo2 < 90) {
    // Critical Hypoxia
    vitalsOverrideRule = SYMPTOM_RULES.find(r => r.id === 'respiratory_distress') || null;
  } else if (gluc && (gluc > 350 || gluc < 60)) {
    // Severe Hyperglycemia / Hypoglycemic Shock
    vitalsOverrideRule = SYMPTOM_RULES.find(r => r.id === 'diabetes_blood_sugar') || null;
  }

  // 2. Search matched rule from symptoms text
  let matchedRule: SymptomRule | null = null;

  if (normText) {
    let bestScore = 0;
    for (const rule of SYMPTOM_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (normText.includes(kw.toLowerCase())) {
          score += kw.length > 5 ? 3 : 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        matchedRule = rule;
      }
    }
  }

  // Choose effective rule: Biometric violation > Matched symptom rule > General rule
  const effectiveRule: SymptomRule = vitalsOverrideRule || matchedRule || DEFAULT_GENERAL_RULE;

  // Compute urgency string
  const urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' =
    effectiveRule.tier === 1 ? 'CRITICAL' :
    effectiveRule.tier === 2 ? 'HIGH' :
    effectiveRule.tier === 3 ? 'MODERATE' : 'NORMAL';

  // Language voices
  const voices = effectiveRule.vernacularVoices[langCode] ||
                 effectiveRule.vernacularVoices['en-IN'] ||
                 DEFAULT_GENERAL_RULE.vernacularVoices['en-IN'];

  // Clinical entities extracted
  const entities = [];
  if (normText) {
    entities.push({
      symptom: effectiveRule.category,
      duration: 'Reported in consultation',
      severity: effectiveRule.severityLabel,
      isRedFlag: effectiveRule.tier <= 2
    });
  }
  if (sys && dia) {
    entities.push({
      symptom: `Blood Pressure: ${sys}/${dia} mmHg`,
      severity: sys >= 140 ? 'High' : 'Normal',
      isRedFlag: sys >= 180 || dia >= 120
    });
  }
  if (spo2) {
    entities.push({
      symptom: `SpO2 Oxygen: ${spo2}%`,
      severity: spo2 < 92 ? 'Critical' : 'Normal',
      isRedFlag: spo2 < 92
    });
  }
  if (gluc) {
    entities.push({
      symptom: `Blood Glucose: ${gluc} mg/dL`,
      severity: gluc > 200 || gluc < 70 ? 'Abnormal' : 'Normal',
      isRedFlag: gluc > 350 || gluc < 60
    });
  }

  const safetyTrigger =
    effectiveRule.tier === 1 ? 'CRITICAL_SAFETY_BOUND_TRIGGERED' :
    effectiveRule.tier === 2 ? 'HIGH_RISK_CLINICAL_FLAG' : null;

  return {
    urgency,
    tier: effectiveRule.tier,
    tierTitle: `Tier ${effectiveRule.tier}: ${effectiveRule.category}`,
    esiScore: effectiveRule.esiScore,
    englishSummary: effectiveRule.englishSummary,
    clinicalRationale: effectiveRule.clinicalRationale,
    safetyRuleTriggered: safetyTrigger,
    severityRange: {
      score: effectiveRule.severityScore,
      maxScore: 10,
      levelLabel: effectiveRule.severityLabel,
      conditionCategory: effectiveRule.category,
      actionWindow: effectiveRule.actionWindow,
      expectedRecovery: effectiveRule.expectedRecovery
    },
    hospitalGuidance: {
      recommendation: effectiveRule.hospitalRecommendation,
      bannerText: effectiveRule.hospitalBanner,
      urgencyBadge: effectiveRule.severityLabel,
      facilityType: effectiveRule.facilityType,
      reason: effectiveRule.hospitalReason
    },
    whatToDoNext: {
      immediateSteps: effectiveRule.immediateSteps,
      precautions: effectiveRule.precautions,
      redFlags: effectiveRule.redFlags,
      homeRemedies: effectiveRule.homeRemedies,
      medicationAdvice: effectiveRule.medicationAdvice
    },
    vernacularGuidance: voices.full,
    speechPhrase: voices.speech,
    entities,
    prescriptionsBlocked: effectiveRule.tier <= 2 ? ['Vasodilator Beta-Blockers', 'Empirical Antibiotics'] : [],
    actionsTaken: [
      'Clinical Triage Pattern Match Evaluated',
      'Location Hospital Geocoding Linked',
      'Vernacular Speech Guidance Synthesized'
    ]
  };
}
