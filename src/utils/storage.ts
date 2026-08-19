import { MaintenanceReport, PlantPhoto } from '../types';
import { db, OfflineReport, OfflinePhoto } from '../offline/db';
import { processSyncQueue, notifySyncListeners } from '../offline/syncQueue';
import { supabase, isSupabaseConfigured } from '../supabase/config';

const DRAFT_KEY = 'shutdown_maintenance_draft_v1';
const LOCAL_REPORTS_KEY = 'shutdown_maintenance_reports_local_v1';

// Generate collision-safe report ID using crypto.randomUUID()
export function generateReportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'rep-' + crypto.randomUUID();
  }
  return 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

// Track active Object URLs per report to prevent memory leaks on repeated loads
const activeObjectURLsByReport = new Map<string, string[]>();

// Helper: Convert Data URL or remote URL to Blob
export async function urlToBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const arr = url.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  try {
    const res = await fetch(url);
    return await res.blob();
  } catch {
    return new Blob([], { type: 'image/jpeg' });
  }
}

// Convert DB snake_case row to MaintenanceReport object
function mapRowToReport(row: any): MaintenanceReport {
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
    archiveReason: row.archive_reason || undefined
  };
}

// Rehydrate photos from IndexedDB for a given report
async function getPhotosForReport(reportLocalId: string): Promise<PlantPhoto[]> {
  try {
    const photos = await db.photos.where('reportLocalId').equals(reportLocalId).toArray();
    
    // Create new Object URLs
    const newPhotos = photos.map((p) => ({
      id: p.id,
      url: URL.createObjectURL(p.blob),
      caption: p.caption,
      timestamp: p.createdAt
    }));

    const newUrls = newPhotos.map((p) => p.url);

    // Revoke previous URLs for this report after new ones are created
    const oldUrls = activeObjectURLsByReport.get(reportLocalId);
    if (oldUrls) {
      oldUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    }

    activeObjectURLsByReport.set(reportLocalId, newUrls);

    return newPhotos;
  } catch (err) {
    console.warn(`Failed to rehydrate photos for ${reportLocalId}:`, err);
    return [];
  }
}

// One-time migration from localStorage into IndexedDB
async function migrateFromLocalStorageIfNeeded() {
  try {
    const count = await db.reports.count();
    if (count > 0) return;

    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) return;

    const localList: MaintenanceReport[] = JSON.parse(raw);
    for (const rep of localList) {
      await db.reports.put({
        localId: rep.id,
        reportNumber: rep.reportNumber || '',
        data: rep,
        syncStatus: 'pending_sync',
        createdAt: rep.createdAt || new Date().toISOString(),
        updatedAt: rep.updatedAt || new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Migration error from localStorage:', err);
  }
}

/**
 * Reads reports from IndexedDB as the immediate source of truth (offline-ready).
 * In the background, triggers a sync and fetches any remote additions from Supabase.
 */
export const getReportsFromStorage = async (): Promise<MaintenanceReport[]> => {
  await migrateFromLocalStorageIfNeeded();

  // 1. Read from IndexedDB immediately
  const offlineRecords = await db.reports.toArray();

  const reports: MaintenanceReport[] = await Promise.all(
    offlineRecords.map(async (record) => {
      const photos = await getPhotosForReport(record.localId);
      return {
        ...record.data,
        reportNumber: record.reportNumber || record.data.reportNumber || '',
        photos: photos.length > 0 ? photos : record.data.photos || []
      };
    })
  );

  // Sort by updatedAt descending
  reports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 2. If online and Supabase is configured, trigger background sync and fetch
  if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
    // Non-blocking background fetch & sync
    (async () => {
      try {
        await processSyncQueue(false);

        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && data) {
          for (const row of data) {
            const existing = await db.reports.get(row.id);
            // If report doesn't exist locally or is already marked synced, update local copy
            if (!existing || existing.syncStatus === 'synced') {
              const mapped = mapRowToReport(row);
              await db.reports.put({
                localId: row.id,
                reportNumber: row.report_number || '',
                data: mapped,
                syncStatus: 'synced',
                createdAt: row.created_at || new Date().toISOString(),
                updatedAt: row.updated_at || new Date().toISOString()
              });
            }
          }
          await notifySyncListeners();
        }
      } catch (err) {
        console.warn('Background Supabase refresh failed:', err);
      }
    })();
  }

  return reports;
};

/**
 * Writes report immediately to IndexedDB (and saves photo Blobs), then queues background sync.
 * Never blocks the UI waiting for network response.
 */
export const saveReportToStorage = async (report: MaintenanceReport): Promise<MaintenanceReport[]> => {
  const localId = report.id || generateReportId();
  const now = new Date().toISOString();

  const cleanReport: MaintenanceReport = {
    ...report,
    id: localId,
    updatedAt: now
  };

  // 1. Store photos in IndexedDB as Blobs
  if (report.photos && report.photos.length > 0) {
    for (const photo of report.photos) {
      if (photo.url) {
        try {
          const blob = await urlToBlob(photo.url);
          const photoId = photo.id || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? 'ph-' + crypto.randomUUID() : 'ph-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
          await db.photos.put({
            id: photoId,
            reportLocalId: localId,
            blob,
            caption: photo.caption || '',
            createdAt: photo.timestamp || now
          });
        } catch (err) {
          console.warn('Failed to store photo blob in IndexedDB:', err);
        }
      }
    }
  }

  // 2. Save report record in IndexedDB
  const offlineRecord: OfflineReport = {
    localId,
    reportNumber: cleanReport.reportNumber || '',
    data: cleanReport,
    syncStatus: 'pending_sync',
    createdAt: cleanReport.createdAt || now,
    updatedAt: now
  };

  await db.reports.put(offlineRecord);

  // 3. Add to sync queue for background processing
  await db.syncQueue.put({
    id: 'sq-' + localId,
    reportLocalId: localId,
    operation: 'create',
    attempts: 0,
    lastAttemptAt: undefined,
    lastError: undefined
  });

  await notifySyncListeners();

  // 4. Trigger background sync immediately without awaiting
  setTimeout(() => {
    processSyncQueue(true);
  }, 100);

  // 5. Return updated list from local IndexedDB
  return await getReportsFromStorage();
};

/**
 * Soft-deletes (archives) a report in IndexedDB and queues an update sync for Supabase.
 * Preserves all report data and local photo blobs intact.
 */
export const archiveReportInStorage = async (id: string, archivedBy: string = 'Current User', reason?: string): Promise<MaintenanceReport[]> => {
  const now = new Date().toISOString();
  const existing = await db.reports.get(id);

  if (existing) {
    const updatedData: MaintenanceReport = {
      ...existing.data,
      isArchived: true,
      archivedAt: now,
      archivedBy: archivedBy,
      archiveReason: reason || '',
      updatedAt: now
    };

    await db.reports.put({
      ...existing,
      data: updatedData,
      syncStatus: 'pending_sync',
      updatedAt: now
    });

    // Queue update in syncQueue
    await db.syncQueue.put({
      id: 'sq-arch-' + id,
      reportLocalId: id,
      operation: 'update',
      attempts: 0,
      lastAttemptAt: undefined,
      lastError: undefined
    });

    await notifySyncListeners();

    setTimeout(() => {
      processSyncQueue(true);
    }, 100);
  }

  return await getReportsFromStorage();
};

/**
 * Restores an archived report back to active status.
 */
export const unarchiveReportInStorage = async (id: string): Promise<MaintenanceReport[]> => {
  const now = new Date().toISOString();
  const existing = await db.reports.get(id);

  if (existing) {
    const updatedData: MaintenanceReport = {
      ...existing.data,
      isArchived: false,
      archivedAt: undefined,
      archivedBy: undefined,
      archiveReason: undefined,
      updatedAt: now
    };

    await db.reports.put({
      ...existing,
      data: updatedData,
      syncStatus: 'pending_sync',
      updatedAt: now
    });

    await db.syncQueue.put({
      id: 'sq-unarch-' + id,
      reportLocalId: id,
      operation: 'update',
      attempts: 0,
      lastAttemptAt: undefined,
      lastError: undefined
    });

    await notifySyncListeners();

    setTimeout(() => {
      processSyncQueue(true);
    }, 100);
  }

  return await getReportsFromStorage();
};

/**
 * Permanently deletes a report locally from IndexedDB and all associated photo blobs,
 * marking it for permanent deletion on Supabase. (Unwired from primary UI as per ADR).
 */
export const permanentlyDeleteReportFromStorage = async (id: string): Promise<MaintenanceReport[]> => {
  // Revoke any active Object URLs for this report
  const oldUrls = activeObjectURLsByReport.get(id);
  if (oldUrls) {
    oldUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    activeObjectURLsByReport.delete(id);
  }

  // 1. Delete locally from IndexedDB
  await db.reports.delete(id);
  await db.photos.where('reportLocalId').equals(id).delete();

  // 2. Queue deletion in sync queue
  await db.syncQueue.put({
    id: 'sq-del-' + id,
    reportLocalId: id,
    operation: 'delete',
    attempts: 0,
    lastAttemptAt: undefined,
    lastError: undefined
  });

  await notifySyncListeners();

  // 3. Trigger background sync
  setTimeout(() => {
    processSyncQueue(true);
  }, 100);

  // 4. Return updated local list
  return await getReportsFromStorage();
};

/**
 * Backward-compatible delete wrapper (now performs soft-delete archiving).
 */
export const deleteReportFromStorage = async (id: string): Promise<MaintenanceReport[]> => {
  return await archiveReportInStorage(id);
};

// Draft storage functions for active in-progress form wizard
export const saveDraftToStorage = async (draft: Partial<MaintenanceReport>): Promise<void> => {
  try {
    // Strip photos from localStorage serialization to prevent quota exhaustion
    const { photos, ...textDraft } = draft;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(textDraft));
  } catch (err: any) {
    console.warn('Failed to save draft to localStorage (quota may be full):', err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('draft_storage_warning', {
          detail: {
            message: 'Draft auto-save warning: Browser cache quota exceeded. Text is preserved in memory, but large attached photos cannot be cached in temporary draft storage.'
          }
        })
      );
    }
  }
};

/**
 * Persists draft inspection photos into IndexedDB as Blobs.
 * Keyed by the draft report's unique local ID.
 */
export const saveDraftPhotosToStorage = async (draftId: string, photos: PlantPhoto[]): Promise<void> => {
  if (!draftId) return;
  try {
    const existingPhotos = await db.photos.where('reportLocalId').equals(draftId).toArray();
    const currentPhotoIds = new Set(photos.map((p) => p.id));

    // Delete photos removed in this draft version
    for (const stored of existingPhotos) {
      if (!currentPhotoIds.has(stored.id)) {
        await db.photos.delete(stored.id);
      }
    }

    // Save/update Blobs in IndexedDB
    for (const photo of photos) {
      if (photo.url) {
        try {
          const blob = await urlToBlob(photo.url);
          const photoId = photo.id || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? 'ph-' + crypto.randomUUID() : 'ph-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
          await db.photos.put({
            id: photoId,
            reportLocalId: draftId,
            blob,
            caption: photo.caption || '',
            createdAt: photo.timestamp || new Date().toISOString()
          });
        } catch (err) {
          console.warn('Failed to save draft photo blob:', err);
        }
      }
    }
  } catch (err) {
    console.warn('saveDraftPhotosToStorage error:', err);
  }
};

export const getDraftFromStorage = async (): Promise<Partial<MaintenanceReport> | null> => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: Partial<MaintenanceReport> = JSON.parse(raw);
    
    // Rehydrate photos from IndexedDB if draft has an ID
    if (draft && draft.id) {
      const photos = await getPhotosForReport(draft.id);
      draft.photos = photos;
    }
    return draft;
  } catch (err) {
    console.warn('getDraftFromStorage error:', err);
    return null;
  }
};

export const clearDraftTextOnly = async (): Promise<void> => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.warn('clearDraftTextOnly error:', err);
  }
};

export const clearDraftFromStorage = async (draftId?: string): Promise<void> => {
  try {
    let targetId = draftId;
    if (!targetId) {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          targetId = parsed.id;
        } catch {
          // ignore
        }
      }
    }

    localStorage.removeItem(DRAFT_KEY);

    if (targetId) {
      // Clean up object URLs
      const oldUrls = activeObjectURLsByReport.get(targetId);
      if (oldUrls) {
        oldUrls.forEach((url) => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        });
        activeObjectURLsByReport.delete(targetId);
      }

      await db.photos.where('reportLocalId').equals(targetId).delete();
    }
  } catch (err) {
    console.warn('clearDraftFromStorage error:', err);
  }
};
