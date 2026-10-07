import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Building2,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  Ambulance,
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Radio,
  FileText,
  User,
  TrendingUp,
  RefreshCw,
  BellRing,
  Search,
  ExternalLink,
  Info,
  HeartPulse,
  HeartHandshake,
  Navigation,
  LocateFixed
} from 'lucide-react';
import { fetchActiveTriageCases, acknowledgeTriageRecord, fetchPatientHistory } from '../services/api';
import { PatientProfile } from './RegistrationModal';
import {
  detectCurrentLocation,
  calculateDistanceKm,
  estimateAmbulanceMins,
  UserGeoLocation,
  VILLAGE_COORDINATES
} from '../services/locationService';

interface HospitalServicesProps {
  wsAlerts: any[];
  isWsConnected: boolean;
  activePatient?: PatientProfile | null;
}

interface HospitalInfo {
  id: string;
  name: string;
  type: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  emergencyPhone: string;
  generalPhone: string;
  distance: string;
  beds: string;
  isOpen24x7: boolean;
  opdTimings: string;
  facilities: string[];
  ayushmanBharatEmpaneled: boolean;
  howToContact: {
    emergency: string;
    opdAppointment: string;
    ambulanceSupport: string;
  };
}

const GOVERNMENT_HOSPITALS: HospitalInfo[] = [
  {
    id: 'gov-rims-adilabad',
    name: 'Rajiv Gandhi Institute of Medical Sciences (RIMS) & District Hospital',
    type: 'Medical College & District Hospital',
    district: 'Adilabad District',
    address: 'National Highway 44, Collectorate Road, Adilabad, Telangana - 504001',
    latitude: 19.6641,
    longitude: 78.5320,
    emergencyPhone: '+91-8732-220108',
    generalPhone: '+91-8732-226999',
    distance: '3.5 km from District Center',
    beds: '750 Beds',
    isOpen24x7: true,
    opdTimings: '8:30 AM – 1:30 PM (Mon to Sat), Emergency Casualty 24/7',
    facilities: [
      '24/7 Emergency Casualty & Trauma Care',
      'Intensive Care Unit (ICU & ICCU)',
      'Free Government Blood Bank',
      'Maternal & Neonatal Intensive Care (NICU)',
      'Hemodialysis Unit (Free under Aarogyasri)',
      'Digital X-Ray, CT Scan & Ultrasound',
      'Jan Aushadhi Free Generic Pharmacy'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-8732-220108 or 108. Head directly to Gate No. 1 Casualty Ward.',
      opdAppointment: 'Walk-in OP registration counter opens at 8:00 AM. Free consultation with doctors.',
      ambulanceSupport: 'Dial 108 for free rural ambulance transport directly to RIMS Emergency.'
    }
  },
  {
    id: 'gov-chc-utnoor',
    name: 'Utnoor Community Health Centre (CHC & Tribal Specialty Centre)',
    type: 'Community Health Centre (CHC)',
    district: 'Utnoor Tribal Agency Area',
    address: 'Near ITDA Office, Main Road, Utnoor, Adilabad - 504311',
    latitude: 19.3670,
    longitude: 78.7830,
    emergencyPhone: '+91-8731-274100',
    generalPhone: '+91-8731-274108',
    distance: '18 km from Adilabad Rural Clusters',
    beds: '100 Beds',
    isOpen24x7: true,
    opdTimings: '9:00 AM – 2:00 PM (Emergency 24x7)',
    facilities: [
      '24/7 Snakebite Antivenom & Anti-Rabies Unit',
      'Maternal & Child Health (MCH) Wing',
      'Malaria & Dengue Rapid Diagnostic Laboratory',
      'Basic ICU & Oxygen Pipeline Beds',
      'Free Ambulance Link to Village Clusters'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-8731-274100 for on-duty Medical Officer or inform local ASHA worker.',
      opdAppointment: 'Walk-in OP counter free of cost. Special tribal health camps held weekly.',
      ambulanceSupport: 'Dial 108 or contact Utnoor CHC Dispatch Unit.'
    }
  },
  {
    id: 'gov-chc-asifabad',
    name: 'Asifabad Community Health Centre (CHC - Komaram Bheem)',
    type: 'Community Health Centre (CHC)',
    district: 'Kumuram Bheem Asifabad District',
    address: 'Civil Hospital Road, Asifabad - 504293',
    latitude: 19.3630,
    longitude: 79.2850,
    emergencyPhone: '+91-8733-255108',
    generalPhone: '+91-8733-255200',
    distance: '32 km from Adilabad East',
    beds: '100 Beds',
    isOpen24x7: true,
    opdTimings: '9:00 AM – 1:30 PM (Emergency 24x7)',
    facilities: [
      '24/7 Emergency Maternity Delivery & Labor Room',
      'Pediatric Care Unit',
      'General Medicine & Surgical Ward',
      'Free Diagnostic Blood & Urine Testing',
      'Free Essential Drugs Dispensary'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-8733-255108 for emergency triage and casualty admitting.',
      opdAppointment: 'No prior appointment needed. Visit between 9 AM and 1 PM with Aadhaar card.',
      ambulanceSupport: 'Dial 108 for immediate ambulance dispatch.'
    }
  },
  {
    id: 'gov-ah-nirmal',
    name: 'Nirmal District Government Area Hospital',
    type: 'Area Hospital',
    district: 'Nirmal District',
    address: 'Near Old Bus Stand, Mancherial Road, Nirmal - 504106',
    latitude: 19.0964,
    longitude: 78.3434,
    emergencyPhone: '+91-8734-242108',
    generalPhone: '+91-8734-242199',
    distance: '48 km from South Adilabad',
    beds: '250 Beds',
    isOpen24x7: true,
    opdTimings: '8:30 AM – 1:30 PM (Emergency 24x7)',
    facilities: [
      'Trauma Care & Orthopedics',
      'General Surgery & ENT Specialists',
      'Gynecology & Newborn Care (SNCU)',
      'Free Dialysis Unit',
      '24/7 Pharmacy & Laboratory'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-8734-242108. Direct casualty entrance at Emergency Gate.',
      opdAppointment: 'Registration counters open 8:30 AM daily.',
      ambulanceSupport: '108 Ambulance service available 24 hours.'
    }
  },
  {
    id: 'gov-phc-rural',
    name: 'Adilabad Rural Primary Health Centre (Cluster 104 PHC)',
    type: 'Primary Health Centre (PHC)',
    district: 'Adilabad Rural Mandal',
    address: 'PHC Compound, Mavala Village, Adilabad Rural - 504002',
    latitude: 19.6450,
    longitude: 78.5250,
    emergencyPhone: '+91-8732-221104',
    generalPhone: '+91-8732-221105',
    distance: '4.2 km from Village Cluster',
    beds: '10 Observation Beds',
    isOpen24x7: false,
    opdTimings: '9:00 AM – 4:00 PM (Emergency stabilized & referred via 108)',
    facilities: [
      'Free NCD Screenings (BP & Diabetes Monthly Medication)',
      'Routine Immunization & Mother Care',
      'First Aid & Rapid Wound Dressing',
      'Malaria & Water-borne Disease Screening',
      'ASHA & ANM Village Field Worker Coordination'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-8732-221104 or notify village ASHA worker for 108 referral.',
      opdAppointment: 'Walk in directly from 9 AM to 4 PM. Completely free for all villagers.',
      ambulanceSupport: 'ASHA worker coordinates 108 / 102 ambulance pickup directly to home.'
    }
  },
  {
    id: 'gov-osmania-hyd',
    name: 'Osmania General Hospital & State Apex Emergency Care',
    type: 'Medical College & District Hospital',
    district: 'Hyderabad Apex Region',
    address: 'Afzal Gunj, Hyderabad, Telangana - 500012',
    latitude: 17.3753,
    longitude: 78.4744,
    emergencyPhone: '+91-40-24600121',
    generalPhone: '+91-40-24600125',
    distance: 'State Referral Center',
    beds: '1168 Beds',
    isOpen24x7: true,
    opdTimings: '24/7 Casualty & Multi-Specialty OPD',
    facilities: [
      'Level-1 State Trauma Care Centre',
      'Advanced Coronary & Neuro ICU',
      'Comprehensive Toxicology & Antivenom Core',
      'Full Surgical Theatres & Free Dialysis'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-40-24600121 or 108.',
      opdAppointment: 'Central Registration Block opens 7:30 AM daily.',
      ambulanceSupport: 'Dial 108 emergency dispatch.'
    }
  },
  {
    id: 'gov-gandhi-sec',
    name: 'Gandhi Hospital & Medical College',
    type: 'Medical College & District Hospital',
    district: 'Secunderabad Apex Region',
    address: 'Musheerabad, Padmarao Nagar, Secunderabad - 500003',
    latitude: 17.4244,
    longitude: 78.5039,
    emergencyPhone: '+91-40-27505566',
    generalPhone: '+91-40-27505500',
    distance: 'State Referral Center',
    beds: '1200 Beds',
    isOpen24x7: true,
    opdTimings: '24/7 Casualty & Specialty Outpatient',
    facilities: [
      'Emergency Resuscitation & High Dependency Unit',
      'Pediatric & Maternal Emergency Centre',
      'Advanced Cardiology & Nephrology Services',
      'Central 24x7 Pathology & Blood Bank'
    ],
    ayushmanBharatEmpaneled: true,
    howToContact: {
      emergency: 'Call +91-40-27505566 or 108.',
      opdAppointment: 'Free general OPD counters open Mon to Sat.',
      ambulanceSupport: 'Dial 108 for emergency transit.'
    }
  }
];

export const HospitalServices: React.FC<HospitalServicesProps> = ({ wsAlerts, isWsConnected, activePatient }) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'telemetry'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Telemetry Case states
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('ALL');

  const loadCases = async () => {
    try {
      const data = await fetchActiveTriageCases();
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (e) {
      console.warn('[Hospital Services] Error loading cases', e);
    }
  };

  useEffect(() => {
    loadCases();
    const interval = setInterval(loadCases, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCase?.patient_id) {
      fetchPatientHistory(selectedCase.patient_id)
        .then((res) => setPatientHistory(res.history || []))
        .catch(() => setPatientHistory([]));
    }
  }, [selectedCase?.patient_id]);

  const handleAcknowledge = async (actionType: string = 'ACKNOWLEDGE') => {
    if (!selectedCase) return;
    setIsUpdating(true);
    try {
      await acknowledgeTriageRecord(selectedCase.id, doctorNotes || undefined, actionType);
      await loadCases();
      setSelectedCase((prev: any) =>
        prev ? { ...prev, hospital_acknowledged: true, doctor_notes: doctorNotes } : null
      );
      setDoctorNotes('');
    } catch (err) {
      console.warn('[Doctor Action] Error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [sortByNearest, setSortByNearest] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    detectCurrentLocation(activePatient?.village).then((loc) => {
      if (mounted) setUserLocation(loc);
    });
    return () => {
      mounted = false;
    };
  }, [activePatient?.village]);

  const handleRefreshLocation = async () => {
    setIsDetectingGps(true);
    try {
      const loc = await detectCurrentLocation(activePatient?.village);
      setUserLocation(loc);
    } finally {
      setIsDetectingGps(false);
    }
  };

  const filteredHospitals = GOVERNMENT_HOSPITALS.filter((hosp) => {
    const matchesSearch =
      hosp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.facilities.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedType === 'ALL' ||
      (selectedType === 'DISTRICT' && hosp.type.includes('District')) ||
      (selectedType === 'CHC' && hosp.type.includes('CHC')) ||
      (selectedType === 'PHC' && hosp.type.includes('PHC'));

    return matchesSearch && matchesType;
  });

  const hospitalsWithDistance = filteredHospitals.map((hosp) => {
    const lat = userLocation ? userLocation.latitude : 19.6641;
    const lng = userLocation ? userLocation.longitude : 78.5320;
    const distKm = hosp.latitude && hosp.longitude ? calculateDistanceKm(lat, lng, hosp.latitude, hosp.longitude) : 0;
    const timeMins = estimateAmbulanceMins(distKm);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`;
    return {
      ...hosp,
      distKm,
      timeMins,
      mapsUrl
    };
  });

  if (sortByNearest) {
    hospitalsWithDistance.sort((a, b) => a.distKm - b.distKm);
  }

  const filteredCases = cases.filter((c) => {
    if (filterTier === 'ALL') return true;
    if (filterTier === 'TIER1') return c.esi_score === 1;
    if (filterTier === 'TIER2') return c.esi_score === 2 || c.esi_score === 3;
    if (filterTier === 'UNACK') return !c.hospital_acknowledged;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Emergency Toll-Free Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Hospital className="w-4 h-4" />
              <span>Government Healthcare Services &amp; Hospital Directory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hospital Services &amp; Medical Facilities
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              24/7 Government District Hospitals, Community Health Centres (CHC), Primary Health Centres (PHC),
              free ambulance hotlines, and real-time clinical triage receiving board.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-start lg:self-center">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'directory'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Nearby Hospitals ({GOVERNMENT_HOSPITALS.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('telemetry')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'telemetry'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Doctor Telemetry Board</span>
              {cases.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-900 text-[10px] text-blue-200">
                  {cases.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* National 24/7 Emergency Helplines Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a
            href="tel:108"
            className="flex items-center space-x-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 hover:bg-rose-900/70 transition-all text-white group"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <Ambulance className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-300">National Ambulance</div>
              <div className="text-base font-extrabold font-mono leading-none">108</div>
              <div className="text-[10px] text-slate-400">24/7 Free Emergency</div>
            </div>
          </a>

          <a
            href="tel:104"
            className="flex items-center space-x-3 p-2.5 rounded-xl bg-teal-950/70 border border-teal-800/80 hover:bg-teal-900/70 transition-all text-white group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-teal-300">Health Advice Helpline</div>
              <div className="text-base font-extrabold font-mono leading-none">104</div>
              <div className="text-[10px] text-slate-400">Doctor Advice &amp; Schemes</div>
            </div>
          </a>

          <a
            href="tel:102"
            className="flex items-center space-x-3 p-2.5 rounded-xl bg-pink-950/70 border border-pink-800/80 hover:bg-pink-900/70 transition-all text-white group"
          >
            <div className="w-9 h-9 rounded-lg bg-pink-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-pink-300">Mother &amp; Child Express</div>
              <div className="text-base font-extrabold font-mono leading-none">102</div>
              <div className="text-[10px] text-slate-400">Pregnant Women Transport</div>
            </div>
          </a>

          <a
            href="tel:112"
            className="flex items-center space-x-3 p-2.5 rounded-xl bg-amber-950/70 border border-amber-800/80 hover:bg-amber-900/70 transition-all text-white group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-300">All-in-One Emergency</div>
              <div className="text-base font-extrabold font-mono leading-none">112</div>
              <div className="text-[10px] text-slate-400">Police, Fire &amp; Rescue</div>
            </div>
          </a>
        </div>
      </div>

      {/* VIEW 1: NEARBY GOVERNMENT HOSPITALS DIRECTORY & CONTACT DETAILS */}
      {activeSubTab === 'directory' ? (
        <div className="space-y-5 animate-fade-in">
          {/* User Location Bar & Nearest Sorting Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-teal-500/20 text-xs">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-medium">Your Location Reference:</span>
                  <span className="text-white font-bold">{userLocation?.locationName || 'Detecting...'}</span>
                  {userLocation?.source === 'gps' && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                      Live GPS
                    </span>
                  )}
                </div>
                {userLocation && (
                  <span className="text-[11px] text-slate-400">
                    {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setSortByNearest(!sortByNearest)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  sortByNearest
                    ? 'bg-teal-600 text-white border-teal-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>{sortByNearest ? 'Sorted: Nearest First' : 'Sort by Distance'}</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={isDetectingGps}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-teal-300 border border-slate-700 transition cursor-pointer"
                title="Refresh location with live GPS"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search hospital, facility, or department..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setSelectedType('ALL')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedType === 'ALL'
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                All Facilities
              </button>
              <button
                onClick={() => setSelectedType('DISTRICT')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedType === 'DISTRICT'
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Medical Colleges &amp; District
              </button>
              <button
                onClick={() => setSelectedType('CHC')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedType === 'CHC'
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                CHC Centers
              </button>
              <button
                onClick={() => setSelectedType('PHC')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedType === 'PHC'
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Rural PHC
              </button>
            </div>
          </div>

          {/* Hospitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hospitalsWithDistance.map((hospital) => (
              <div
                key={hospital.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-950 text-teal-300 border border-teal-800">
                      {hospital.type}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {hospital.isOpen24x7 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>24/7 Open</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {hospital.beds}
                      </span>
                    </div>
                  </div>

                  {/* Hospital Name & District */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {hospital.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{hospital.address}</span>
                    </p>
                  </div>

                  {/* Timing & Distance Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{hospital.opdTimings}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-teal-300 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{hospital.distKm} km ({hospital.timeMins}m)</span>
                    </div>
                  </div>

                  {/* Facilities List */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Available Facilities &amp; Departments:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hospital.facilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{fac}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* How to Contact Instructions Box */}
                  <div className="bg-teal-950/30 border border-teal-900/60 rounded-2xl p-3 text-xs space-y-1.5">
                    <span className="font-bold text-teal-300 flex items-center space-x-1.5 uppercase text-[10px] tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      <span>How to Contact &amp; Seek Treatment</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong>Emergency:</strong> {hospital.howToContact.emergency}
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong>Free OPD:</strong> {hospital.howToContact.opdAppointment}
                    </p>
                  </div>
                </div>

                {/* Call & Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                  <a
                    href={`tel:${hospital.emergencyPhone.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white shadow-md shadow-rose-600/30 transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Emergency ({hospital.emergencyPhone})</span>
                  </a>

                  <a
                    href="tel:108"
                    className="flex items-center justify-center space-x-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-all"
                    title="Dispatch 108 Ambulance to this facility"
                  >
                    <Ambulance className="w-3.5 h-3.5" />
                    <span>Dispatch 108</span>
                  </a>

                  <a
                    href={hospital.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-all"
                    title="Get turn-by-turn navigation in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Rural Patient Guide to Free Government Healthcare */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5 text-teal-300 font-bold text-sm">
              <HeartHandshake className="w-5 h-5" />
              <span>Guide: How Rural Patients Receive 100% Free Treatment at Government Hospitals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-white block text-sm">1. Documents Needed</span>
                <p className="text-slate-400">
                  Bring your <strong>Aadhaar Card</strong> and <strong>Ration Card (Food Security Card)</strong> or <strong>Ayushman Bharat / Aarogyasri Card</strong> to receive completely free diagnosis, surgeries, and medicines.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-white block text-sm">2. Free Ambulance Rights</span>
                <p className="text-slate-400">
                  Dial <strong>108</strong> from any phone without recharge or balance. Government ambulances reach rural village clusters within 20–30 minutes equipped with emergency oxygen and paramedic support.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-white block text-sm">3. Free Medicines (Jan Aushadhi)</span>
                <p className="text-slate-400">
                  All government hospital pharmacies supply free essential medicines for high blood pressure, diabetes, asthma, fever, and antibiotics. Never pay any fee at government hospital counters.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: DOCTOR TELEMETRY & PATIENT TRIAGE BOARD (Existing Receiving Workspace) */
        <div className="space-y-6 animate-fade-in">
          {/* Top Telemetry Feed Status Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Radio className={`w-6 h-6 ${isWsConnected ? 'text-teal-400 animate-pulse' : 'text-slate-500'}`} />
                {isWsConnected && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">Hospital Telemetry Receiving Board</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isWsConnected
                        ? 'bg-teal-950 text-teal-300 border-teal-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {isWsConnected ? 'Live WebSocket Connected (Sub-Second Ingestion)' : 'Connecting to Telemetry Hub...'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Adilabad District Headquarters Hospital &amp; Trauma Care Unit | Live PHC Tele-triage Hub
                </p>
              </div>
            </div>

            {/* Live WS Alerts counter */}
            <div className="flex items-center space-x-3">
              {wsAlerts.length > 0 && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 animate-pulse text-xs font-bold">
                  <BellRing className="w-4 h-4 text-rose-400" />
                  <span>{wsAlerts.length} Instant Red-Flag Alert(s)</span>
                </div>
              )}

              {/* Refresh button */}
              <button
                onClick={loadCases}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs cursor-pointer"
                title="Refresh clinical cases"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main 2-Column Doctor Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Triage Queue (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Filter tabs */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setFilterTier('ALL')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterTier === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Cases ({cases.length})
                </button>
                <button
                  onClick={() => setFilterTier('TIER1')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterTier === 'TIER1' ? 'bg-rose-900 text-rose-100 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tier 1 Crisis
                </button>
                <button
                  onClick={() => setFilterTier('UNACK')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterTier === 'UNACK' ? 'bg-amber-900 text-amber-100 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Cases List */}
              <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                {filteredCases.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    No active cases matching filter.
                  </div>
                ) : (
                  filteredCases.map((item) => {
                    const isSelected = selectedCase?.id === item.id;
                    const isCrisis = item.esi_score === 1;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCase(item)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-slate-800/90 shadow-md ring-1 ring-teal-500/30'
                            : isCrisis
                            ? 'border-rose-800/80 bg-rose-950/20 hover:bg-rose-950/40'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isCrisis ? (
                              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                            ) : item.esi_score <= 3 ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-bold text-sm text-white">{item.patient_name}</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                item.esi_score === 1
                                  ? 'bg-rose-900 text-rose-200 border border-rose-700'
                                  : item.esi_score <= 3
                                  ? 'bg-amber-900 text-amber-200 border border-amber-700'
                                  : 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                              }`}
                            >
                              ESI-{item.esi_score || '?'}
                            </span>
                            {item.hospital_acknowledged ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                                ACK'D
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Vitals summary line */}
                        {item.latest_vitals && (
                          <div className="mt-2 flex items-center space-x-3 text-xs font-mono text-slate-300 bg-slate-950/60 px-2 py-1 rounded">
                            <span>BP: {item.latest_vitals.systolic || '--'}/{item.latest_vitals.diastolic || '--'}</span>
                            <span>SpO2: {item.latest_vitals.spo2 || '--'}%</span>
                            <span>Glu: {item.latest_vitals.glucose || '--'}</span>
                          </div>
                        )}

                        <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">
                          {item.raw_transcript || 'Routine biometric evaluation'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Case Deep Dive & Actions (7 cols) */}
            <div className="lg:col-span-7">
              {selectedCase ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white">{selectedCase.patient_name}</h3>
                        <span className="text-xs font-mono text-slate-400">ID: {selectedCase.patient_id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Location: Village {selectedCase.village_code} | Recorded: {new Date(selectedCase.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                          selectedCase.esi_score === 1
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : selectedCase.esi_score <= 3
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        Emergency Severity Index: ESI-{selectedCase.esi_score}
                      </span>
                    </div>
                  </div>

                  {/* Latest Biometrics Snapshot */}
                  {selectedCase.latest_vitals && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Blood Pressure</div>
                        <div className="text-lg font-bold text-white font-mono">
                          {selectedCase.latest_vitals.systolic || '--'} / {selectedCase.latest_vitals.diastolic || '--'}
                        </div>
                        <div className="text-[10px] text-slate-500">mmHg</div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">SpO2 Oxygen</div>
                        <div className="text-lg font-bold text-white font-mono">
                          {selectedCase.latest_vitals.spo2 || '--'}%
                        </div>
                        <div className="text-[10px] text-slate-500">Saturation</div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Blood Glucose</div>
                        <div className="text-lg font-bold text-white font-mono">
                          {selectedCase.latest_vitals.glucose || '--'}
                        </div>
                        <div className="text-[10px] text-slate-500">mg/dL</div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Safety Urgency</div>
                        <div
                          className={`text-sm font-bold uppercase ${
                            selectedCase.latest_vitals.urgency_level === 'CRITICAL'
                              ? 'text-rose-400'
                              : selectedCase.latest_vitals.urgency_level === 'HIGH'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {selectedCase.latest_vitals.urgency_level}
                        </div>
                        <div className="text-[10px] text-slate-500">Tier Gate</div>
                      </div>
                    </div>
                  )}

                  {/* Reported Transcript */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                      <FileText className="w-4 h-4 text-teal-400" />
                      <span>Clinical Symptoms &amp; Extracted Entities</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs text-slate-300">
                        <strong>Reported Transcript:</strong>{' '}
                        <span className="italic text-slate-400">"{selectedCase.raw_transcript || 'Routine checkup'}"</span>
                      </div>
                    </div>
                  </div>

                  {/* Longitudinal Biometric Trends */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span>Longitudinal Biometric Trend ({patientHistory.length} readings)</span>
                    </div>
                    {patientHistory.length > 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-800">
                          <span>Date</span>
                          <span>BP (SYS/DIA)</span>
                          <span>SpO2</span>
                          <span>Glucose</span>
                        </div>
                        {patientHistory.slice(-4).map((entry, idx) => (
                          <div key={idx} className="grid grid-cols-4 text-xs font-mono text-slate-300 py-1 border-b border-slate-900 last:border-0">
                            <span className="text-slate-500 text-[11px]">{new Date(entry.recorded_at).toLocaleDateString()}</span>
                            <span className={entry.systolic >= 140 ? 'text-amber-400 font-bold' : ''}>
                              {entry.systolic || '--'}/{entry.diastolic || '--'}
                            </span>
                            <span className={entry.spo2 < 94 ? 'text-rose-400 font-bold' : ''}>
                              {entry.spo2 || '--'}%
                            </span>
                            <span>{entry.glucose || '--'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No previous historical readings recorded.</p>
                    )}
                  </div>

                  {/* Doctor Actions */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Attending Medical Officer Notes &amp; Action
                    </label>
                    <textarea
                      rows={2}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Enter clinical notes, referral instructions, or ambulance dispatch comments..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAcknowledge('ACKNOWLEDGE')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Acknowledge Case</span>
                      </button>

                      <button
                        onClick={() => handleAcknowledge('DISPATCH_AMBULANCE')}
                        disabled={isUpdating}
                        className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/40 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Dispatch 108 Ambulance</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  Select a clinical case from the triage queue to inspect full telemetry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
