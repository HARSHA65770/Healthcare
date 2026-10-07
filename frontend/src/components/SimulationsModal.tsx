import React from 'react';
import { X, Sparkles, AlertOctagon, AlertTriangle, ShieldCheck, WifiOff, Stethoscope, HeartHandshake } from 'lucide-react';

interface ScenarioPreset {
  id: string;
  tier: number;
  title: string;
  vitals: {
    systolic: number;
    diastolic: number;
    spo2: number;
    glucose: number;
  };
  symptoms: string;
  expectedBehavior: string;
  color: string;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'tier1_crisis',
    tier: 1,
    title: 'Tier 1: Resuscitative Crisis (Hypertensive & Hypoxemia)',
    vitals: { systolic: 195, diastolic: 125, spo2: 88, glucose: 380 },
    symptoms: 'Acute crushing chest pain radiating to left arm and severe breathlessness',
    expectedBehavior: 'Bypasses queue, triggers instant WebSocket siren on Doctor portal, initiates IVR/SMS emergency dispatch, displays 108 direct dialer.',
    color: 'border-rose-800 bg-rose-950/40 text-rose-200'
  },
  {
    id: 'tier2_tb',
    tier: 2,
    title: 'Tier 2: High Risk Sub-Acute (Tuberculosis & Pyrexia)',
    vitals: { systolic: 152, diastolic: 96, spo2: 92, glucose: 135 },
    symptoms: 'Chronic cough > 2 weeks with hemoptysis and persistent high fever > 3 days',
    expectedBehavior: 'Reserves priority consultation token at nearest PHC, triggers ASHA field worker alert, logs encounter in TimescaleDB.',
    color: 'border-amber-800 bg-amber-950/40 text-amber-200'
  },
  {
    id: 'tier3_drift',
    tier: 3,
    title: 'Tier 3: Moderate Risk / Routine Monitoring',
    vitals: { systolic: 134, diastolic: 86, spo2: 97, glucose: 165 },
    symptoms: 'Mild joint stiffness, fatigue, and seasonal weather cold',
    expectedBehavior: 'Schedules 48-hr re-screening checkup, generates vernacular dietary/hydration recommendations via Web Audio.',
    color: 'border-yellow-800 bg-yellow-950/40 text-yellow-200'
  },
  {
    id: 'tier4_baseline',
    tier: 4,
    title: 'Tier 4: Preventive Baseline (Healthy Rural Citizen)',
    vitals: { systolic: 116, diastolic: 76, spo2: 99, glucose: 95 },
    symptoms: 'Zero red-flag complaints. Periodic preventive screening checkup.',
    expectedBehavior: 'Confirms normal status, stores baseline entry in longitudinal TimescaleDB record, sets 30-day re-check reminder.',
    color: 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
  },
  {
    id: 'nemo_guardrail',
    tier: 2,
    title: 'Section 8: NeMo Guardrails Anti-Hallucination Test',
    vitals: { systolic: 145, diastolic: 92, spo2: 95, glucose: 120 },
    symptoms: 'Take paracetamol 650mg twice daily and amoxicillin 500mg for 5 days.',
    expectedBehavior: 'Deterministic regex blacklist strips unapproved prescription drugs and dosage advice, enforcing licensed doctor referral.',
    color: 'border-purple-800 bg-purple-950/40 text-purple-200'
  }
];

interface SimulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: ScenarioPreset) => void;
  onSimulateOfflineDrop: () => void;
}

export const SimulationsModal: React.FC<SimulationsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onSimulateOfflineDrop
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Specification Architecture Scenario Presets
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-400">
            Click any scenario below to immediately load physiological metrics and trigger the corresponding
            execution pathway from the engineering specification:
          </p>

          <div className="space-y-2.5">
            {PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all ${preset.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {preset.tier === 1 ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : preset.tier === 2 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm">{preset.title}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded">
                    BP {preset.vitals.systolic}/{preset.vitals.diastolic} | SpO2 {preset.vitals.spo2}%
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-300">
                  <strong>Input:</strong> {preset.symptoms}
                </p>

                <p className="mt-1 text-[11px] text-slate-400 font-mono">
                  &rarr; <strong>Outcome:</strong> {preset.expectedBehavior}
                </p>
              </div>
            ))}
          </div>

          {/* Offline Resiliency Simulation */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Section 10: Toggle Network Offline Simulator</h4>
                  <p className="text-[11px] text-slate-400">
                    Simulates 2G/3G disconnect. Readings are buffered in IndexedDB with one-tap SMS emergency fallback.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSimulateOfflineDrop();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow"
              >
                Toggle Offline Mode
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
