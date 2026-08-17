import Dexie, { Table } from 'dexie';
import { MaintenanceReport } from '../types';

export interface OfflineReport {
  localId: string;          // client-generated UUID, primary key
  reportNumber: string;     // '' until assigned by Supabase on first sync
  data: MaintenanceReport;  // the full report object as currently defined in types.ts
  syncStatus: 'draft' | 'pending_sync' | 'syncing' | 'synced' | 'sync_failed';
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflinePhoto {
  id: string;
  reportLocalId: string;    // FK to OfflineReport.localId
  blob: Blob;               // the actual image data, stored as a Blob
  caption: string;
  annotations?: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  reportLocalId: string;
  operation: 'create' | 'update' | 'delete';
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
}

export class QSFOfflineDatabase extends Dexie {
  reports!: Table<OfflineReport, string>;
  photos!: Table<OfflinePhoto, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('qsf_offline_db');
    this.version(1).stores({
      reports: 'localId, reportNumber, syncStatus, createdAt, updatedAt',
      photos: 'id, reportLocalId, createdAt',
      syncQueue: 'id, reportLocalId, operation, attempts, lastAttemptAt'
    });
  }
}

export const db = new QSFOfflineDatabase();
