import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import saveAs from 'file-saver';
import { MaintenanceReport } from '../types';

/**
 * Returns a safe, human-readable identifier for a report to use in exported
 * document fields and filenames, even if the DB-assigned report number
 * hasn't synced back yet.
 */
export const getReportIdentifier = (report: MaintenanceReport): string => {
  if (report.reportNumber && report.reportNumber.trim()) {
    return report.reportNumber.trim();
  }
  // Fall back to a short, stable slice of the local report id so exports
  // taken before sync still get a distinct, non-generic identifier.
  const shortId = report.id ? report.id.slice(-8) : 'UNSYNCED';
  return `PENDING-${shortId}`;
};

/**
 * Helper to convert a blob/fetchable image URL into a standalone base64 data URI
 * so images persist in exported Word documents across sessions and environments.
 */
const photoUrlToDataUri = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to convert photo to data URI for Word export:', err);
    return null;
  }
};

/**
 * Common cell borders and styles for ExcelJS worksheets
 */
const cellBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

const applyHeaderStyle = (cell: ExcelJS.Cell, fontSize = 11) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' }
  };
  cell.font = {
    name: 'Segoe UI',
    color: { argb: 'FFFFFFFF' },
    bold: true,
    size: fontSize
  };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  cell.border = cellBorder;
};

const applyLabelStyle = (cell: ExcelJS.Cell) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }
  };
  cell.font = {
    name: 'Segoe UI',
    color: { argb: 'FF334155' },
    bold: true,
    size: 10
  };
  cell.alignment = { vertical: 'middle' };
  cell.border = cellBorder;
};

const applyDataStyle = (cell: ExcelJS.Cell, isMono = false) => {
  cell.font = {
    name: isMono ? 'Courier New' : 'Segoe UI',
    size: 10,
    color: { argb: 'FF1E293B' }
  };
  cell.alignment = { vertical: 'middle' };
  cell.border = cellBorder;
};

/**
 * 1. Excel Export (xlsx via exceljs)
 * Creates a clean styled spreadsheet with multiple sheets: Overview, 5W+1H, 5-Why, Actions, Spare Parts, Photos
 */
export const exportReportToExcel = async (report: MaintenanceReport): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QSF Plant Maintenance';
  wb.created = new Date();

  // 1. Overview Sheet
  const wsOverview = wb.addWorksheet('Overview', {
    views: [{ showGridLines: true }]
  });
  wsOverview.columns = [{ width: 24 }, { width: 52 }];

  // Title row
  const titleRow = wsOverview.addRow(['SHUTDOWN MAINTENANCE REPORT', '']);
  titleRow.height = 26;
  wsOverview.mergeCells('A1:B1');
  applyHeaderStyle(wsOverview.getCell('A1'), 12);
  applyHeaderStyle(wsOverview.getCell('B1'), 12);

  const overviewRows = [
    ['Report Number', getReportIdentifier(report)],
    ['Shutdown Event', report.shutdownName || 'N/A'],
    ['Date', report.date || 'N/A'],
    ['Technician Name', report.technicianName || 'N/A'],
    ['Technician ID', report.technicianId || 'N/A'],
    ['Equipment Name', report.equipmentName || 'N/A'],
    ['Equipment Code', report.equipmentCode || 'N/A'],
    ['Location / Area', report.location || 'N/A'],
    ['Failure Classification', report.failureType || 'N/A'],
    ['Status', report.status || 'Draft'],
    ['Created Date', report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'],
    ['Last Updated', report.updatedAt ? new Date(report.updatedAt).toLocaleString() : 'N/A'],
    ['Notes', report.notes || '']
  ];

  overviewRows.forEach(([label, val]) => {
    const row = wsOverview.addRow([label, val]);
    row.height = 20;
    applyLabelStyle(row.getCell(1));
    applyDataStyle(row.getCell(2));
  });

  // 2. 5W+1H Sheet
  const wsFiveW = wb.addWorksheet('5W1H Analysis', {
    views: [{ showGridLines: true }]
  });
  wsFiveW.columns = [{ width: 34 }, { width: 65 }];

  const fiveWHeader = wsFiveW.addRow(['5W+1H ANALYSIS ASPECT', 'DETAILS']);
  fiveWHeader.height = 24;
  applyHeaderStyle(fiveWHeader.getCell(1));
  applyHeaderStyle(fiveWHeader.getCell(2));

  const fiveWRows = [
    ['WHAT (Problem Description)', report.fiveWOneH?.what || ''],
    ['WHEN (Timing / Shift)', report.fiveWOneH?.when || ''],
    ['WHERE (Component / Location)', report.fiveWOneH?.where || ''],
    ['WHO (Discovered / Team)', report.fiveWOneH?.who || ''],
    ['WHICH (Operating Mode / Condition)', report.fiveWOneH?.which || ''],
    ['HOW (Detection / Severity)', report.fiveWOneH?.how || '']
  ];

  fiveWRows.forEach(([aspect, detail]) => {
    const row = wsFiveW.addRow([aspect, detail]);
    row.height = 22;
    applyLabelStyle(row.getCell(1));
    applyDataStyle(row.getCell(2));
  });

  // 3. 5-Why Sheet
  const wsFiveWhy = wb.addWorksheet('5-Why Analysis', {
    views: [{ showGridLines: true }]
  });
  wsFiveWhy.columns = [{ width: 28 }, { width: 70 }];

  const fiveWhyHeader = wsFiveWhy.addRow(['WHY STEP', 'ANALYSIS / OBSERVATION']);
  fiveWhyHeader.height = 24;
  applyHeaderStyle(fiveWhyHeader.getCell(1));
  applyHeaderStyle(fiveWhyHeader.getCell(2));

  const fiveWhyRows = [
    ['1st Why', report.fiveWhy?.why1 || ''],
    ['2nd Why', report.fiveWhy?.why2 || ''],
    ['3rd Why', report.fiveWhy?.why3 || ''],
    ['4th Why', report.fiveWhy?.why4 || ''],
    ['5th Why (Root Cause)', report.fiveWhy?.why5 || '']
  ];

  fiveWhyRows.forEach(([step, obs], idx) => {
    const row = wsFiveWhy.addRow([step, obs]);
    row.height = 22;
    if (idx === 4) {
      // Root cause red tint
      [row.getCell(1), row.getCell(2)].forEach((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2F2' }
        };
        cell.font = {
          name: 'Segoe UI',
          color: { argb: 'FF991B1B' },
          bold: true,
          size: 10
        };
        cell.border = cellBorder;
        cell.alignment = { vertical: 'middle' };
      });
    } else {
      applyLabelStyle(row.getCell(1));
      applyDataStyle(row.getCell(2));
    }
  });

  // 4. Corrective Actions Sheet
  const wsActions = wb.addWorksheet('Corrective Actions', {
    views: [{ showGridLines: true }]
  });
  wsActions.columns = [{ width: 42 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 16 }];

  const actionHeaderRow = wsActions.addRow(['Action Description', 'Assignee', 'Priority', 'Status', 'Target Date']);
  actionHeaderRow.height = 24;
  for (let c = 1; c <= 5; c++) {
    applyHeaderStyle(actionHeaderRow.getCell(c));
  }

  (report.correctiveActions || []).forEach((ca) => {
    const row = wsActions.addRow([ca.action, ca.assignee, ca.priority, ca.status, ca.targetDate]);
    row.height = 20;
    for (let c = 1; c <= 5; c++) {
      applyDataStyle(row.getCell(c));
    }
  });

  // 5. Spare Parts Sheet
  const wsParts = wb.addWorksheet('Spare Parts', {
    views: [{ showGridLines: true }]
  });
  wsParts.columns = [{ width: 35 }, { width: 22 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 14 }];

  const partHeaderRow = wsParts.addRow(['Part Name', 'Part Number', 'Quantity', 'Unit Cost', 'Total Cost', 'Status']);
  partHeaderRow.height = 24;
  for (let c = 1; c <= 6; c++) {
    applyHeaderStyle(partHeaderRow.getCell(c));
  }

  let totalCost = 0;
  (report.spareParts || []).forEach((sp) => {
    const qty = sp.quantity || 0;
    const unitCost = sp.unitCost || 0;
    const itemTotal = qty * unitCost;
    totalCost += itemTotal;

    const row = wsParts.addRow([sp.partName, sp.partNumber, qty, unitCost, itemTotal, sp.status]);
    row.height = 20;
    applyDataStyle(row.getCell(1));
    applyDataStyle(row.getCell(2), true);
    applyDataStyle(row.getCell(3));
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    const unitCell = row.getCell(4);
    applyDataStyle(unitCell);
    unitCell.numFmt = '$#,##0.00';
    unitCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const totalCell = row.getCell(5);
    applyDataStyle(totalCell);
    totalCell.numFmt = '$#,##0.00';
    totalCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };

    applyDataStyle(row.getCell(6));
  });

  // Total Row
  const totalRowIndex = wsParts.rowCount + 1;
  const totalRow = wsParts.addRow(['TOTAL SPARE PARTS COST', '', '', '', totalCost, '']);
  totalRow.height = 22;
  wsParts.mergeCells(`A${totalRowIndex}:C${totalRowIndex}`);
  for (let c = 1; c <= 6; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.border = cellBorder;
    cell.alignment = { vertical: 'middle' };
  }
  const totalValCell = totalRow.getCell(5);
  totalValCell.numFmt = '$#,##0.00';
  totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };

  // 6. Attached Photos Sheet (if photos exist)
  if (report.photos && report.photos.length > 0) {
    const wsPhotos = wb.addWorksheet('Attached Photos', {
      views: [{ showGridLines: true }]
    });
    wsPhotos.columns = [{ width: 16 }, { width: 45 }, { width: 22 }, { width: 50 }];

    const photoHeaderRow = wsPhotos.addRow(['Photo Index', 'Caption / Notes', 'Timestamp', 'Note']);
    photoHeaderRow.height = 24;
    for (let c = 1; c <= 4; c++) {
      applyHeaderStyle(photoHeaderRow.getCell(c));
    }

    report.photos.forEach((ph, idx) => {
      const row = wsPhotos.addRow([
        `Photo #${idx + 1}`,
        ph.caption || 'No caption',
        ph.timestamp || 'N/A',
        'See attached photo files exported alongside this report'
      ]);
      row.height = 20;
      for (let c = 1; c <= 4; c++) {
        applyDataStyle(row.getCell(c));
      }
    });
  }

  // Trigger separate download for attached photo files
  if (report.photos && report.photos.length > 0) {
    for (let idx = 0; idx < report.photos.length; idx++) {
      const ph = report.photos[idx];
      if (ph.url) {
        try {
          const res = await fetch(ph.url);
          const photoBlob = await res.blob();
          saveAs(photoBlob, `${getReportIdentifier(report)}_photo${idx + 1}.jpg`);
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          console.warn(`Failed to export photo #${idx + 1}:`, err);
        }
      }
    }
  }

  // Trigger File Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const filename = `${getReportIdentifier(report)}_${report.equipmentCode}_Report.xlsx`;
  saveAs(blob, filename);
};

/**
 * Adds a structured, styled single-report worksheet to a batch ExcelJS workbook
 */
export const addReportExcelSheet = (
  wb: ExcelJS.Workbook,
  report: MaintenanceReport,
  sheetName: string
): ExcelJS.Worksheet => {
  const ws = wb.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });
  ws.columns = [
    { width: 28 },
    { width: 36 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 14 }
  ];

  // 1. Title Banner
  const titleRow = ws.addRow(['SHUTDOWN MAINTENANCE REPORT', '', '', '', '', '']);
  titleRow.height = 26;
  ws.mergeCells(`A${ws.rowCount}:F${ws.rowCount}`);
  for (let c = 1; c <= 6; c++) {
    applyHeaderStyle(titleRow.getCell(c), 12);
  }

  // 2. Overview Rows
  const overviewRows = [
    ['Report Number', getReportIdentifier(report)],
    ['Shutdown Event', report.shutdownName || 'N/A'],
    ['Date', report.date || 'N/A'],
    ['Technician Name', report.technicianName || 'N/A'],
    ['Technician ID', report.technicianId || 'N/A'],
    ['Equipment Name', report.equipmentName || 'N/A'],
    ['Equipment Code', report.equipmentCode || 'N/A'],
    ['Location / Area', report.location || 'N/A'],
    ['Failure Classification', report.failureType || 'N/A'],
    ['Status', report.status || 'Draft'],
    ['Created Date', report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'],
    ['Last Updated', report.updatedAt ? new Date(report.updatedAt).toLocaleString() : 'N/A'],
    ['Notes', report.notes || '']
  ];

  overviewRows.forEach(([label, val]) => {
    const row = ws.addRow([label, val, '', '', '', '']);
    row.height = 20;
    const rIdx = ws.rowCount;
    ws.mergeCells(`B${rIdx}:F${rIdx}`);
    applyLabelStyle(row.getCell(1));
    for (let c = 2; c <= 6; c++) {
      applyDataStyle(row.getCell(c));
    }
  });

  // 3. 5W+1H Section
  ws.addRow([]); // Blank spacer
  const fiveWHeaderRow = ws.addRow(['5W+1H ANALYSIS ASPECT', 'DETAILS', '', '', '', '']);
  fiveWHeaderRow.height = 24;
  const fIdx = ws.rowCount;
  ws.mergeCells(`B${fIdx}:F${fIdx}`);
  for (let c = 1; c <= 6; c++) {
    applyHeaderStyle(fiveWHeaderRow.getCell(c));
  }

  const fiveWRows = [
    ['WHAT (Problem Description)', report.fiveWOneH?.what || ''],
    ['WHEN (Timing / Shift)', report.fiveWOneH?.when || ''],
    ['WHERE (Component / Location)', report.fiveWOneH?.where || ''],
    ['WHO (Discovered / Team)', report.fiveWOneH?.who || ''],
    ['WHICH (Operating Mode / Condition)', report.fiveWOneH?.which || ''],
    ['HOW (Detection / Severity)', report.fiveWOneH?.how || '']
  ];

  fiveWRows.forEach(([aspect, detail]) => {
    const row = ws.addRow([aspect, detail, '', '', '', '']);
    row.height = 22;
    const curIdx = ws.rowCount;
    ws.mergeCells(`B${curIdx}:F${curIdx}`);
    applyLabelStyle(row.getCell(1));
    for (let c = 2; c <= 6; c++) {
      applyDataStyle(row.getCell(c));
    }
  });

  // 4. 5-Why Section
  ws.addRow([]);
  const fiveWhyHeaderRow = ws.addRow(['WHY STEP', 'ANALYSIS / OBSERVATION', '', '', '', '']);
  fiveWhyHeaderRow.height = 24;
  const wIdx = ws.rowCount;
  ws.mergeCells(`B${wIdx}:F${wIdx}`);
  for (let c = 1; c <= 6; c++) {
    applyHeaderStyle(fiveWhyHeaderRow.getCell(c));
  }

  const fiveWhyRows = [
    ['1st Why', report.fiveWhy?.why1 || ''],
    ['2nd Why', report.fiveWhy?.why2 || ''],
    ['3rd Why', report.fiveWhy?.why3 || ''],
    ['4th Why', report.fiveWhy?.why4 || ''],
    ['5th Why (Root Cause)', report.fiveWhy?.why5 || '']
  ];

  fiveWhyRows.forEach(([step, obs], idx) => {
    const row = ws.addRow([step, obs, '', '', '', '']);
    row.height = 22;
    const curIdx = ws.rowCount;
    ws.mergeCells(`B${curIdx}:F${curIdx}`);

    if (idx === 4) {
      // Root cause distinct fill
      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2F2' }
        };
        cell.font = {
          name: 'Segoe UI',
          color: { argb: 'FF991B1B' },
          bold: true,
          size: 10
        };
        cell.border = cellBorder;
        cell.alignment = { vertical: 'middle' };
      }
    } else {
      applyLabelStyle(row.getCell(1));
      for (let c = 2; c <= 6; c++) {
        applyDataStyle(row.getCell(c));
      }
    }
  });

  // 5. Corrective Actions Section
  ws.addRow([]);
  const actTitleRow = ws.addRow(['CORRECTIVE ACTIONS', '', '', '', '']);
  actTitleRow.height = 24;
  const actTIdx = ws.rowCount;
  ws.mergeCells(`A${actTIdx}:E${actTIdx}`);
  for (let c = 1; c <= 5; c++) {
    applyHeaderStyle(actTitleRow.getCell(c));
  }

  const actHeadRow = ws.addRow(['Action Description', 'Assignee', 'Priority', 'Status', 'Target Date']);
  actHeadRow.height = 22;
  for (let c = 1; c <= 5; c++) {
    applyHeaderStyle(actHeadRow.getCell(c));
  }

  (report.correctiveActions || []).forEach((ca) => {
    const row = ws.addRow([ca.action, ca.assignee, ca.priority, ca.status, ca.targetDate]);
    row.height = 20;
    for (let c = 1; c <= 5; c++) {
      applyDataStyle(row.getCell(c));
    }
  });

  // 6. Spare Parts Section
  ws.addRow([]);
  const partTitleRow = ws.addRow(['SPARE PARTS & MATERIALS', '', '', '', '', '']);
  partTitleRow.height = 24;
  const partTIdx = ws.rowCount;
  ws.mergeCells(`A${partTIdx}:F${partTIdx}`);
  for (let c = 1; c <= 6; c++) {
    applyHeaderStyle(partTitleRow.getCell(c));
  }

  const partHeadRow = ws.addRow(['Part Name', 'Part Number', 'Quantity', 'Unit Cost ($)', 'Total Cost ($)', 'Status']);
  partHeadRow.height = 22;
  for (let c = 1; c <= 6; c++) {
    applyHeaderStyle(partHeadRow.getCell(c));
  }

  let totalCost = 0;
  (report.spareParts || []).forEach((sp) => {
    const qty = sp.quantity || 0;
    const unitCost = sp.unitCost || 0;
    const itemTotal = qty * unitCost;
    totalCost += itemTotal;

    const row = ws.addRow([sp.partName, sp.partNumber, qty, unitCost, itemTotal, sp.status]);
    row.height = 20;
    applyDataStyle(row.getCell(1));
    applyDataStyle(row.getCell(2), true);
    applyDataStyle(row.getCell(3));
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    const unitCell = row.getCell(4);
    applyDataStyle(unitCell);
    unitCell.numFmt = '$#,##0.00';
    unitCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const totalCell = row.getCell(5);
    applyDataStyle(totalCell);
    totalCell.numFmt = '$#,##0.00';
    totalCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };

    applyDataStyle(row.getCell(6));
  });

  // Total Spare Cost Row
  const totalRowIndex = ws.rowCount + 1;
  const totalRow = ws.addRow(['TOTAL SPARE PARTS COST', '', '', '', totalCost, '']);
  totalRow.height = 22;
  ws.mergeCells(`A${totalRowIndex}:C${totalRowIndex}`);
  for (let c = 1; c <= 6; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.border = cellBorder;
    cell.alignment = { vertical: 'middle' };
  }
  const totalValCell = totalRow.getCell(5);
  totalValCell.numFmt = '$#,##0.00';
  totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };

  // 7. Attached Photos Section (if any)
  if (report.photos && report.photos.length > 0) {
    ws.addRow([]);
    const photoTitleRow = ws.addRow(['ATTACHED PHOTOS', '', '', '']);
    photoTitleRow.height = 24;
    const pTIdx = ws.rowCount;
    ws.mergeCells(`A${pTIdx}:D${pTIdx}`);
    for (let c = 1; c <= 4; c++) {
      applyHeaderStyle(photoTitleRow.getCell(c));
    }

    const photoHeadRow = ws.addRow(['Photo Index', 'Caption / Notes', 'Timestamp', 'Note']);
    photoHeadRow.height = 22;
    for (let c = 1; c <= 4; c++) {
      applyHeaderStyle(photoHeadRow.getCell(c));
    }

    report.photos.forEach((ph, idx) => {
      const row = ws.addRow([
        `Photo #${idx + 1}`,
        ph.caption || 'No caption',
        ph.timestamp || 'N/A',
        'See attached photo files exported alongside this report'
      ]);
      row.height = 20;
      for (let c = 1; c <= 4; c++) {
        applyDataStyle(row.getCell(c));
      }
    });
  }

  return ws;
};

/**
 * Batch Excel Export (via exceljs)
 * Combines all reports for a shutdown into a single workbook (one sheet per report)
 */
export const exportBatchToExcel = async (reports: MaintenanceReport[], shutdownName: string): Promise<void> => {
  if (!reports || reports.length === 0) return;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QSF Plant Maintenance';
  wb.created = new Date();

  const existingSheetNames = new Set<string>();

  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    let sheetName = getReportIdentifier(r).replace(/[\\/?*:[\]]/g, '_').trim().slice(0, 31);
    if (!sheetName) sheetName = `Report_${i + 1}`;
    if (existingSheetNames.has(sheetName)) {
      const suffix = `_${i + 1}`;
      sheetName = sheetName.slice(0, 31 - suffix.length) + suffix;
    }
    existingSheetNames.add(sheetName);

    addReportExcelSheet(wb, r, sheetName);
  }

  // Trigger photo downloads for all reports in batch
  for (const r of reports) {
    if (r.photos && r.photos.length > 0) {
      for (let idx = 0; idx < r.photos.length; idx++) {
        const ph = r.photos[idx];
        if (ph.url) {
          try {
            const res = await fetch(ph.url);
            const photoBlob = await res.blob();
            saveAs(photoBlob, `${getReportIdentifier(r)}_photo${idx + 1}.jpg`);
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (err) {
            console.warn(`Failed to export photo #${idx + 1}:`, err);
          }
        }
      }
    }
  }

  const cleanName = (shutdownName || 'General').replace(/\s+/g, '_');
  const filename = `Shutdown_${cleanName}_Batch.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, filename);
};

/**
 * 2. PDF Export (jspdf & html2canvas)
 * Renders report with section-aware pagination, proper page breaks, and photo scaling
 */

/**
 * Copies the live page's actual CSS rules into the cloned document as an inline <style> block,
 * ADDITIVELY (does not remove or modify any existing <style>/<link> in the clone). This guarantees
 * the clone has synchronously-available real CSS regardless of whether its own linked stylesheet
 * has finished loading over the network by the time html2canvas-pro captures it.
 */
const injectLiveStylesheetIntoClone = (clonedDoc: Document) => {
  let combinedCss = '';
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            combinedCss += sheet.cssRules[j].cssText + '\n';
          }
        }
      } catch {
        // Cross-origin stylesheet; skip, nothing we can do about it.
      }
    }
  } catch (err) {
    console.warn('injectLiveStylesheetIntoClone: could not read document.styleSheets', err);
  }

  if (!combinedCss) return;

  const styleEl = clonedDoc.createElement('style');
  styleEl.setAttribute('data-injected-for-pdf-export', 'true');
  styleEl.textContent = combinedCss;
  if (clonedDoc.head) {
    clonedDoc.head.appendChild(styleEl);
  } else {
    clonedDoc.documentElement.appendChild(styleEl);
  }
};

/**
 * Resolves computed background colors to concrete inline rgb/rgba strings on cloned elements
 * so background fills render reliably in html2canvas-pro without touching stylesheets.
 */
const forceInlineBackgroundColors = (clonedElement: HTMLElement) => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1;
  tempCanvas.height = 1;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const allElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))];
  allElements.forEach((node) => {
    if (node instanceof HTMLElement) {
      try {
        const nodeView = node.ownerDocument?.defaultView ?? window;
        const bg = nodeView.getComputedStyle(node).backgroundColor;

        if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
          return;
        }

        // If it's already a plain opaque rgb(r, g, b) value, it doesn't strictly need resolution,
        // but resolving via 2D canvas safely handles oklch, oklab, color-mix, and css variables.
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillStyle = bg.trim();
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const alpha = data[3] / 255;
        if (alpha === 0) return;

        const resolved = alpha === 1
          ? `rgb(${data[0]}, ${data[1]}, ${data[2]})`
          : `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${alpha.toFixed(2)})`;

        node.style.setProperty('background-color', resolved, 'important');
      } catch {
        // Per-element defensive catch
      }
    }
  });
};

export const exportReportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for PDF export.`);
    alert('Report content not found for PDF generation.');
    return;
  }

  const hiddenElements = element.querySelectorAll<HTMLElement>('.print-hide');
  const previousDisplayValues: string[] = [];
  hiddenElements.forEach((el) => {
    previousDisplayValues.push(el.style.display);
    el.style.display = 'none';
  });

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190mm
    const maxContentHeight = pageHeight - margin * 2; // 277mm

    // Look for top-level direct children inside the report printable card
    const sectionContainers = element.children;

    if (sectionContainers.length > 0) {
      let currentY = margin;
      let isFirstPage = true;

      for (let i = 0; i < sectionContainers.length; i++) {
        const section = sectionContainers[i] as HTMLElement;
        if (!section || section.classList.contains('print-hide')) continue;

        const sectionCanvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (doc, el) => {
            if (doc) {
              injectLiveStylesheetIntoClone(doc);
            }
            if (el instanceof HTMLElement) {
              forceInlineBackgroundColors(el);
            }
          }
        });

        const imgData = sectionCanvas.toDataURL('image/jpeg', 0.95);
        const sectionHeightMm = (sectionCanvas.height * contentWidth) / sectionCanvas.width;

        // If section doesn't fit on current page and we've already written content
        if (currentY + sectionHeightMm > pageHeight - margin && currentY > margin) {
          pdf.addPage();
          currentY = margin;
          isFirstPage = false;
        }

        // If a single massive section exceeds a full page height (e.g. 20+ photos in 1 grid)
        if (sectionHeightMm > maxContentHeight) {
          let sliceRemaining = sectionHeightMm;
          let sliceOffsetMm = 0;

          while (sliceRemaining > 0) {
            if (currentY > margin && sliceRemaining > pageHeight - currentY - margin) {
              pdf.addPage();
              currentY = margin;
            }

            const availableHeight = pageHeight - currentY - margin;
            const currentSliceHeight = Math.min(sliceRemaining, availableHeight);

            // Add the image portion
            pdf.addImage(
              imgData,
              'JPEG',
              margin,
              currentY - sliceOffsetMm,
              contentWidth,
              sectionHeightMm
            );

            sliceRemaining -= currentSliceHeight;
            sliceOffsetMm += currentSliceHeight;
            currentY += currentSliceHeight;

            if (sliceRemaining > 0) {
              pdf.addPage();
              currentY = margin;
            }
          }
        } else {
          // Standard section fits
          pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, sectionHeightMm);
          currentY += sectionHeightMm + 4; // 4mm spacing between sections
        }
      }

      // Add page numbering footers
      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        pdf.setTextColor(140, 150, 160);
        pdf.text(
          `QSF Maintenance Report — ${filename} — Page ${p} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      pdf.save(`${filename}.pdf`);
      return;
    }

    // Fallback: render full element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedElement) => {
        if (clonedDoc) {
          injectLiveStylesheetIntoClone(clonedDoc);
        }
        if (clonedElement instanceof HTMLElement) {
          forceInlineBackgroundColors(clonedElement);
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
    heightLeft -= maxContentHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
      heightLeft -= maxContentHeight;
    }

    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFontSize(8);
      pdf.setTextColor(140, 150, 160);
      pdf.text(
        `QSF Maintenance Report — ${filename} — Page ${p} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('PDF export encountered an issue. Exporting as Word or printing to PDF is recommended.');
  } finally {
    hiddenElements.forEach((el, idx) => {
      el.style.display = previousDisplayValues[idx] || '';
    });
  }
};

/**
 * 3. Word Document Export (.doc formatted HTML)
 * Builds the inner HTML body for a single maintenance report in Word format
 */
export const buildReportWordSectionHtml = (
  report: MaintenanceReport,
  resolvedPhotoUrls: (string | null)[] = []
): string => {
  const actionsHtml = report.correctiveActions
    .map(
      (a) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${a.action}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${a.assignee}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${a.priority}</strong></td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${a.status}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${a.targetDate}</td>
      </tr>
    `
    )
    .join('');

  const sparePartsHtml = report.spareParts
    .map(
      (p) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${p.partName}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace;">${p.partNumber}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${p.quantity}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">$${p.unitCost.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">$${(p.quantity * p.unitCost).toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${p.status}</td>
      </tr>
    `
    )
    .join('');

  const photosHtml = report.photos
    .map((ph, idx) => {
      const photoSrc = resolvedPhotoUrls[idx] || ph.url;
      return `
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${photoSrc}" style="max-width: 500px; height: auto; border: 1px solid #cbd5e1; border-radius: 4px;" alt="${ph.caption || `Photo #${idx + 1}`}" />
        <p style="font-size: 11px; color: #555555; margin-top: 4px;"><em>${ph.caption || `Photo #${idx + 1}`} (${ph.timestamp || 'Recorded'})</em></p>
      </div>
    `;
    })
    .join('');

  const totalSparePartsCost = report.spareParts.reduce((acc, p) => acc + p.quantity * p.unitCost, 0);

  return `
    <div style="margin-bottom: 24px;">
      <!-- Colored Header Band -->
      <div style="background-color: #0284c7; color: #ffffff; padding: 16px 20px; border-radius: 4px 4px 0 0; margin-bottom: 0;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 8px; font-weight: bold;">
          ${getReportIdentifier(report)}
        </div>
        <h1 style="color: #ffffff; font-size: 20px; margin: 0; padding: 0; border: none; font-weight: bold;">
          PLANT SHUTDOWN MAINTENANCE REPORT
        </h1>
        <p style="font-size: 12px; color: #e0f2fe; margin: 4px 0 0 0;">
          ${report.equipmentName} (${report.equipmentCode}) — ${report.shutdownName || 'Shutdown Event'}
        </p>
      </div>
      
      <table class="meta-table" style="border-top: none;">
        <tr>
          <td class="meta-label">Report Number</td>
          <td>${getReportIdentifier(report)}</td>
          <td class="meta-label">Date</td>
          <td>${report.date}</td>
        </tr>
        <tr>
          <td class="meta-label">Shutdown Event</td>
          <td colspan="3">${report.shutdownName}</td>
        </tr>
        <tr>
          <td class="meta-label">Technician Name</td>
          <td>${report.technicianName} (${report.technicianId || 'N/A'})</td>
          <td class="meta-label">Failure Type</td>
          <td><strong>${report.failureType}</strong></td>
        </tr>
        <tr>
          <td class="meta-label">Equipment Name</td>
          <td>${report.equipmentName}</td>
          <td class="meta-label">Equipment Code</td>
          <td><code>${report.equipmentCode}</code></td>
        </tr>
        <tr>
          <td class="meta-label">Location / Area</td>
          <td colspan="3">${report.location}</td>
        </tr>
        ${report.notes ? `<tr><td class="meta-label">Notes</td><td colspan="3">${report.notes}</td></tr>` : ''}
      </table>

      <h2>1. 5W + 1H PROBLEM ANALYSIS</h2>
      <table class="meta-table">
        <tr><td class="meta-label">WHAT Happened</td><td>${report.fiveWOneH.what}</td></tr>
        <tr><td class="meta-label">WHEN Discovered</td><td>${report.fiveWOneH.when}</td></tr>
        <tr><td class="meta-label">WHERE Located</td><td>${report.fiveWOneH.where}</td></tr>
        <tr><td class="meta-label">WHO Discovered</td><td>${report.fiveWOneH.who}</td></tr>
        <tr><td class="meta-label">WHICH Operating Mode</td><td>${report.fiveWOneH.which}</td></tr>
        <tr><td class="meta-label">HOW Detected / Severity</td><td>${report.fiveWOneH.how}</td></tr>
      </table>

      <h2>2. 5-WHY ROOT CAUSE ANALYSIS</h2>
      <div class="why-box"><div class="why-title">WHY 1</div><div class="why-desc">${report.fiveWhy.why1}</div></div>
      <div class="why-box"><div class="why-title">WHY 2</div><div class="why-desc">${report.fiveWhy.why2}</div></div>
      <div class="why-box"><div class="why-title">WHY 3</div><div class="why-desc">${report.fiveWhy.why3}</div></div>
      <div class="why-box"><div class="why-title">WHY 4</div><div class="why-desc">${report.fiveWhy.why4}</div></div>
      <div class="why-box root-cause"><div class="why-title">WHY 5 (ROOT CAUSE)</div><div class="why-desc">${report.fiveWhy.why5}</div></div>

      <h2>3. CORRECTIVE ACTIONS TAKEN / PLANNED</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Action Item</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Target Date</th>
          </tr>
        </thead>
        <tbody>
          ${actionsHtml || '<tr><td colspan="5">No actions recorded.</td></tr>'}
        </tbody>
      </table>

      <h2>4. SPARE PARTS & MATERIAL UTILIZATION</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Part Description</th>
            <th>Part Number</th>
            <th>Qty</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${sparePartsHtml || '<tr><td colspan="6">No spare parts recorded.</td></tr>'}
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="4" style="text-align: right; padding: 8px;">Total Spare Parts Cost:</td>
            <td style="text-align: right; padding: 8px;">$${totalSparePartsCost.toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      ${
        report.photos.length > 0
          ? `<h2>5. MAINTENANCE INSPECTION PHOTOS & ANNOTATIONS</h2>${photosHtml}`
          : ''
      }

      <h2>6. SIGN-OFF & APPROVAL</h2>
      <table class="meta-table" style="margin-top: 30px;">
        <tr>
          <td style="height: 60px; vertical-align: bottom; width: 50%;">
            ____________________________________<br/>
            <strong>Maintenance Technician</strong><br/>
            ${report.technicianName}
          </td>
          <td style="height: 60px; vertical-align: bottom; width: 50%;">
            ____________________________________<br/>
            <strong>Plant Reliability Engineer</strong><br/>
            Signature & Date
          </td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * 3. Word Document Export (.doc formatted HTML)
 * Produces a Word-compatible HTML file that opens directly in Microsoft Word with rich styling, tables & photos
 */
export const exportReportToWord = async (report: MaintenanceReport): Promise<void> => {
  const resolvedPhotoUrls = await Promise.all(
    (report.photos || []).map((ph) => (ph.url ? photoUrlToDataUri(ph.url) : Promise.resolve(null)))
  );

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Shutdown Maintenance Report - ${getReportIdentifier(report)}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
        h1 { color: #0f172a; font-size: 20px; margin: 0; padding: 0; }
        h2 { color: #0369a1; font-size: 15px; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #0284c7; padding-left: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .meta-table td { padding: 6px 10px; border: 1px solid #cbd5e1; }
        .meta-label { background-color: #f1f5f9; font-weight: bold; width: 25%; color: #334155; }
        .data-table th { background-color: #0284c7; color: #ffffff; padding: 10px; text-align: left; border: 1px solid #0284c7; font-size: 13px; }
        .data-table td { font-size: 13px; }
        .why-box { background-color: #f8fafc; border-left: 5px solid #0284c7; padding: 10px 14px; margin-bottom: 8px; border-radius: 2px; }
        .why-title { font-weight: bold; color: #0369a1; font-size: 12px; }
        .why-desc { font-size: 13px; color: #1e293b; margin-top: 2px; }
        .root-cause { background-color: #fef2f2; border-left: 5px solid #ef4444; }
        .root-cause .why-title { color: #991b1b; }
      </style>
    </head>
    <body>
      ${buildReportWordSectionHtml(report, resolvedPhotoUrls)}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword'
  });
  saveAs(blob, `${getReportIdentifier(report)}_${report.equipmentCode}_Report.doc`);
};

/**
 * Batch Word Document Export
 * Concatenates all reports for a shutdown with page breaks and header bars
 */
export const exportBatchToWord = async (reports: MaintenanceReport[], shutdownName: string): Promise<void> => {
  if (!reports || reports.length === 0) return;

  const wordHeader = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Shutdown Maintenance Batch - ${shutdownName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
        h1 { color: #0f172a; font-size: 20px; margin: 0; padding: 0; }
        h2 { color: #0369a1; font-size: 15px; margin-top: 20px; margin-bottom: 10px; border-left: 4px solid #0284c7; padding-left: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .meta-table td { padding: 6px 10px; border: 1px solid #cbd5e1; }
        .meta-label { background-color: #f1f5f9; font-weight: bold; width: 25%; color: #334155; }
        .data-table th { background-color: #0284c7; color: #ffffff; padding: 8px; text-align: left; border: 1px solid #0284c7; font-size: 12px; }
        .data-table td { font-size: 12px; }
        .why-box { background-color: #f8fafc; border-left: 5px solid #0284c7; padding: 8px 12px; margin-bottom: 6px; border-radius: 2px; }
        .why-title { font-weight: bold; color: #0369a1; font-size: 12px; }
        .why-desc { font-size: 12px; color: #1e293b; margin-top: 2px; }
        .root-cause { background-color: #fef2f2; border-left: 5px solid #ef4444; }
        .root-cause .why-title { color: #991b1b; }
        .batch-report-divider { page-break-before: always; margin-top: 30px; border-top: 2px dashed #94a3b8; padding-top: 20px; }
        .report-header-banner { background-color: #0284c7; color: white; padding: 10px 14px; font-weight: bold; font-size: 13px; margin-bottom: 12px; border-radius: 4px; }
      </style>
    </head>
    <body>
  `;

  const sectionsHtmlArray: string[] = [];
  for (let idx = 0; idx < reports.length; idx++) {
    const report = reports[idx];
    const resolvedPhotoUrls = await Promise.all(
      (report.photos || []).map((ph) => (ph.url ? photoUrlToDataUri(ph.url) : Promise.resolve(null)))
    );
    const headerBanner = `<div class="report-header-banner">REPORT ${idx + 1} OF ${reports.length}: ${getReportIdentifier(report)} — ${report.equipmentName} (${report.equipmentCode})</div>`;
    const reportContent = buildReportWordSectionHtml(report, resolvedPhotoUrls);
    if (idx === 0) {
      sectionsHtmlArray.push(`${headerBanner}${reportContent}`);
    } else {
      sectionsHtmlArray.push(`<div class="batch-report-divider">${headerBanner}${reportContent}</div>`);
    }
  }

  const fullWordHtml = `${wordHeader}${sectionsHtmlArray.join('')}</body></html>`;

  const blob = new Blob(['\ufeff', fullWordHtml], {
    type: 'application/msword'
  });
  const cleanName = (shutdownName || 'General').replace(/\s+/g, '_');
  const filename = `Shutdown_${cleanName}_Batch.docx`;
  saveAs(blob, filename);
};

/**
 * 4. CSV Export of Report History (Part Q)
 * Exports a flat CSV file for all provided reports with properly quoted/escaped values
 */
export const exportReportsToCSV = (reports: MaintenanceReport[]): void => {
  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Report Number',
    'Date',
    'Shutdown',
    'Equipment Name',
    'Equipment Code',
    'Location',
    'Failure Type',
    'Technician',
    'Status',
    'Root Cause (5-Why #5)',
    'Total Spare Parts Cost',
    'Notes'
  ];

  const rows = reports.map((r) => {
    const totalCost = r.spareParts.reduce((sum, sp) => sum + sp.quantity * sp.unitCost, 0);
    return [
      escapeCSV(getReportIdentifier(r)),
      escapeCSV(r.date),
      escapeCSV(r.shutdownName || ''),
      escapeCSV(r.equipmentName || ''),
      escapeCSV(r.equipmentCode || ''),
      escapeCSV(r.location || ''),
      escapeCSV(r.failureType || ''),
      escapeCSV(r.technicianName || ''),
      escapeCSV(r.status || ''),
      escapeCSV(r.fiveWhy?.why5 || ''),
      escapeCSV(totalCost.toFixed(2)),
      escapeCSV(r.notes || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `QSF_Report_History_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, filename);
};
