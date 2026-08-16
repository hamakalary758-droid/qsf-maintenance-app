import { MaintenanceReport } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase/config';

const DRAFT_KEY = 'shutdown_maintenance_draft_v1';
const LOCAL_REPORTS_KEY = 'shutdown_maintenance_reports_local_v1';

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
    photos: [], // Photos are never stored in Supabase (client-side active session only)
    status: row.status || 'Draft',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    notes: row.notes || ''
  };
}

// Convert MaintenanceReport object to DB snake_case row
function mapReportToRow(report: Partial<MaintenanceReport>) {
  const now = new Date().toISOString();
  return {
    id: report.id,
    report_number: report.reportNumber || '',
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

// Helper for local fallback storage if Supabase is unconfigured
const getLocalReports = (): MaintenanceReport[] => {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalReports = (reports: MaintenanceReport[]): MaintenanceReport[] => {
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save to local reports:', err);
  }
  return reports;
};

export const getReportsFromStorage = async (): Promise<MaintenanceReport[]> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY missing). Falling back to local storage.');
    return getLocalReports();
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to load reports from Supabase:', error);
      throw error;
    }

    return (data || []).map(mapRowToReport);
  } catch (err) {
    console.error('Error fetching reports:', err);
    throw err;
  }
};

export const saveReportToStorage = async (report: MaintenanceReport): Promise<MaintenanceReport[]> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Saving report to local storage.');
    const current = getLocalReports();
    const cleanReport = { ...report, photos: [] };
    const filtered = current.filter(r => r.id !== report.id);
    return saveLocalReports([cleanReport, ...filtered]);
  }

  try {
    const row = mapReportToRow(report);
    const { error } = await supabase
      .from('reports')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save report to Supabase:', error);
      throw error;
    }

    return await getReportsFromStorage();
  } catch (err) {
    console.error('Error saving report:', err);
    throw err;
  }
};

export const deleteReportFromStorage = async (id: string): Promise<MaintenanceReport[]> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Deleting report from local storage.');
    const current = getLocalReports();
    const filtered = current.filter(r => r.id !== id);
    return saveLocalReports(filtered);
  }

  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete report from Supabase:', error);
      throw error;
    }

    return await getReportsFromStorage();
  } catch (err) {
    console.error('Error deleting report:', err);
    throw err;
  }
};

// Local storage draft functions (Unchanged - for active draft persistence)
export const saveDraftToStorage = (draft: Partial<MaintenanceReport>) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
};

export const getDraftFromStorage = (): Partial<MaintenanceReport> | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearDraftFromStorage = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.error('Failed to clear draft:', err);
  }
};

