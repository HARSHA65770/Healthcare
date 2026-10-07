import Dexie, { type Table } from 'dexie';

export interface PendingVitalsRecord {
  id?: number;
  local_id: string;
  patient_id: string;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  spo2?: number | null;
  glucose_mg_dl?: number | null;
  symptom_text?: string;
  language_code: string;
  district_code: string;
  timestamp: string;
  synced: boolean;
  tier_estimate?: number;
}

export class RuralHealthOfflineDatabase extends Dexie {
  pendingVitals!: Table<PendingVitalsRecord>;

  constructor() {
    super('RuralHealthOfflineDB');
    this.version(1).stores({
      pendingVitals: '++id, local_id, patient_id, timestamp, synced'
    });
  }
}

export const offlineDb = new RuralHealthOfflineDatabase();

/**
 * Saves a biometric reading offline to IndexedDB
 */
export async function saveReadingOffline(record: Omit<PendingVitalsRecord, 'id' | 'synced'>): Promise<number> {
  const id = await offlineDb.pendingVitals.add({
    ...record,
    synced: false
  });
  console.log(`[Offline Buffer] Saved reading #${id} locally into IndexedDB`);
  return id as number;
}

/**
 * Retrieves all un-synced readings
 */
export async function getPendingOfflineReadings(): Promise<PendingVitalsRecord[]> {
  return await offlineDb.pendingVitals.where('synced').equals(0).toArray();
}

/**
 * Marks reading as synced
 */
export async function markReadingSynced(id: number): Promise<void> {
  await offlineDb.pendingVitals.update(id, { synced: true });
}
