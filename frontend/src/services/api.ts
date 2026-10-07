// API Client and WebSocket Telemetry Connection

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
  };
  offline_fallback_sms: string;
}

const RAW_API_URL = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

export async function ingestVitals(payload: VitalsIngestionPayload): Promise<IngestionResult> {
  const response = await fetch(`${API_BASE}/triage/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  return await response.json();
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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load nearest hospital: HTTP ${res.status}`);
  }
  return await res.json();
}

