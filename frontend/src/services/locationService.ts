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
  'Hyderabad / Secunderabad': { lat: 17.385, lng: 78.4867, name: 'Hyderabad City Center' }
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
  {
    id: 'gov-rims-adilabad',
    name: 'Rajiv Gandhi Institute of Medical Sciences (RIMS) & District Hospital',
    hospital_type: 'Medical College & District Hospital',
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
 * Detects current user location:
 * 1. Attempts high-accuracy browser GPS (navigator.geolocation)
 * 2. If denied or timed out, falls back to patient's registered village coordinates
 */
export async function detectCurrentLocation(fallbackVillage?: string): Promise<UserGeoLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(getVillageFallback(fallbackVillage));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
          locationName: fallbackVillage
            ? `${fallbackVillage} (GPS Verified)`
            : `Live GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        });
      },
      (err) => {
        console.warn('[LocationService] Geolocation unavailable or denied, falling back to village preset:', err.message);
        resolve(getVillageFallback(fallbackVillage));
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000
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
