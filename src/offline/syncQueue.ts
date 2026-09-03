import { db, OfflineReport, SyncQueueItem, ConflictRecord } from './db';
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { MaintenanceReport } from '../types';
import { notifyReportsChanged } from '../utils/reportsBus';

export type SyncStatusState = 'offline' | 'online' | 'pending_sync' | 'syncing' | 'sync_failed' | 'conflict';

export interface SyncStatusInfo {
  state: SyncStatusState;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  failedReports: { localId: string; title: string; error?: string }[];
  conflictedReports: { localId: string; title: string; detectedAt: string }[];
  isOnline: boolean;
}

type SyncListener = (status: SyncStatusInfo) => void;
const listeners = new Set<SyncListener>();

let isCurrentlySyncing = false;

// Convert DB snake_case row to MaintenanceReport object
export function mapRowToReport(row: any): MaintenanceReport {
  return {
    id: row.id,
    reportNumber: row.report_number || '',
    title: row.title || '',
    technicianName: row.technician_name || '',
    technicianId: row.technician_id || '',
    date: row.date || '',
    shutdownName: row.shutdown_name || '',
    equipmentName: row.equipment_name || '',
    equipmentCode: row.equipment_code || '',
    location: row.location || '',
    failureType: row.failure_type || 'Mechanical Failure',
    fiveWOneH: row.five_w_one_h || { what: '', when: '', where: '', who: '', which: '', how: '' },
    fiveWhy: row.five_why || { why1: '', why2: '', why3: '', why4: '', why5: '' },
    correctiveActions: Array.isArray(row.corrective_actions) ? row.corrective_actions : [],
    spareParts: Array.isArray(row.spare_parts) ? row.spare_parts : [],
    photos: [],
    status: row.status || 'Draft',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    notes: row.notes || '',
    isArchived: Boolean(row.is_archived),
    archivedAt: row.archived_at || undefined,
    archivedBy: row.archived_by || undefined,
    archiveReason: row.archive_reason || undefined,
    version: row.version || 1
  };
}

// Convert MaintenanceReport object to DB snake_case row for Supabase
export function mapReportToRow(report: Partial<MaintenanceReport>) {
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
    updated_at: now,
    is_archived: report.isArchived ?? false,
    archived_at: report.archivedAt || null,
    archived_by: report.archivedBy || null,
    archive_reason: report.archiveReason || null,
    version: report.version || 1
  };
}

export async function getSyncStatusInfo(): Promise<SyncStatusInfo> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const conflictRecords = await db.conflicts.toArray();
  const conflictedReports = conflictRecords.map((c) => ({
    localId: c.localId,
    title: c.localData?.title || c.localData?.equipmentName || 'Report',
    detectedAt: c.detectedAt
  }));
  const conflictCount = conflictedReports.length;

  const failed = await db.reports.where('syncStatus').equals('sync_failed').toArray();
  const pendingCount = await db.reports.where('syncStatus').equals('pending_sync').count();
  const queueDeleteCount = await db.syncQueue.where('operation').equals('delete').count();

  const failedReports = failed.map((r) => ({
    localId: r.localId,
    title: r.data?.title || r.data?.equipmentName || 'Report',
    error: r.lastSyncError
  }));

  if (conflictCount > 0) {
    return {
      state: 'conflict',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: failedReports.length,
      conflictCount,
      failedReports,
      conflictedReports,
      isOnline
    };
  }

  if (!isOnline) {
    return {
      state: 'offline',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: failedReports.length,
      conflictCount: 0,
      failedReports,
      conflictedReports: [],
      isOnline: false
    };
  }

  if (isCurrentlySyncing) {
    return {
      state: 'syncing',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: failedReports.length,
      conflictCount: 0,
      failedReports,
      conflictedReports: [],
      isOnline: true
    };
  }

  if (failedReports.length > 0) {
    return {
      state: 'sync_failed',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: failedReports.length,
      conflictCount: 0,
      failedReports,
      conflictedReports: [],
      isOnline: true
    };
  }

  if (pendingCount > 0 || queueDeleteCount > 0) {
    return {
      state: 'pending_sync',
      pendingCount: pendingCount + queueDeleteCount,
      failedCount: 0,
      conflictCount: 0,
      failedReports,
      conflictedReports: [],
      isOnline: true
    };
  }

  return {
    state: 'online',
    pendingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    failedReports,
    conflictedReports: [],
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
        // Silently ignore — non-critical
      }
    });
  } catch (err) {
    // Silently ignore — non-critical
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
        await db.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
          lastError: err?.message || 'Delete sync failed'
        });
      }
    }

    // 2. Process pending & failed reports (exclude reports flagged as 'conflict')
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
        // Check if report already exists on Supabase server to choose Path A vs Path B
        const hasLastSyncedVersion = offlineRep.lastSyncedVersion !== undefined && offlineRep.lastSyncedVersion !== null;
        let isExistingOnServer = hasLastSyncedVersion;

        if (!isExistingOnServer) {
          const { data: serverLookup, error: lookupErr } = await supabase
            .from('reports')
            .select('id, version')
            .eq('id', offlineRep.localId)
            .maybeSingle();

          if (lookupErr) {
            throw lookupErr;
          }
          if (serverLookup) {
            isExistingOnServer = true;
          }
        }

        if (!isExistingOnServer) {
          // PATH A: Brand new report (first time syncing this id)
          const row = mapReportToRow({ ...offlineRep.data, version: 1 });
          const { data, error } = await supabase
            .from('reports')
            .upsert(row, { onConflict: 'id' })
            .select()
            .single();

          if (error) {
            throw error;
          }

          const assignedNumber = data?.report_number || offlineRep.data.reportNumber || '';
          const finalVersion = data?.version || 1;

          await db.reports.update(offlineRep.localId, {
            syncStatus: 'synced',
            reportNumber: assignedNumber,
            lastSyncedVersion: finalVersion,
            lastSyncError: undefined,
            updatedAt: new Date().toISOString(),
            data: {
              ...offlineRep.data,
              reportNumber: assignedNumber,
              version: finalVersion
            }
          });

          if (queueItem) {
            await db.syncQueue.delete(queueItem.id);
          }

          notifyReportsChanged();
        } else {
          // PATH B: Existing report being updated with version check
          const baseVersion = offlineRep.lastSyncedVersion || 1;
          const nextVersion = baseVersion + 1;
          const row = mapReportToRow({ ...offlineRep.data, version: nextVersion });

          const { data, error } = await supabase
            .from('reports')
            .update({ ...row, version: nextVersion })
            .eq('id', row.id)
            .eq('version', baseVersion) // only update if server version matches what we last saw
            .select();

          if (error) {
            throw error;
          }

          if (!data || data.length === 0) {
            // 0 rows updated -> Server version no longer matches baseVersion. Conflict!
            const { data: serverRow, error: fetchErr } = await supabase
              .from('reports')
              .select('*')
              .eq('id', row.id)
              .single();

            if (fetchErr || !serverRow) {
              throw new Error(fetchErr?.message || 'Conflict detected, but failed to fetch server version');
            }

            const serverReport = mapRowToReport(serverRow);

            await db.conflicts.put({
              localId: offlineRep.localId,
              serverData: serverReport,
              localData: offlineRep.data,
              detectedAt: new Date().toISOString()
            });

            await db.reports.update(offlineRep.localId, {
              syncStatus: 'conflict',
              lastSyncError: undefined
            });

            // Do not retry this report automatically — remove from queue until user decides
            if (queueItem) {
              await db.syncQueue.delete(queueItem.id);
            }
          } else {
            // Sync succeeded normally!
            const updatedRow = data[0];
            const assignedNumber = updatedRow?.report_number || offlineRep.data.reportNumber || '';
            const finalVersion = updatedRow?.version || nextVersion;

            await db.reports.update(offlineRep.localId, {
              syncStatus: 'synced',
              reportNumber: assignedNumber,
              lastSyncedVersion: finalVersion,
              lastSyncError: undefined,
              updatedAt: new Date().toISOString(),
              data: {
                ...offlineRep.data,
                reportNumber: assignedNumber,
                version: finalVersion
              }
            });

            // Clean up any stale conflict record
            await db.conflicts.delete(offlineRep.localId);

            if (queueItem) {
              await db.syncQueue.delete(queueItem.id);
            }

            notifyReportsChanged();
          }
        }
      } catch (err: any) {
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
    // Silently ignore — non-critical
  } finally {
    isCurrentlySyncing = false;
    await notifySyncListeners();
  }
}

// Conflict Resolution Actions
export async function getConflicts(): Promise<ConflictRecord[]> {
  return await db.conflicts.toArray();
}

export async function resolveConflictKeepMine(localId: string): Promise<void> {
  const conflict = await db.conflicts.get(localId);
  const offlineRep = await db.reports.get(localId);
  if (!offlineRep) return;

  // Use the server's current version number as base so our next push cleanly updates it
  let serverVersion = conflict?.serverData?.version || 1;
  if (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const { data } = await supabase.from('reports').select('version').eq('id', localId).single();
      if (data?.version) {
        serverVersion = data.version;
      }
    } catch {
      // fallback to conflict.serverData.version
    }
  }

  const newVersion = serverVersion + 1;
  const updatedData: MaintenanceReport = {
    ...offlineRep.data,
    version: newVersion,
    updatedAt: new Date().toISOString()
  };

  await db.reports.update(localId, {
    data: updatedData,
    syncStatus: 'pending_sync',
    lastSyncedVersion: serverVersion,
    lastSyncError: undefined,
    updatedAt: new Date().toISOString()
  });

  await db.conflicts.delete(localId);

  await db.syncQueue.put({
    id: 'sq-' + localId,
    reportLocalId: localId,
    operation: 'update',
    attempts: 0,
    lastAttemptAt: undefined,
    lastError: undefined
  });

  await notifySyncListeners();
  processSyncQueue(true);
}

export async function resolveConflictKeepServer(localId: string): Promise<void> {
  const conflict = await db.conflicts.get(localId);
  if (!conflict) return;

  let serverReport = conflict.serverData;
  if (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const { data } = await supabase.from('reports').select('*').eq('id', localId).single();
      if (data) {
        serverReport = mapRowToReport(data);
      }
    } catch {
      // fallback to conflict.serverData
    }
  }

  await db.reports.update(localId, {
    data: serverReport,
    reportNumber: serverReport.reportNumber || '',
    syncStatus: 'synced',
    lastSyncedVersion: serverReport.version || 1,
    lastSyncError: undefined,
    updatedAt: serverReport.updatedAt || new Date().toISOString()
  });

  await db.conflicts.delete(localId);
  await notifySyncListeners();
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
