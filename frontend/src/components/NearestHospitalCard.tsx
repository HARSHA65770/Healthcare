import React, { useState, useEffect } from 'react';
import {
  MapPin,
  PhoneCall,
  Ambulance,
  Navigation,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Hospital,
  AlertTriangle,
  Building2,
  ExternalLink,
  CheckCircle2,
  Info,
  Phone,
  Radio,
  LocateFixed
} from 'lucide-react';
import {
  NearestHospitalItem,
  NearestHospitalResponse,
  fetchNearestHospitals
} from '../services/api';
import {
  detectCurrentLocation,
  computeOfflineNearestHospitals,
  UserGeoLocation,
  VILLAGE_COORDINATES
} from '../services/locationService';
import { PatientProfile } from './RegistrationModal';

interface NearestHospitalCardProps {
  patient: PatientProfile | null;
  isOnline: boolean;
  onNavigateToHospitalDirectory?: () => void;
  compact?: boolean;
}

export const NearestHospitalCard: React.FC<NearestHospitalCardProps> = ({
  patient,
  isOnline,
  onNavigateToHospitalDirectory,
  compact = false
}) => {
  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>(null);
  const [hospitalData, setHospitalData] = useState<NearestHospitalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [showFacilities, setShowFacilities] = useState<boolean>(false);
  const [showMoreHospitals, setShowMoreHospitals] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(patient?.village || 'Adilabad Rural (Cluster 104)');

  const loadHospitals = async (loc: UserGeoLocation) => {
    setIsLoading(true);
    try {
      if (isOnline) {
        try {
          const res = await fetchNearestHospitals({
            lat: loc.latitude,
            lng: loc.longitude,
            village: loc.locationName,
            limit: 5
          });
          setHospitalData(res);
          setIsLoading(false);
          return;
        } catch (apiErr) {
          console.warn('[NearestHospitalCard] Backend API fetch failed, using offline calculation:', apiErr);
        }
      }
      // Offline fallback calculation
      const offlineRes = computeOfflineNearestHospitals(
        loc.latitude,
        loc.longitude,
        loc.locationName,
        loc.source,
        5
      );
      setHospitalData(offlineRes);
    } catch (e) {
      console.error('[NearestHospitalCard] Error computing hospitals:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial location detection on component mount or patient change
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      setIsLoading(true);
      const detected = await detectCurrentLocation(patient?.village);
      if (!isMounted) return;
      setUserLocation(detected);
      setSelectedPreset(patient?.village || detected.locationName);
      await loadHospitals(detected);
    };

    initLocation();
    return () => {
      isMounted = false;
    };
  }, [patient?.village, isOnline]);

  const handleRefreshGps = async () => {
    setIsDetectingGps(true);
    try {
      const loc = await detectCurrentLocation(patient?.village);
      setUserLocation(loc);
      await loadHospitals(loc);
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handlePresetChange = async (presetName: string) => {
    setSelectedPreset(presetName);
    if (VILLAGE_COORDINATES[presetName]) {
      const p = VILLAGE_COORDINATES[presetName];
      const newLoc: UserGeoLocation = {
        latitude: p.lat,
        longitude: p.lng,
        source: 'village_preset',
        locationName: p.name
      };
      setUserLocation(newLoc);
      await loadHospitals(newLoc);
    }
  };

  const nearest = hospitalData?.nearest_hospital;

  if (isLoading && !hospitalData) {
    return (
      <div className="rounded-2xl border border-teal-500/20 bg-slate-900/80 p-4 sm:p-5 flex items-center justify-center space-x-3 text-slate-300">
        <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
        <span className="text-sm font-medium">Detecting your location and finding nearest emergency hospital...</span>
      </div>
    );
  }

  if (!nearest) return null;

  return (
    <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950 p-4 sm:p-5 shadow-xl shadow-teal-950/20 space-y-4">
      {/* Location Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Your Location:</span>
              <span className="text-white font-bold">{userLocation?.locationName}</span>
              {userLocation?.source === 'gps' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPS Active</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
                  Village Preset
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              {userLocation?.latitude.toFixed(4)}° N, {userLocation?.longitude.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Location Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-teal-500"
            title="Switch village location preset"
          >
            {Object.keys(VILLAGE_COORDINATES).map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRefreshGps}
            disabled={isDetectingGps}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Detect live GPS coordinates from your device"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Main Nearest Hospital Highlight Banner */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold tracking-wider uppercase flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>Nearest Emergency Hospital</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium">
                {nearest.hospital_type}
              </span>
              {nearest.is_open_24x7 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>24/7 Casualty Open</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Hospital className="w-5 h-5 text-teal-400 shrink-0" />
              <span>{nearest.name}</span>
            </h3>

            <p className="text-xs text-slate-300 flex items-start space-x-1.5 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{nearest.address}</span>
            </p>
          </div>

          {/* Distance & ETA Badge */}
          <div className="p-3 rounded-2xl bg-teal-950/60 border border-teal-800/60 text-right shrink-0 self-start">
            <div className="text-lg font-extrabold text-teal-300">
              {nearest.distance_km} <span className="text-xs font-semibold text-teal-400">km</span>
            </div>
            <div className="text-[11px] text-teal-200 font-medium flex items-center justify-end space-x-1">
              <Ambulance className="w-3.5 h-3.5 text-teal-400" />
              <span>~{nearest.estimated_time_mins} mins travel</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Emergency Line Call Button */}
          <a
            href={`tel:${nearest.emergency_phone}`}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Call Emergency ({nearest.emergency_phone})</span>
          </a>

          {/* 108 Free Rural Ambulance Hotline */}
          <a
            href="tel:108"
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-950/30 transition-all cursor-pointer"
          >
            <Ambulance className="w-4 h-4" />
            <span>Dial 108 (Free Ambulance)</span>
          </a>

          {/* Google Maps Live Route Directions */}
          <a
            href={nearest.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold text-xs transition-all cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions</span>
          </a>
        </div>

        {/* Contact Details & Timings Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>
              <strong>OPD:</strong> {nearest.opd_timings || 'Daily Free Consultations'}
            </span>
          </div>

          {nearest.general_phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>
                <strong>General Desk:</strong>{' '}
                <a href={`tel:${nearest.general_phone}`} className="text-teal-300 hover:underline">
                  {nearest.general_phone}
                </a>
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1 text-emerald-400 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ayushman Bharat (PM-JAY) Covered</span>
          </div>
        </div>

        {/* Collapsible: Facilities & How to Contact Details */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFacilities(!showFacilities)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 text-xs text-slate-300 transition cursor-pointer"
          >
            <span className="font-semibold text-teal-300 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital Facilities &amp; Contact Protocol</span>
            </span>
            {showFacilities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFacilities && (
            <div className="p-3 mt-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-3 animate-fade-in">
              {/* Facilities tags */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                  Available Medical Facilities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nearest.facilities.map((f, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-teal-950/50 border border-teal-800/40 text-teal-200 text-[11px]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* How to contact guidelines */}
              {nearest.how_to_contact && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Contact Instructions:
                  </span>
                  {nearest.how_to_contact.emergency && (
                    <p className="text-slate-300">
                      <strong>Emergency Admission:</strong> {nearest.how_to_contact.emergency}
                    </p>
                  )}
                  {nearest.how_to_contact.ambulanceSupport && (
                    <p className="text-slate-300">
                      <strong>Ambulance Support:</strong> {nearest.how_to_contact.ambulanceSupport}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible: Other Nearby Hospitals */}
        {hospitalData && hospitalData.nearby_hospitals.length > 1 && (
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowMoreHospitals(!showMoreHospitals)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 text-xs text-slate-300 transition cursor-pointer"
            >
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Hospital className="w-3.5 h-3.5 text-teal-400" />
                <span>Other Nearby Hospitals in Region ({hospitalData.nearby_hospitals.length - 1} more)</span>
              </span>
              {showMoreHospitals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMoreHospitals && (
              <div className="p-3 mt-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 animate-fade-in">
                {hospitalData.nearby_hospitals.slice(1).map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{h.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                          {h.hospital_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{h.address}</p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-teal-400">{h.distance_km} km</span>
                        <span className="block text-[10px] text-slate-400">~{h.estimated_time_mins} mins</span>
                      </div>
                      <a
                        href={`tel:${h.emergency_phone}`}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center space-x-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Emergency Helplines Bar */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">National Emergency Helplines:</span>
        <div className="flex flex-wrap gap-2 font-mono">
          <a href="tel:108" className="text-rose-400 hover:underline">
            108 (Ambulance)
          </a>
          <span>&bull;</span>
          <a href="tel:102" className="text-pink-400 hover:underline">
            102 (Mother &amp; Child)
          </a>
          <span>&bull;</span>
          <a href="tel:104" className="text-cyan-400 hover:underline">
            104 (Health Advice)
          </a>
          <span>&bull;</span>
          <a href="tel:112" className="text-amber-400 hover:underline">
            112 (National Emergency)
          </a>
          <span>&bull;</span>
          <a href="tel:14555" className="text-emerald-400 hover:underline">
            14555 (PM-JAY)
          </a>
        </div>
      </div>
    </div>
  );
};
