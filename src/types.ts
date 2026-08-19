import { FAILURE_TYPES } from './constants/failureTypes';

export type FailureType = (typeof FAILURE_TYPES)[number];

export interface FiveWOneH {
  what: string;   // What happened?
  when: string;   // When did it happen?
  where: string;  // Where in the plant/equipment?
  who: string;    // Who discovered / who was working?
  which: string;  // Which mode/component/operating state?
  how: string;    // How was it detected / severity?
}

export interface FiveWhy {
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string; // Root Cause
  why1Skipped?: boolean;
  why2Skipped?: boolean;
  why3Skipped?: boolean;
  why4Skipped?: boolean;
  notApplicable?: boolean;
  notApplicableReason?: string;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  targetDate: string;
}

export interface SparePart {
  id: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  status: 'In Stock' | 'Ordered' | 'Urgent Request' | 'Replaced';
}

export interface PlantPhoto {
  id: string;
  url: string; // Base64 data URL or blob URL
  caption: string;
  timestamp: string;
  annotations?: string; // JSON string of markup/highlight details
}

export interface MaintenanceReport {
  id: string;
  reportNumber: string;
  title: string;
  technicianName: string;
  technicianId?: string;
  date: string;
  shutdownName: string; // e.g. "Q3 2026 Annual Refinery Shutdown"
  equipmentName: string;
  equipmentCode: string;
  location: string;
  failureType: FailureType;
  fiveWOneH: FiveWOneH;
  fiveWhy: FiveWhy;
  correctiveActions: CorrectiveAction[];
  spareParts: SparePart[];
  photos: PlantPhoto[];
  status: 'Draft' | 'Reviewed' | 'Finalized' | 'Exported';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}

export type AppTab = 'new-report' | 'history' | 'dashboard' | 'mockups' | 'setup-guide' | 'phase-checklist';
