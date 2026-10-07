import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Radio,
  FileText,
  User,
  Shield,
  TrendingUp,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { fetchActiveTriageCases, acknowledgeTriageRecord, fetchPatientHistory } from '../services/api';

interface DoctorPortalProps {
  wsAlerts: any[];
  isWsConnected: boolean;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ wsAlerts, isWsConnected }) => {
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
      console.warn('[Doctor Portal] Error loading cases', e);
    }
  };

  useEffect(() => {
    loadCases();
    const interval = setInterval(loadCases, 5000);
    return () => clearInterval(interval);
  }, []);

  // When selected case changes, fetch longitudinal history
  useEffect(() => {
    if (selectedCase?.patient_id) {
      fetchPatientHistory(selectedCase.patient_id)
        .then(res => setPatientHistory(res.history || []))
        .catch(() => setPatientHistory([]));
    }
  }, [selectedCase?.patient_id]);

  const handleAcknowledge = async (actionType: string = 'ACKNOWLEDGE') => {
    if (!selectedCase) return;
    setIsUpdating(true);
    try {
      await acknowledgeTriageRecord(selectedCase.id, doctorNotes || undefined, actionType);
      await loadCases();
      setSelectedCase((prev: any) => prev ? { ...prev, hospital_acknowledged: true, doctor_notes: doctorNotes } : null);
      setDoctorNotes('');
    } catch (err) {
      console.warn('[Doctor Action] Error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterTier === 'ALL') return true;
    if (filterTier === 'TIER1') return c.esi_score === 1;
    if (filterTier === 'TIER2') return c.esi_score === 2 || c.esi_score === 3;
    if (filterTier === 'UNACK') return !c.hospital_acknowledged;
    return true;
  });

  return (
    <div className="space-y-6">
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
              Adilabad District Headquarters Hospital &amp; Rural Trauma Unit | Direct PHC Dispatch Hub
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
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs"
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
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                filterTier === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              onClick={() => setFilterTier('TIER1')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                filterTier === 'TIER1' ? 'bg-rose-900 text-rose-100 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tier 1 (Resuscitative)
            </button>
            <button
              onClick={() => setFilterTier('UNACK')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
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

        {/* Right Column: Case Deep Dive & Dispatch Actions (7 cols) */}
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

              {/* Raw Transcript vs Clinical Entity Extraction (Section 8) */}
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
                  {selectedCase.ne_mo_filtered && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-900/50">
                      <Shield className="w-3.5 h-3.5" />
                      <span>NeMo Guardrails sanitized unapproved drug recommendations.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Longitudinal Biometric Trends (TimescaleDB Hypertable Data) */}
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

              {/* Doctor Override Notes & Action Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 block">
                  Attending Doctor Notes &amp; Clinical Override
                </label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter medical officer evaluation, medication adjustments, or ambulance dispatch comments..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAcknowledge('ACKNOWLEDGE')}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-600/30 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acknowledge Case</span>
                  </button>

                  <button
                    onClick={() => handleAcknowledge('DISPATCH_AMBULANCE')}
                    disabled={isUpdating}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/40 transition-all disabled:opacity-50"
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
  );
};
