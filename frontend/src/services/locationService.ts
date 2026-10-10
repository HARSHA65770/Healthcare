import { NearestHospitalItem, NearestHospitalResponse } from './api';

export interface UserGeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps' | 'village_preset' | 'default';
  locationName: string;
}

export const VILLAGE_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'Adilabad Rural (Cluster 104)': { lat: 19.6641, lng: 78.532, name: 'Adilabad Rural (Cluster 104)' },
  'Asifabad Sector 2 (Komaram Bheem)': { lat: 19.36, lng: 79.28, name: 'Asifabad Sector 2 (Komaram Bheem)' },
  'Utnoor Tribal Cluster (ITDA)': { lat: 19.3667, lng: 78.7833, name: 'Utnoor Tribal Cluster (ITDA)' },
  'Nirmal Town Mandal': { lat: 19.0964, lng: 78.3434, name: 'Nirmal Town Mandal' },
  'Bela Border Hamlet': { lat: 19.78, lng: 78.8, name: 'Bela Border Hamlet' },
  'Hyderabad / Secunderabad': { lat: 17.385, lng: 78.4867, name: 'Hyderabad City Center' },
  'Warangal / Hanamkonda': { lat: 17.9784, lng: 79.5941, name: 'Warangal / Hanamkonda' },
  'Bengaluru (Koramangala/City)': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru City' },
  'Chennai (Central/George Town)': { lat: 13.0827, lng: 80.2707, name: 'Chennai City' },
  'Mumbai (South/Central)': { lat: 18.995, lng: 72.84, name: 'Mumbai City' },
  'New Delhi (AIIMS / Connaught Place)': { lat: 28.6139, lng: 77.209, name: 'New Delhi' },
  'Kolkata (Park Street/Howrah)': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  'Visakhapatnam (KGH / Beach Road)': { lat: 17.7042, lng: 83.3032, name: 'Visakhapatnam' },
  'Vijayawada (Benz Circle / City)': { lat: 16.5062, lng: 80.648, name: 'Vijayawada' }
};

export const OFFLINE_MASTER_HOSPITALS: Array<{
  id: string;
  name: string;
  hospital_type: string;
  district_code: string;
  address: string;
  latitude: number;
  longitude: number;
  emergency_phone: string;
  general_phone?: string;
  ambulance_phone: string;
  is_open_24x7: boolean;
  opd_timings?: string;
  facilities: string[];
  ayushman_empaneled: boolean;
  how_to_contact?: {
    emergency?: string;
    opdAppointment?: string;
    ambulanceSupport?: string;
  };
}> = [
  // TELANGANA - ADILABAD & SURROUNDING
  {
    id: 'gov-rims-adilabad',
    name: 'Rajiv Gandhi Institute of Medical Sciences (RIMS) & District Hospital',
    hospital_type: 'Medical College & District Apex Hospital',
    district_code: 'DIST-ADILABAD-01',
    address: 'National Highway 44, Collectorate Road, Adilabad, Telangana - 504001',
    latitude: 19.6641,
    longitude: 78.532,
    emergency_phone: '+91-8732-220108',
    general_phone: '+91-8732-226999',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '8:30 AM – 1:30 PM (Mon to Sat), Emergency Casualty 24/7',
    facilities: [
      '24/7 Emergency Casualty & Trauma Care',
      'Intensive Care Unit (ICU & ICCU)',
      'Free Government Blood Bank',
      'Maternal & Neonatal Intensive Care (NICU)',
      'Hemodialysis Unit (Free under Aarogyasri)',
      'Digital X-Ray, CT Scan & Ultrasound',
      'Jan Aushadhi Free Generic Pharmacy'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-8732-220108 or 108. Head directly to Gate No. 1 Casualty Ward.',
      opdAppointment: 'Walk-in OP registration counter opens at 8:00 AM. Free consultation.',
      ambulanceSupport: 'Dial 108 for free rural ambulance transport directly to RIMS Emergency.'
    }
  },
  {
    id: 'gov-phc-rural',
    name: 'Adilabad Rural Primary Health Centre (Cluster 104 PHC)',
    hospital_type: 'Primary Health Centre (PHC)',
    district_code: 'DIST-ADILABAD-RURAL',
    address: 'PHC Compound, Mavala Village, Adilabad Rural - 504002',
    latitude: 19.645,
    longitude: 78.525,
    emergency_phone: '+91-8732-221104',
    general_phone: '+91-8732-221105',
    ambulance_phone: '108',
    is_open_24x7: false,
    opd_timings: '9:00 AM – 4:00 PM (Emergency stabilized & referred via 108)',
    facilities: [
      'Free NCD Screenings (BP & Diabetes Monthly Medication)',
      'Routine Immunization & Mother Care',
      'First Aid & Rapid Wound Dressing',
      'Malaria & Water-borne Disease Screening',
      'ASHA & ANM Village Field Worker Coordination'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-8732-221104 or notify village ASHA worker for 108 referral.',
      opdAppointment: 'Walk in directly from 9 AM to 4 PM. Completely free for all villagers.',
      ambulanceSupport: 'ASHA worker coordinates 108 / 102 ambulance pickup directly to home.'
    }
  },
  {
    id: 'gov-chc-utnoor',
    name: 'Utnoor Community Health Centre (CHC & Tribal Specialty Centre)',
    hospital_type: 'Community Health Centre (CHC)',
    district_code: 'DIST-UTNOOR-02',
    address: 'Near ITDA Office, Main Road, Utnoor, Adilabad - 504311',
    latitude: 19.367,
    longitude: 78.783,
    emergency_phone: '+91-8731-274100',
    general_phone: '+91-8731-274108',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '9:00 AM – 2:00 PM (Emergency 24x7)',
    facilities: [
      '24/7 Snakebite Antivenom & Anti-Rabies Unit',
      'Maternal & Child Health (MCH) Wing',
      'Malaria & Dengue Rapid Diagnostic Laboratory',
      'Basic ICU & Oxygen Pipeline Beds',
      'Free Ambulance Link to Village Clusters'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-8731-274100 for on-duty Medical Officer or inform local ASHA worker.',
      opdAppointment: 'Walk-in OP counter free of cost. Special tribal health camps held weekly.',
      ambulanceSupport: 'Dial 108 or contact Utnoor CHC Dispatch Unit.'
    }
  },
  {
    id: 'gov-chc-asifabad',
    name: 'Asifabad Community Health Centre (CHC - Komaram Bheem)',
    hospital_type: 'Community Health Centre (CHC)',
    district_code: 'DIST-ASIFABAD-03',
    address: 'Civil Hospital Road, Asifabad - 504293',
    latitude: 19.363,
    longitude: 79.285,
    emergency_phone: '+91-8733-255108',
    general_phone: '+91-8733-255200',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '9:00 AM – 1:30 PM (Emergency 24x7)',
    facilities: [
      '24/7 Emergency Maternity Delivery & Labor Room',
      'Pediatric Care Unit',
      'General Medicine & Surgical Ward',
      'Free Diagnostic Blood & Urine Testing',
      'Free Essential Drugs Dispensary'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-8733-255108 for emergency triage and casualty admitting.',
      opdAppointment: 'No prior appointment needed. Visit between 9 AM and 1 PM with Aadhaar card.',
      ambulanceSupport: 'Dial 108 for immediate ambulance dispatch.'
    }
  },
  {
    id: 'gov-ah-nirmal',
    name: 'Nirmal District Government Area Hospital',
    hospital_type: 'Area Hospital',
    district_code: 'DIST-NIRMAL-04',
    address: 'Near Old Bus Stand, Mancherial Road, Nirmal - 504106',
    latitude: 19.0964,
    longitude: 78.3434,
    emergency_phone: '+91-8734-242108',
    general_phone: '+91-8734-242199',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '8:30 AM – 1:30 PM (Emergency 24x7)',
    facilities: [
      'Trauma Care & Orthopedics',
      'General Surgery & ENT Specialists',
      'Gynecology & Newborn Care (SNCU)',
      'Free Dialysis Unit',
      '24/7 Pharmacy & Laboratory'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-8734-242108. Direct casualty entrance at Emergency Gate.',
      opdAppointment: 'Registration counters open 8:30 AM daily.',
      ambulanceSupport: '108 Ambulance service available 24 hours.'
    }
  },

  // HYDERABAD & WARANGAL (TELANGANA)
  {
    id: 'gov-osmania-hyd',
    name: 'Osmania General Hospital & State Apex Emergency Care',
    hospital_type: 'State Apex Referral & Multi-Specialty Hospital',
    district_code: 'DIST-HYD-01',
    address: 'Afzal Gunj, Hyderabad, Telangana - 500012',
    latitude: 17.3753,
    longitude: 78.4744,
    emergency_phone: '+91-40-24600121',
    general_phone: '+91-40-24600125',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Casualty & Comprehensive Multi-Specialty OPD',
    facilities: [
      'Level-1 State Trauma Care Centre',
      'Advanced Coronary & Neuro ICU',
      'Comprehensive Toxicology & Snakebite Core',
      'Full Surgical Theatres & Free Dialysis Wing'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-40-24600121 or 108. Casualty reception open 24x7.',
      opdAppointment: 'Central Registration Block opens 7:30 AM daily.',
      ambulanceSupport: 'Dial 108 emergency dispatch.'
    }
  },
  {
    id: 'gov-gandhi-sec',
    name: 'Gandhi Hospital & Medical College',
    hospital_type: 'Medical College & Super Specialty Hospital',
    district_code: 'DIST-HYD-02',
    address: 'Musheerabad, Padmarao Nagar, Secunderabad, Telangana - 500003',
    latitude: 17.4244,
    longitude: 78.5039,
    emergency_phone: '+91-40-27505566',
    general_phone: '+91-40-27505500',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Casualty & All Specialty Departments',
    facilities: [
      'Emergency Resuscitation & High Dependency Unit',
      'Pediatric & Maternal Emergency Centre',
      'Advanced Cardiology & Nephrology Services',
      'Central 24x7 Pathology & Blood Bank'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-40-27505566 or 108. Direct ambulance ramp to Casualty.',
      opdAppointment: 'Free general OPD counters open Monday through Saturday.',
      ambulanceSupport: 'Dial 108 for emergency transit.'
    }
  },
  {
    id: 'gov-nims-hyd',
    name: "Nizam's Institute of Medical Sciences (NIMS)",
    hospital_type: 'Super Specialty Autonomous Apex Institute',
    district_code: 'DIST-HYD-03',
    address: 'Punjagutta, Hyderabad, Telangana - 500082',
    latitude: 17.4223,
    longitude: 78.4528,
    emergency_phone: '+91-40-23489000',
    general_phone: '+91-40-23489244',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Trauma & Critical Care Unit',
    facilities: [
      'Comprehensive Cardiac Cath Labs & Emergency Bypass',
      'Advanced Neuro-Trauma & Stroke Intervention',
      'Organ Transplant & Dialysis Super Center',
      'Ayushman Bharat & Aarogyasri Trust Empaneled'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-40-23489000. Emergency Trauma Ward Gate 2.',
      opdAppointment: 'Online and on-spot OPD counter from 8:00 AM.',
      ambulanceSupport: 'Dial 108 for emergency transport.'
    }
  },
  {
    id: 'gov-mgm-warangal',
    name: 'Mahatma Gandhi Memorial (MGM) Hospital & Kakatiya Medical College',
    hospital_type: 'District Referral & Teaching Hospital',
    district_code: 'DIST-WARANGAL-01',
    address: 'Station Road, Mattewada, Warangal, Telangana - 506007',
    latitude: 17.9784,
    longitude: 79.5941,
    emergency_phone: '+91-870-2441108',
    general_phone: '+91-870-2441100',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Casualty & Multi-Specialty Services',
    facilities: [
      'Comprehensive Emergency & Trauma Care Unit',
      'Snakebite Antivenom & Toxicology Emergency Ward',
      'Pediatric Intensive Care Unit (PICU)',
      'Aarogyasri Free Medical Services'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-870-2441108 or 108. Direct Casualty Gate.',
      opdAppointment: 'OPD registration open from 8:30 AM.',
      ambulanceSupport: 'Dial 108 ambulance dispatch.'
    }
  },

  // ANDHRA PRADESH
  {
    id: 'gov-kgh-vizag',
    name: 'King George Hospital (KGH) & Andhra Medical College',
    hospital_type: 'State Apex Teaching & Super Specialty Hospital',
    district_code: 'DIST-VIZAG-01',
    address: 'Collectorate Junction, Maharanipeta, Visakhapatnam, AP - 530002',
    latitude: 17.7042,
    longitude: 83.3032,
    emergency_phone: '+91-891-2564891',
    general_phone: '+91-891-2564893',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Casualty & All Specializations',
    facilities: [
      'Level-1 Regional Trauma Centre',
      'Advanced Cardiology & Cardiothoracic Surgery',
      'Pediatric & Neonatal Intensive Care (NICU)',
      'Free Aarogyasri / Ayushman Bharat Services'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-891-2564891 or 108. Casualty building entry.',
      opdAppointment: 'OP registration counters start 8:00 AM daily.',
      ambulanceSupport: 'Dial 108 emergency service.'
    }
  },
  {
    id: 'gov-ggh-vja',
    name: 'Government General Hospital (GGH) Vijayawada',
    hospital_type: 'Apex Teaching Hospital',
    district_code: 'DIST-KRS-01',
    address: 'MG Road, Hanumanpet, Vijayawada, AP - 520002',
    latitude: 16.5062,
    longitude: 80.648,
    emergency_phone: '+91-866-2578108',
    general_phone: '+91-866-2578100',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Casualty',
    facilities: [
      '24/7 Emergency Resuscitation & Trauma Ward',
      'Burn Care Unit & Snakebite ICU',
      'Dialysis & Blood Bank Services',
      'Aarogyasri PM-JAY Empaneled'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-866-2578108 or 108.',
      opdAppointment: 'Daily free OPD from 8:30 AM.',
      ambulanceSupport: 'Dial 108 for transport.'
    }
  },

  // BENGALURU (KARNATAKA)
  {
    id: 'gov-victoria-blr',
    name: 'Victoria Hospital & Bangalore Medical College (BMCRI)',
    hospital_type: 'Apex Government Medical College & Emergency Hospital',
    district_code: 'DIST-BLR-01',
    address: 'Fort Road, Near City Market, Kalasipalya, Bengaluru, Karnataka - 560002',
    latitude: 12.9647,
    longitude: 77.5756,
    emergency_phone: '+91-80-26701150',
    general_phone: '+91-80-26701151',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Trauma & Burns Unit',
    facilities: [
      'State Trauma Care Centre (Level 1)',
      'Apex Burns Center & Toxicology Ward',
      'Coronary Care Unit & Neuro ICU',
      'Ayushman Bharat Arogya Karnataka Covered'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-80-26701150 or 108. Direct ramp to Trauma Block.',
      opdAppointment: 'General OPD open 9:00 AM to 1:00 PM.',
      ambulanceSupport: 'Dial 108 emergency ambulance.'
    }
  },
  {
    id: 'gov-bowring-blr',
    name: 'Bowring & Lady Curzon Hospital',
    hospital_type: 'Government Teaching Hospital',
    district_code: 'DIST-BLR-02',
    address: 'Lady Curzon Road, Tasker Town, Shivajinagar, Bengaluru, Karnataka - 560001',
    latitude: 12.9822,
    longitude: 77.6045,
    emergency_phone: '+91-80-25591362',
    general_phone: '+91-80-25591325',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Casualty & OPD',
    facilities: [
      'Emergency Resuscitation & ICU',
      'Maternity, NICU & Pediatric Emergency',
      'Dialysis Unit & Central Pharmacy',
      'PM-JAY Scheme Covered'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-80-25591362 or dial 108.',
      opdAppointment: 'Walk-in registration from 8:30 AM.',
      ambulanceSupport: 'Dial 108.'
    }
  },

  // CHENNAI (TAMIL NADU)
  {
    id: 'gov-rgggh-chn',
    name: 'Rajiv Gandhi Government General Hospital (Madras Medical College)',
    hospital_type: 'State Apex Multi-Specialty & Teaching Hospital',
    district_code: 'DIST-CHN-01',
    address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu - 600003',
    latitude: 13.0805,
    longitude: 80.2783,
    emergency_phone: '+91-44-25305000',
    general_phone: '+91-44-25305115',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Casualty & All Super Specialties',
    facilities: [
      'Level-1 Emergency Trauma Care & ICU',
      'Zero-Delay Cardiac Intervention Centre',
      'Comprehensive Stroke Management Centre',
      'Chief Minister Comprehensive Health Insurance & PM-JAY'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-44-25305000 or dial 108. Trauma ward gate.',
      opdAppointment: 'OP counters open at 7:30 AM daily.',
      ambulanceSupport: 'Dial 108 free emergency dispatch.'
    }
  },

  // MUMBAI (MAHARASHTRA)
  {
    id: 'gov-kem-mum',
    name: 'King Edward Memorial (KEM) Hospital & Seth GS Medical College',
    hospital_type: 'Apex Municipal Teaching & Super Specialty Hospital',
    district_code: 'DIST-MUM-01',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra - 400012',
    latitude: 19.0028,
    longitude: 72.8427,
    emergency_phone: '+91-22-24107000',
    general_phone: '+91-22-24136051',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Casualty & Multi-Specialty Care',
    facilities: [
      'Comprehensive 24/7 Trauma Resuscitation Unit',
      'Advanced Cardiac Cath Lab & Stroke Unit',
      'Maternal & Neonatal Intensive Care (NICU)',
      'Mahatma Jyotirao Phule Jan Arogya & PM-JAY Empaneled'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-22-24107000 or 108. Casualty ground floor.',
      opdAppointment: 'General OPD registration open 8:00 AM to 12:30 PM.',
      ambulanceSupport: 'Dial 108 emergency ambulance.'
    }
  },

  // NEW DELHI
  {
    id: 'gov-aiims-del',
    name: 'All India Institute of Medical Sciences (AIIMS) New Delhi',
    hospital_type: 'National Apex Medical & Emergency Resuscitation Center',
    district_code: 'DIST-DEL-01',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi - 110029',
    latitude: 28.5672,
    longitude: 77.21,
    emergency_phone: '+91-11-26588500',
    general_phone: '+91-11-26588700',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Jai Prakash Narayan Apex Trauma Centre & Casualty',
    facilities: [
      'JPN Apex Trauma Centre (Level-1 National Emergency)',
      'Advanced Resuscitation & Emergency Medicine Dept',
      'Cardiology, Neurology, Toxicology & Critical Care',
      'Ayushman Bharat (PM-JAY) National Referral Hospital'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-11-26588500 or 108. Direct ambulance bay at Emergency Gate.',
      opdAppointment: 'Online registration or walk-in counter from 7:30 AM.',
      ambulanceSupport: 'Dial 108 / 102 for emergency response.'
    }
  },
  {
    id: 'gov-safdarjung-del',
    name: 'Safdarjung Hospital & VMMC Emergency Care',
    hospital_type: 'Central Government Super Specialty Hospital',
    district_code: 'DIST-DEL-02',
    address: 'Ring Road, Opposite AIIMS, New Delhi - 110029',
    latitude: 28.5705,
    longitude: 77.2072,
    emergency_phone: '+91-11-26707444',
    general_phone: '+91-11-26165060',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Super Specialty Emergency Block',
    facilities: [
      'State-of-the-Art Emergency & Trauma Center (500 beds)',
      'Dedicated National Burns & Plastic Surgery Centre',
      'Heart Command Center & Dialysis Units',
      'Free Treatment under Central Health Schemes'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-11-26707444 or 108. Emergency Block Gate No. 2.',
      opdAppointment: 'OPD registration 8:00 AM to 11:30 AM.',
      ambulanceSupport: 'Dial 108 for emergency transit.'
    }
  },

  // KOLKATA (WEST BENGAL)
  {
    id: 'gov-sskm-kol',
    name: 'SSKM Hospital (IPGMER) Kolkata',
    hospital_type: 'State Apex Post Graduate Medical Institute',
    district_code: 'DIST-KOL-01',
    address: '244 AJC Bose Road, Bhowanipore, Kolkata, West Bengal - 700020',
    latitude: 22.5392,
    longitude: 88.3435,
    emergency_phone: '+91-33-22231589',
    general_phone: '+91-33-22041100',
    ambulance_phone: '108',
    is_open_24x7: true,
    opd_timings: '24/7 Emergency Casualty & Trauma Care',
    facilities: [
      'Level-1 State Trauma Centre',
      'Cardiology, Nephrology, & Critical Care',
      'Toxicology & Poison Control Center',
      'Free Government Emergency Treatment'
    ],
    ayushman_empaneled: true,
    how_to_contact: {
      emergency: 'Call +91-33-22231589 or 108. Casualty reception open 24 hours.',
      opdAppointment: 'OPD registration open from 8:00 AM.',
      ambulanceSupport: 'Dial 108.'
    }
  }
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function estimateAmbulanceMins(distanceKm: number): number {
  const travel = Math.round((distanceKm / 45) * 60) + 3;
  return Math.max(4, travel);
}

/**
 * Reverse geocode latitude and longitude to get friendly human address/locality
 */
async function fetchReverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const place =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.city_district ||
          addr.village ||
          addr.town;
        const city = addr.city || addr.town || addr.county || addr.state_district || addr.state;
        if (place && city && place !== city) {
          return `${place}, ${city}`;
        }
        if (city) {
          return `${city} (${addr.state || ''})`.trim();
        }
        return data.display_name?.split(',').slice(0, 2).join(',').trim() || null;
      }
    }
  } catch (e) {
    // Timeout or network offline
  }
  return null;
}

/**
 * Detects current user location:
 * 1. Prompts real-time high-accuracy browser GPS (navigator.geolocation)
 * 2. Reverse-geocodes actual city/neighborhood name
 * 3. Falls back to patient profile village preset if denied or unavailable
 */
export async function detectCurrentLocation(fallbackVillage?: string): Promise<UserGeoLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(getVillageFallback(fallbackVillage));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // Try reverse-geocoding for real locality
        let resolvedName = await fetchReverseGeocode(lat, lng);

        if (!resolvedName) {
          // Check closest known regional anchor
          let closestPresetName = '';
          let minD = Infinity;
          for (const [name, p] of Object.entries(VILLAGE_COORDINATES)) {
            const d = calculateDistanceKm(lat, lng, p.lat, p.lng);
            if (d < minD) {
              minD = d;
              closestPresetName = name;
            }
          }

          if (minD < 30 && closestPresetName) {
            resolvedName = `Near ${closestPresetName} (GPS)`;
          } else {
            resolvedName = `Live GPS (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
          }
        }

        resolve({
          latitude: lat,
          longitude: lng,
          accuracy,
          source: 'gps',
          locationName: resolvedName
        });
      },
      (err) => {
        console.warn('[LocationService] Geolocation unavailable or denied, falling back:', err.message);
        resolve(getVillageFallback(fallbackVillage));
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 30000
      }
    );
  });
}

export function getVillageFallback(villageName?: string): UserGeoLocation {
  if (villageName && VILLAGE_COORDINATES[villageName]) {
    const p = VILLAGE_COORDINATES[villageName];
    return {
      latitude: p.lat,
      longitude: p.lng,
      source: 'village_preset',
      locationName: p.name
    };
  }

  if (villageName) {
    const matched = Object.entries(VILLAGE_COORDINATES).find(([k]) =>
      k.toLowerCase().includes(villageName.toLowerCase())
    );
    if (matched) {
      return {
        latitude: matched[1].lat,
        longitude: matched[1].lng,
        source: 'village_preset',
        locationName: matched[1].name
      };
    }
  }

  const def = VILLAGE_COORDINATES['Adilabad Rural (Cluster 104)'];
  return {
    latitude: def.lat,
    longitude: def.lng,
    source: 'default',
    locationName: villageName || def.name
  };
}

/**
 * Computes nearest hospitals purely in-browser for 100% offline resilience
 */
export function computeOfflineNearestHospitals(
  userLat: number,
  userLng: number,
  locationName: string,
  source: 'gps' | 'village_preset' | 'default' = 'village_preset',
  limit: number = 5
): NearestHospitalResponse {
  const calculated: NearestHospitalItem[] = OFFLINE_MASTER_HOSPITALS.map((h) => {
    const dist = calculateDistanceKm(userLat, userLng, h.latitude, h.longitude);
    const timeMins = estimateAmbulanceMins(dist);
    return {
      id: h.id,
      name: h.name,
      hospital_type: h.hospital_type,
      district_code: h.district_code,
      address: h.address,
      distance_km: dist,
      estimated_time_mins: timeMins,
      emergency_phone: h.emergency_phone,
      general_phone: h.general_phone,
      ambulance_phone: h.ambulance_phone || '108',
      is_open_24x7: h.is_open_24x7,
      opd_timings: h.opd_timings,
      facilities: h.facilities,
      ayushman_empaneled: h.ayushman_empaneled,
      google_maps_url: `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`,
      how_to_contact: h.how_to_contact
    };
  });

  calculated.sort((a, b) => a.distance_km - b.distance_km);

  return {
    user_location: {
      latitude: userLat,
      longitude: userLng,
      source,
      location_name: locationName
    },
    nearest_hospital: calculated[0] || null,
    nearby_hospitals: calculated.slice(0, limit),
    emergency_helplines: {
      ambulance: '108',
      national_emergency: '112',
      pregnant_mother_child: '102',
      tele_manas_mental_health: '14416',
      ayushman_bharat_helpline: '14555',
      health_information_advice: '104'
    }
  };
}
