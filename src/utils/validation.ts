import { MaintenanceReport } from '../types';

export interface ValidationError {
  field: string;
  stepIndex: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a MaintenanceReport before finalization.
 * Step indices:
 * 0: Basic Info
 * 1: 5W+1H Breakdown
 * 2: 5-Why Analysis
 * 3: Actions & Parts
 * 4: Photos & Markup
 * 5: Review & Finalize
 */
export function validateReportForFinalization(report: Partial<MaintenanceReport>): ValidationResult {
  const errors: ValidationError[] = [];

  // Step 0 (Basic Info) Required Fields
  if (!report.technicianName || !report.technicianName.trim()) {
    errors.push({
      field: 'technicianName',
      stepIndex: 0,
      message: 'Technician Name is required'
    });
  }

  if (!report.date || !report.date.trim()) {
    errors.push({
      field: 'date',
      stepIndex: 0,
      message: 'Report Date is required'
    });
  }

  if (!report.equipmentName || !report.equipmentName.trim()) {
    errors.push({
      field: 'equipmentName',
      stepIndex: 0,
      message: 'Equipment Name is required'
    });
  }

  if (!report.equipmentCode || !report.equipmentCode.trim()) {
    errors.push({
      field: 'equipmentCode',
      stepIndex: 0,
      message: 'Equipment Tag / Code is required'
    });
  }

  if (!report.location || !report.location.trim()) {
    errors.push({
      field: 'location',
      stepIndex: 0,
      message: 'Plant Location / Area is required'
    });
  }

  if (!report.failureType || !report.failureType.trim()) {
    errors.push({
      field: 'failureType',
      stepIndex: 0,
      message: 'Failure Classification is required'
    });
  }

  // 5-Why garbage validation (Step 2) when not marked N/A
  if (!report.fiveWhy?.notApplicable) {
    const garbagePlaceholders = new Set(['-', 'n/a', 'na', 'none', '.', 'nil', 'null', 'n.a.', 'na/']);
    const whyKeys: ('why1' | 'why2' | 'why3' | 'why4' | 'why5')[] = ['why1', 'why2', 'why3', 'why4', 'why5'];
    const whyLabels: Record<string, string> = {
      why1: 'Why #1',
      why2: 'Why #2',
      why3: 'Why #3',
      why4: 'Why #4',
      why5: 'Why #5 (Root Cause)'
    };

    for (const key of whyKeys) {
      const val = report.fiveWhy?.[key];
      if (val !== undefined && typeof val === 'string' && val.trim().length > 0) {
        const trimmed = val.trim();
        const lower = trimmed.toLowerCase();
        if (garbagePlaceholders.has(lower) || trimmed.length < 5) {
          errors.push({
            field: `fiveWhy.${key}`,
            stepIndex: 2,
            message: `${whyLabels[key]} must be at least 5 characters and cannot be a placeholder ("${trimmed}")`
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
