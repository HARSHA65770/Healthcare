import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { getPendingOfflineReadings, markReadingSynced, PendingVitalsRecord } from '../db/indexedDb';
import { ingestVitals } from '../services/api';

interface OfflineSyncBadgeProps {
  isOnline: boolean;
  onSyncCompleted?: () => void;
}

export const OfflineSyncBadge: React.FC<OfflineSyncBadgeProps> = ({ isOnline, onSyncCompleted }) => {
  const [pendingItems, setPendingItems] = useState<PendingVitalsRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const loadPending = async () => {
    try {
      const items = await getPendingOfflineReadings();
      setPendingItems(items);
    } catch (e) {
      console.warn('[Offline DB] Error reading items:', e);
    }
  };

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 3000);
    return () => clearInterval(interval);
  }, []);

  // Automatic sync when network recovers
  useEffect(() => {
    if (isOnline && pendingItems.length > 0 && !isSyncing) {
      triggerBatchSync();
    }
  }, [isOnline, pendingItems.length]);

  const triggerBatchSync = async () => {
    if (pendingItems.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setSyncSuccessMessage(null);

    let successCount = 0;
    for (const item of pendingItems) {
      try {
        await ingestVitals({
          patient_id: item.patient_id,
          systolic_bp: item.systolic_bp || undefined,
          diastolic_bp: item.diastolic_bp || undefined,
          spo2: item.spo2 || undefined,
          glucose_mg_dl: item.glucose_mg_dl || undefined,
          symptom_text: item.symptom_text,
          language_code: item.language_code,
          district_code: item.district_code
        });
        if (item.id) {
          await markReadingSynced(item.id);
          successCount++;
        }
      } catch (err) {
        console.warn(`[Sync Recovery] Failed to sync item ${item.local_id}:`, err);
      }
    }

    await loadPending();
    setIsSyncing(false);
    if (successCount > 0) {
      setSyncSuccessMessage(`Auto-synced ${successCount} queued records to hospital core.`);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
      onSyncCompleted?.();
    }
  };

  if (pendingItems.length === 0 && !syncSuccessMessage) {
    return null;
  }

  // Check if any pending item had critical vitals (Tier 1 threshold)
  const hasCriticalOffline = pendingItems.some(
    p => (p.systolic_bp && p.systolic_bp >= 180) || (p.spo2 && p.spo2 < 90) || (p.glucose_mg_dl && p.glucose_mg_dl > 350)
  );

  return (
    <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-3 shadow-lg backdrop-blur-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
          <Database className="w-4 h-4 text-amber-400" />
          <span>
            {pendingItems.length > 0
              ? `${pendingItems.length} Reading(s) Buffered in Local IndexedDB`
              : 'IndexedDB Sync Queue Ready'}
          </span>
        </div>

        {isOnline && pendingItems.length > 0 && (
          <button
            onClick={triggerBatchSync}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>

      {syncSuccessMessage && (
        <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{syncSuccessMessage}</span>
        </div>
      )}

      {/* Section 10 Risk Mitigation: If emergency reading occurs while offline, offer 1-tap SMS URI */}
      {hasCriticalOffline && (
        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Offline Critical Bound Alert:</strong> Network disconnected, but vital readings exceed safety threshold.
            </span>
          </div>
          <a
            href="sms:108?body=EMERGENCY%20CRITICAL%20VITALS%20DETECTED%20ON%20RURAL%20HEALTH%20PWA.%20BP%20CRITICAL.%20PLEASE%20DISPATCH%20AMBULANCE."
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all text-xs shrink-0 shadow-lg shadow-rose-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>One-Tap SMS to 108</span>
          </a>
        </div>
      )}
    </div>
  );
};
