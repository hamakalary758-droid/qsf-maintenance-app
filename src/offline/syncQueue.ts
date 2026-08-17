import { db, OfflineReport, SyncQueueItem } from './db';
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { MaintenanceReport } from '../types';

export type SyncStatusState = 'offline' | 'online' | 'pending_sync' | 'syncing' | 'sync_failed';

export interface SyncStatusInfo {
  state: SyncStatusState;
  pendingCount: number;
  failedCount: number;
  failedReports: { localId: string; title: string; error?: string }[];
  isOnline: boolean;
}

type SyncListener = (status: SyncStatusInfo) => void;
const listeners = new Set<SyncListener>();

let isCurrentlySyncing = false;

// Convert MaintenanceReport object to DB snake_case row for Supabase
function mapReportToRow(report: Partial<MaintenanceReport>) {
  const now = new Date().toISOString();
  return {
    id: report.id,
    report_number: report.reportNumber ? report.reportNumber : null,
    title: report.title || '',
    technician_name: report.technicianName || '',
    technician_id: report.technicianId || '',
    date: report.date || '',
    shutdown_name: report.shutdownName || '',
    equipment_name: report.equipmentName || '',
    equipment_code: report.equipmentCode || '',
    location: report.location || '',
    failure_type: report.failureType || 'Mechanical Failure',
    five_w_one_h: report.fiveWOneH || { what: '', when: '', where: '', who: '', which: '', how: '' },
    five_why: report.fiveWhy || { why1: '', why2: '', why3: '', why4: '', why5: '' },
    corrective_actions: report.correctiveActions || [],
    spare_parts: report.spareParts || [],
    status: report.status || 'Draft',
    notes: report.notes || '',
    created_at: report.createdAt || now,
    updated_at: now
  };
}

export async function getSyncStatusInfo(): Promise<SyncStatusInfo> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    const pending = await db.reports.where('syncStatus').equals('pending_sync').count();
    const failed = await db.reports.where('syncStatus').equals('sync_failed').toArray();
    return {
      state: 'offline',
      pendingCount: pending,
      failedCount: failed.length,
      failedReports: failed.map((r) => ({
        localId: r.localId,
        title: r.data?.title || r.data?.equipmentName || 'Report',
        error: r.lastSyncError
      })),
      isOnline: false
    };
  }

  if (isCurrentlySyncing) {
    const pending = await db.reports.where('syncStatus').equals('pending_sync').count();
    const failed = await db.reports.where('syncStatus').equals('sync_failed').toArray();
    return {
      state: 'syncing',
      pendingCount: pending,
      failedCount: failed.length,
      failedReports: failed.map((r) => ({
        localId: r.localId,
        title: r.data?.title || r.data?.equipmentName || 'Report',
        error: r.lastSyncError
      })),
      isOnline: true
    };
  }

  const failedReports = await db.reports.where('syncStatus').equals('sync_failed').toArray();
  const pendingCount = await db.reports.where('syncStatus').equals('pending_sync').count();
  const queueDeleteCount = await db.syncQueue.where('operation').equals('delete').count();

  if (failedReports.length > 0) {
    return {
      state: 'sync_failed',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: failedReports.length,
      failedReports: failedReports.map((r) => ({
        localId: r.localId,
        title: r.data?.title || r.data?.equipmentName || 'Report',
        error: r.lastSyncError
      })),
      isOnline: true
    };
  }

  if (pendingCount > 0 || queueDeleteCount > 0) {
    return {
      state: 'pending_sync',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: 0,
      failedReports: [],
      isOnline: true
    };
  }

  return {
    state: 'online',
    pendingCount: 0,
    failedCount: 0,
    failedReports: [],
    isOnline: true
  };
}

export async function notifySyncListeners() {
  try {
    const status = await getSyncStatusInfo();
    listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  } catch (err) {
    console.error('Failed to get sync status info:', err);
  }
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  // Initial fire
  getSyncStatusInfo().then((status) => listener(status));
  return () => {
    listeners.delete(listener);
  };
}

export async function processSyncQueue(force = false): Promise<void> {
  if (isCurrentlySyncing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await notifySyncListeners();
    return;
  }
  if (!isSupabaseConfigured) {
    await notifySyncListeners();
    return;
  }

  isCurrentlySyncing = true;
  await notifySyncListeners();

  try {
    const now = Date.now();
    const minBackoffMs = 30000; // 30s backoff for retried failures

    // 1. Process delete operations from syncQueue
    const deleteQueue = await db.syncQueue.where('operation').equals('delete').toArray();
    for (const item of deleteQueue) {
      const lastAttempt = item.lastAttemptAt ? new Date(item.lastAttemptAt).getTime() : 0;
      if (!force && item.attempts > 0 && now - lastAttempt < minBackoffMs) {
        continue;
      }

      try {
        const { error } = await supabase.from('reports').delete().eq('id', item.reportLocalId);
        if (error) {
          throw error;
        }
        await db.syncQueue.delete(item.id);
      } catch (err: any) {
        console.warn(`Failed to sync delete for report ${item.reportLocalId}:`, err);
        await db.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
          lastError: err?.message || 'Delete sync failed'
        });
      }
    }

    // 2. Process pending & failed reports
    const pendingReports = await db.reports
      .where('syncStatus')
      .anyOf('pending_sync', 'sync_failed')
      .toArray();

    for (const offlineRep of pendingReports) {
      // Find or create queue item for backoff tracking
      let queueItem = await db.syncQueue
        .where('reportLocalId')
        .equals(offlineRep.localId)
        .first();

      const lastAttempt = queueItem?.lastAttemptAt ? new Date(queueItem.lastAttemptAt).getTime() : 0;
      if (!force && queueItem && queueItem.attempts > 0 && now - lastAttempt < minBackoffMs) {
        continue;
      }

      await db.reports.update(offlineRep.localId, { syncStatus: 'syncing' });
      await notifySyncListeners();

      try {
        const row = mapReportToRow(offlineRep.data);
        const { data, error } = await supabase
          .from('reports')
          .upsert(row, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const assignedNumber = data?.report_number || offlineRep.data.reportNumber || '';

        // Success - update offline report record
        await db.reports.update(offlineRep.localId, {
          syncStatus: 'synced',
          reportNumber: assignedNumber,
          lastSyncError: undefined,
          updatedAt: new Date().toISOString(),
          data: {
            ...offlineRep.data,
            reportNumber: assignedNumber
          }
        });

        // Clear from sync queue if item was present
        if (queueItem) {
          await db.syncQueue.delete(queueItem.id);
        }
      } catch (err: any) {
        console.warn(`Failed to sync report ${offlineRep.localId}:`, err);
        const errorMsg = err?.message || 'Network error during sync';

        await db.reports.update(offlineRep.localId, {
          syncStatus: 'sync_failed',
          lastSyncError: errorMsg
        });

        if (queueItem) {
          await db.syncQueue.update(queueItem.id, {
            attempts: queueItem.attempts + 1,
            lastAttemptAt: new Date().toISOString(),
            lastError: errorMsg
          });
        } else {
          await db.syncQueue.add({
            id: 'sq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            reportLocalId: offlineRep.localId,
            operation: 'create',
            attempts: 1,
            lastAttemptAt: new Date().toISOString(),
            lastError: errorMsg
          });
        }
      }
    }
  } catch (err) {
    console.error('Error processing sync queue:', err);
  } finally {
    isCurrentlySyncing = false;
    await notifySyncListeners();
  }
}

// Initialize sync service background watchers
let isInitialized = false;

export function initSyncService() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  window.addEventListener('online', () => {
    processSyncQueue(true);
  });

  window.addEventListener('offline', () => {
    notifySyncListeners();
  });

  // Safety net interval every 60 seconds while online
  setInterval(() => {
    if (navigator.onLine) {
      processSyncQueue(false);
    }
  }, 60000);

  // Initial queue process on startup
  setTimeout(() => {
    processSyncQueue(false);
  }, 2000);
}
