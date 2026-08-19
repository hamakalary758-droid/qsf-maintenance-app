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

  // Step 1 (5W+1H Breakdown) Required Fields
  const fiveWOneH = report.fiveWOneH;
  if (!fiveWOneH?.what || !fiveWOneH.what.trim()) {
    errors.push({
      field: 'fiveWOneH.what',
      stepIndex: 1,
      message: 'WHAT Happened (Problem & damage description) is required'
    });
  }

  if (!fiveWOneH?.when || !fiveWOneH.when.trim()) {
    errors.push({
      field: 'fiveWOneH.when',
      stepIndex: 1,
      message: 'WHEN Discovered (Exact time / shift) is required'
    });
  }

  if (!fiveWOneH?.where || !fiveWOneH.where.trim()) {
    errors.push({
      field: 'fiveWOneH.where',
      stepIndex: 1,
      message: 'WHERE Located (Component / housing) is required'
    });
  }

  if (!fiveWOneH?.who || !fiveWOneH.who.trim()) {
    errors.push({
      field: 'fiveWOneH.who',
      stepIndex: 1,
      message: 'WHO Discovered (Technician / team) is required'
    });
  }

  if (!fiveWOneH?.which || !fiveWOneH.which.trim()) {
    errors.push({
      field: 'fiveWOneH.which',
      stepIndex: 1,
      message: 'WHICH Mode / Condition (Operating load / fluid type) is required'
    });
  }

  if (!fiveWOneH?.how || !fiveWOneH.how.trim()) {
    errors.push({
      field: 'fiveWOneH.how',
      stepIndex: 1,
      message: 'HOW Detected / Severity (Sensors / noise / visual) is required'
    });
  }

  // Step 2 (5-Why Analysis) Validation
  if (!report.fiveWhy?.notApplicable) {
    const garbagePlaceholders = new Set(['-', 'n/a', 'na', 'none', '.', 'nil', 'null', 'n.a.', 'na/']);

    // 1. Why #5 (Root Cause) is ALWAYS required and must be valid
    const why5Val = report.fiveWhy?.why5;
    if (!why5Val || !why5Val.trim()) {
      errors.push({
        field: 'fiveWhy.why5',
        stepIndex: 2,
        message: 'Why #5 (Root Cause) is required'
      });
    } else {
      const trimmed5 = why5Val.trim();
      if (garbagePlaceholders.has(trimmed5.toLowerCase()) || trimmed5.length < 5) {
        errors.push({
          field: 'fiveWhy.why5',
          stepIndex: 2,
          message: `Why #5 (Root Cause) must be at least 5 characters and cannot be a placeholder ("${trimmed5}")`
        });
      }
    }

    // 2. Why #1 to Why #4: Validate unless explicitly marked as skipped
    const intermediateWhys: Array<{
      key: 'why1' | 'why2' | 'why3' | 'why4';
      skipKey: 'why1Skipped' | 'why2Skipped' | 'why3Skipped' | 'why4Skipped';
      label: string;
    }> = [
      { key: 'why1', skipKey: 'why1Skipped', label: 'Why #1' },
      { key: 'why2', skipKey: 'why2Skipped', label: 'Why #2' },
      { key: 'why3', skipKey: 'why3Skipped', label: 'Why #3' },
      { key: 'why4', skipKey: 'why4Skipped', label: 'Why #4' }
    ];

    for (const item of intermediateWhys) {
      const isSkipped = Boolean(report.fiveWhy?.[item.skipKey]);
      if (!isSkipped) {
        const val = report.fiveWhy?.[item.key];
        if (!val || !val.trim()) {
          errors.push({
            field: `fiveWhy.${item.key}`,
            stepIndex: 2,
            message: `${item.label} is required (or mark as not needed)`
          });
        } else {
          const trimmed = val.trim();
          if (garbagePlaceholders.has(trimmed.toLowerCase()) || trimmed.length < 5) {
            errors.push({
              field: `fiveWhy.${item.key}`,
              stepIndex: 2,
              message: `${item.label} must be at least 5 characters and cannot be a placeholder ("${trimmed}")`
            });
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
