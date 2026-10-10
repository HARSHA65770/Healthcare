// API Client and WebSocket Telemetry Connection
import {
  evaluateClinicalTriage,
  SeverityRangeInfo,
  HospitalGuidanceInfo,
  WhatToDoNextInfo
} from './clinicalTriage';
import {
  computeOfflineNearestHospitals,
  detectCurrentLocation
} from './locationService';
import { saveReadingOffline } from '../db/indexedDb';

export interface VitalsIngestionPayload {
  patient_id: string;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  spo2?: number | null;
  glucose_mg_dl?: number | null;
  symptom_audio_base64?: string | null;
  symptom_text?: string | null;
  language_code: string;
  district_code?: string;
  user_lat?: number | null;
  user_lng?: number | null;
  user_location_name?: string | null;
}

export interface IngestionResult {
  status: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
  tier: number;
  task_id: string;
  patient_id: string;
  timestamp: string;
  triage: {
    urgency_level: string;
    tier: number;
    tier_title: string;
    esi_score: number;
    entities: Array<{
      symptom: string;
      duration?: string;
      severity: string;
      is_red_flag: boolean;
    }>;
    clinical_rationale: string;
    vernacular_guidance: string;
    english_summary: string;
    safety_rule_triggered?: string | null;
    prescriptions_blocked: string[];
    actions_taken: string[];
    phc_dispatch_needed: boolean;
    emergency_broadcast_active: boolean;
    // Enhanced clinical parameters
    severity_range: SeverityRangeInfo;
    hospital_guidance: HospitalGuidanceInfo;
    what_to_do_next: WhatToDoNextInfo;
    speech_phrase: string;
    nearest_hospital_recommendation?: NearestHospitalItem | null;
  };
  offline_fallback_sms: string;
}

const RAW_API_URL = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

export async function ingestVitals(payload: VitalsIngestionPayload): Promise<IngestionResult> {
  // 1. Compute high-precision client-side clinical triage evaluation
  const evalResult = evaluateClinicalTriage(
    payload.symptom_text || '',
    {
      systolicBp: payload.systolic_bp,
      diastolicBp: payload.diastolic_bp,
      spo2: payload.spo2,
      glucose: payload.glucose_mg_dl
    },
    payload.language_code
  );

  // 2. Compute nearest hospital for patient's location
  let nearestHospital: NearestHospitalItem | null = null;
  try {
    let lat = payload.user_lat;
    let lng = payload.user_lng;
    let locName = payload.user_location_name;

    if (!lat || !lng) {
      const loc = await detectCurrentLocation(payload.district_code);
      lat = loc.latitude;
      lng = loc.longitude;
      locName = loc.locationName;
    }

    const hospitalResp = computeOfflineNearestHospitals(lat, lng, locName || 'Current Location', 'gps', 3);
    nearestHospital = hospitalResp.nearest_hospital;
  } catch (err) {
    console.warn('[ingestVitals] Location hospital calc fallback:', err);
  }

  // 3. Attempt posting to backend server if reachable
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE}/triage/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const backendData = await response.json();
      if (!backendData.triage) {
        backendData.triage = {} as any;
      }

      // 1. Ensure what_to_do_next has guaranteed camelCase arrays
      if (backendData.triage.what_to_do_next) {
        const w = backendData.triage.what_to_do_next;
        w.immediateSteps = (Array.isArray(w.immediateSteps) && w.immediateSteps.length > 0)
          ? w.immediateSteps
          : (Array.isArray(w.immediate_steps) && w.immediate_steps.length > 0)
          ? w.immediate_steps
          : (evalResult.whatToDoNext.immediateSteps || []);
        w.precautions = (Array.isArray(w.precautions) && w.precautions.length > 0)
          ? w.precautions
          : (evalResult.whatToDoNext.precautions || []);
        w.redFlags = (Array.isArray(w.redFlags) && w.redFlags.length > 0)
          ? w.redFlags
          : (Array.isArray(w.red_flags) && w.red_flags.length > 0)
          ? w.red_flags
          : (evalResult.whatToDoNext.redFlags || []);
        w.homeRemedies = (Array.isArray(w.homeRemedies) && w.homeRemedies.length > 0)
          ? w.homeRemedies
          : (Array.isArray(w.home_remedies) && w.home_remedies.length > 0)
          ? w.home_remedies
          : (evalResult.whatToDoNext.homeRemedies || []);
      } else {
        backendData.triage.what_to_do_next = evalResult.whatToDoNext;
      }

      // 2. Ensure hospital_guidance has guaranteed camelCase fields
      if (backendData.triage.hospital_guidance) {
        const h = backendData.triage.hospital_guidance;
        h.bannerText = h.bannerText || h.banner_text || evalResult.hospitalGuidance.bannerText;
        h.urgencyBadge = h.urgencyBadge || h.urgency_badge || evalResult.hospitalGuidance.urgencyBadge;
        h.facilityType = h.facilityType || h.facility_type || evalResult.hospitalGuidance.facilityType;
        h.recommendation = h.recommendation || evalResult.hospitalGuidance.recommendation;
        h.reason = h.reason || evalResult.hospitalGuidance.reason;
      } else {
        backendData.triage.hospital_guidance = evalResult.hospitalGuidance;
      }

      // 3. Ensure severity_range has guaranteed camelCase fields
      if (backendData.triage.severity_range) {
        const s = backendData.triage.severity_range;
        s.levelLabel = s.levelLabel || s.level_label || evalResult.severityRange.levelLabel;
        s.conditionCategory = s.conditionCategory || s.condition_category || evalResult.severityRange.conditionCategory;
        s.actionWindow = s.actionWindow || s.action_window || evalResult.severityRange.actionWindow;
        s.expectedRecovery = s.expectedRecovery || s.expected_recovery || evalResult.severityRange.expectedRecovery;
        s.maxScore = s.maxScore || s.max_score || 10;
        s.score = s.score ?? evalResult.severityRange.score;
      } else {
        backendData.triage.severity_range = evalResult.severityRange;
      }

      // 4. Verify text encoding and fallback to accurate vernacular strings
      const isCorruptedText = (str?: string | null) => {
        if (!str || typeof str !== 'string' || !str.trim()) return true;
        return str.includes('\u0085') || str.includes('\uFFFD') || (str.includes('?') && str.replace(/[^?]/g, '').length >= 3);
      };

      if (!backendData.triage.speech_phrase || isCorruptedText(backendData.triage.speech_phrase)) {
        backendData.triage.speech_phrase = evalResult.speechPhrase;
      }

      if (!backendData.triage.vernacular_guidance || isCorruptedText(backendData.triage.vernacular_guidance) || (backendData.triage.vernacular_guidance.includes('మీ ఆరోగ్యం నిలకడగా ఉంది') && evalResult.tier <= 3)) {
        backendData.triage.vernacular_guidance = evalResult.vernacularGuidance;
        backendData.triage.tier = evalResult.tier;
        backendData.triage.tier_title = evalResult.tierTitle;
        backendData.triage.esi_score = evalResult.esiScore;
        backendData.urgency = evalResult.urgency;
        backendData.tier = evalResult.tier;
      }

      if (!backendData.triage.nearest_hospital_recommendation) {
        backendData.triage.nearest_hospital_recommendation = nearestHospital;
      }
      return backendData;
    }
  } catch (err) {
    console.warn('[ingestVitals] Backend network unavailable, using autonomous offline clinical engine:', err);
  }

  // 4. Autonomous Client-Side Triage Fallback (100% resilient & zero dependency)
  // Always buffer in local IndexedDB
  try {
    await saveReadingOffline({
      local_id: 'local-' + Date.now(),
      patient_id: payload.patient_id,
      systolic_bp: payload.systolic_bp || undefined,
      diastolic_bp: payload.diastolic_bp || undefined,
      spo2: payload.spo2 || undefined,
      glucose_mg_dl: payload.glucose_mg_dl || undefined,
      symptom_text: payload.symptom_text || undefined,
      language_code: payload.language_code,
      district_code: payload.district_code || 'DIST-LOCAL-01',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.warn('[IndexedDB offline buffer error]', e);
  }

  return {
    status: 'SUCCESS_OFFLINE_AUTONOMOUS',
    urgency: evalResult.urgency,
    tier: evalResult.tier,
    task_id: 'task-auto-' + Math.floor(100000 + Math.random() * 900000),
    patient_id: payload.patient_id,
    timestamp: new Date().toISOString(),
    triage: {
      urgency_level: evalResult.urgency,
      tier: evalResult.tier,
      tier_title: evalResult.tierTitle,
      esi_score: evalResult.esiScore,
      entities: evalResult.entities.map(e => ({
        symptom: e.symptom,
        duration: e.duration,
        severity: e.severity,
        is_red_flag: e.isRedFlag
      })),
      clinical_rationale: evalResult.clinicalRationale,
      vernacular_guidance: evalResult.vernacularGuidance,
      english_summary: evalResult.englishSummary,
      safety_rule_triggered: evalResult.safetyRuleTriggered,
      prescriptions_blocked: evalResult.prescriptionsBlocked,
      actions_taken: evalResult.actionsTaken,
      phc_dispatch_needed: evalResult.tier <= 2,
      emergency_broadcast_active: evalResult.tier === 1,
      severity_range: evalResult.severityRange,
      hospital_guidance: evalResult.hospitalGuidance,
      what_to_do_next: evalResult.whatToDoNext,
      speech_phrase: evalResult.speechPhrase,
      nearest_hospital_recommendation: nearestHospital
    },
    offline_fallback_sms: `sms:108?body=${encodeURIComponent(
      `URGENT PATIENT ${payload.patient_id} - ${evalResult.tierTitle}. Loc: ${nearestHospital?.name || 'Emergency'}`
    )}`
  };
}

export async function fetchPatientHistory(patientId: string) {
  const res = await fetch(`${API_BASE}/vitals/history/${patientId}`);
  if (!res.ok) throw new Error('Failed to load patient history');
  return await res.json();
}

export async function fetchActiveTriageCases() {
  const res = await fetch(`${API_BASE}/triage/active-triage`);
  if (!res.ok) throw new Error('Failed to load triage cases');
  return await res.json();
}

export async function acknowledgeTriageRecord(recordId: string, notes?: string, actionType: string = 'ACKNOWLEDGE') {
  const res = await fetch(`${API_BASE}/triage/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      record_id: recordId,
      doctor_notes: notes,
      action_type: actionType
    })
  });
  return await res.json();
}

export async function fetchRegisteredHospitals() {
  const res = await fetch(`${API_BASE}/hospitals/`);
  if (!res.ok) return [];
  return await res.json();
}

/**
 * Creates live WebSocket feed for Doctor Telemetry portal
 */
export function connectTelemetryWebSocket(
  onMessage: (data: any) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let wsUrl: string;
  if (RAW_API_URL) {
    const wsBase = RAW_API_URL.replace(/^http/, 'ws').replace(/\/$/, '');
    wsUrl = `${wsBase}/ws/telemetry?district=ALL`;
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    wsUrl = `${protocol}//${host}/ws/telemetry?district=ALL`;
  }

  let ws: WebSocket | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket Telemetry] Connected to live hospital feed');
        onStatusChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch (e) {
          console.error('[WebSocket] Parsing error', e);
        }
      };

      ws.onclose = () => {
        onStatusChange?.(false);
        if (!isClosed) {
          // Auto-reconnect after 3 seconds
          setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Error:', err);
        ws?.close();
      };
    } catch (err) {
      console.warn('[WebSocket] Connection failed:', err);
      setTimeout(connect, 3000);
    }
  }

  connect();

  return () => {
    isClosed = true;
    ws?.close();
  };
}

export async function registerPatientApi(data: {
  full_name: string;
  phone_number: string;
  village_code: string;
  preferred_lang?: string;
  role?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: data.full_name,
      phone_number: data.phone_number,
      village_code: data.village_code,
      preferred_lang: data.preferred_lang || 'te-IN',
      role: data.role || 'Patient'
    })
  });
  if (!res.ok) {
    throw new Error(`Registration request failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchRegisteredUsers() {
  const res = await fetch(`${API_BASE}/auth/users`);
  if (!res.ok) return [];
  return await res.json();
}

export async function loginUserApi(phoneNumber: string, passcode?: string, location?: { lat?: number; lng?: number; locationName?: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: phoneNumber,
      passcode,
      latitude: location?.lat,
      longitude: location?.lng,
      location_name: location?.locationName
    })
  });
  if (!res.ok) {
    throw new Error(`Login failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export interface NearestHospitalItem {
  id: string;
  name: string;
  hospital_type: string;
  district_code: string;
  address: string;
  distance_km: number;
  estimated_time_mins: number;
  emergency_phone: string;
  general_phone?: string | null;
  ambulance_phone: string;
  is_open_24x7: boolean;
  opd_timings?: string | null;
  facilities: string[];
  ayushman_empaneled: boolean;
  google_maps_url: string;
  how_to_contact?: {
    emergency?: string;
    opdAppointment?: string;
    ambulanceSupport?: string;
  };
}

export interface NearestHospitalResponse {
  user_location: {
    latitude: number;
    longitude: number;
    source: string;
    location_name: string;
  };
  nearest_hospital: NearestHospitalItem | null;
  nearby_hospitals: NearestHospitalItem[];
  emergency_helplines: Record<string, string>;
}

export async function fetchNearestHospitals(params?: {
  lat?: number | null;
  lng?: number | null;
  village?: string | null;
  limit?: number;
}): Promise<NearestHospitalResponse> {
  const query = new URLSearchParams();
  if (params?.lat != null) query.append('lat', params.lat.toString());
  if (params?.lng != null) query.append('lng', params.lng.toString());
  if (params?.village) query.append('village', params.village);
  if (params?.limit) query.append('limit', params.limit.toString());

  const url = `${API_BASE}/hospitals/nearest${query.toString() ? `?${query.toString()}` : ''}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[fetchNearestHospitals] API failed, using offline calculation:', err);
  }

  // Fallback to offline master hospitals computation
  const userLat = params?.lat || 19.6641;
  const userLng = params?.lng || 78.5320;
  return computeOfflineNearestHospitals(userLat, userLng, params?.village || 'Current Location', 'gps', params?.limit || 5);
}
