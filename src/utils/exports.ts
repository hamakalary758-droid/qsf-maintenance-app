import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
 * 1. Excel Export (xlsx)
 * Creates a clean spreadsheet with multiple tables: Overview, 5W+1H, 5-Why, Actions, Spare Parts
 */
export const exportReportToExcel = async (report: MaintenanceReport): Promise<void> => {
  const wb = XLSX.utils.book_new();

  // Overview Sheet
  const overviewData = [
    ['SHUTDOWN MAINTENANCE REPORT', ''],
    ['Report Number', getReportIdentifier(report)],
    ['Shutdown Event', report.shutdownName],
    ['Date', report.date],
    ['Technician Name', report.technicianName],
    ['Technician ID', report.technicianId || 'N/A'],
    ['Equipment Name', report.equipmentName],
    ['Equipment Code', report.equipmentCode],
    ['Location / Area', report.location],
    ['Failure Classification', report.failureType],
    ['Status', report.status],
    ['Created Date', new Date(report.createdAt).toLocaleString()],
    ['Last Updated', new Date(report.updatedAt).toLocaleString()],
    ['Notes', report.notes || '']
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // 5W+1H Sheet
  const fiveWData = [
    ['5W+1H ANALYSIS ASPECT', 'DETAILS'],
    ['WHAT (Problem Description)', report.fiveWOneH.what],
    ['WHEN (Timing / Shift)', report.fiveWOneH.when],
    ['WHERE (Component / Location)', report.fiveWOneH.where],
    ['WHO (Discovered / Team)', report.fiveWOneH.who],
    ['WHICH (Operating Mode / Condition)', report.fiveWOneH.which],
    ['HOW (Detection / Severity)', report.fiveWOneH.how]
  ];
  const wsFiveW = XLSX.utils.aoa_to_sheet(fiveWData);
  XLSX.utils.book_append_sheet(wb, wsFiveW, '5W1H Analysis');

  // 5-Why Root Cause Sheet
  const fiveWhyData = [
    ['WHY STEP', 'ANALYSIS / OBSERVATION'],
    ['1st Why', report.fiveWhy.why1],
    ['2nd Why', report.fiveWhy.why2],
    ['3rd Why', report.fiveWhy.why3],
    ['4th Why', report.fiveWhy.why4],
    ['5th Why (Root Cause)', report.fiveWhy.why5]
  ];
  const wsFiveWhy = XLSX.utils.aoa_to_sheet(fiveWhyData);
  XLSX.utils.book_append_sheet(wb, wsFiveWhy, '5-Why Analysis');

  // Corrective Actions Sheet
  const actionHeaders = ['Action Description', 'Assignee', 'Priority', 'Status', 'Target Date'];
  const actionRows = report.correctiveActions.map((ca) => [
    ca.action,
    ca.assignee,
    ca.priority,
    ca.status,
    ca.targetDate
  ]);
  const wsActions = XLSX.utils.aoa_to_sheet([actionHeaders, ...actionRows]);
  XLSX.utils.book_append_sheet(wb, wsActions, 'Corrective Actions');

  // Spare Parts Sheet
  const partHeaders = ['Part Name', 'Part Number', 'Quantity', 'Unit Cost ($)', 'Total Cost ($)', 'Status'];
  const partRows = report.spareParts.map((sp) => [
    sp.partName,
    sp.partNumber,
    sp.quantity,
    sp.unitCost,
    sp.quantity * sp.unitCost,
    sp.status
  ]);
  const totalCost = report.spareParts.reduce((sum, sp) => sum + sp.quantity * sp.unitCost, 0);
  partRows.push(['TOTAL SPARE PARTS COST', '', '', '', totalCost, '']);

  const wsParts = XLSX.utils.aoa_to_sheet([partHeaders, ...partRows]);
  XLSX.utils.book_append_sheet(wb, wsParts, 'Spare Parts');

  // Attached Photos Sheet
  if (report.photos && report.photos.length > 0) {
    const photoHeaders = ['Photo Index', 'Caption / Notes', 'Timestamp', 'Note'];
    const photoRows = report.photos.map((ph, idx) => [
      `Photo #${idx + 1}`,
      ph.caption || 'No caption',
      ph.timestamp || 'N/A',
      'See attached photo files exported alongside this report'
    ]);
    const wsPhotos = XLSX.utils.aoa_to_sheet([photoHeaders, ...photoRows]);
    XLSX.utils.book_append_sheet(wb, wsPhotos, 'Attached Photos');
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
  const filename = `${getReportIdentifier(report)}_${report.equipmentCode}_Report.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Builds a single-sheet 2D array representation for a report in batch Excel export
 */
export const buildReportExcelSheet = (report: MaintenanceReport): XLSX.WorkSheet => {
  const totalCost = report.spareParts.reduce((sum, sp) => sum + sp.quantity * sp.unitCost, 0);

  const rows: (string | number)[][] = [
    ['SHUTDOWN MAINTENANCE REPORT', ''],
    ['Report Number', getReportIdentifier(report)],
    ['Shutdown Event', report.shutdownName],
    ['Date', report.date],
    ['Technician Name', report.technicianName],
    ['Technician ID', report.technicianId || 'N/A'],
    ['Equipment Name', report.equipmentName],
    ['Equipment Code', report.equipmentCode],
    ['Location / Area', report.location],
    ['Failure Classification', report.failureType],
    ['Status', report.status],
    ['Created Date', new Date(report.createdAt).toLocaleString()],
    ['Last Updated', new Date(report.updatedAt).toLocaleString()],
    ['Notes', report.notes || ''],
    [],
    ['5W+1H ANALYSIS ASPECT', 'DETAILS'],
    ['WHAT (Problem Description)', report.fiveWOneH.what],
    ['WHEN (Timing / Shift)', report.fiveWOneH.when],
    ['WHERE (Component / Location)', report.fiveWOneH.where],
    ['WHO (Discovered / Team)', report.fiveWOneH.who],
    ['WHICH (Operating Mode / Condition)', report.fiveWOneH.which],
    ['HOW (Detection / Severity)', report.fiveWOneH.how],
    [],
    ['WHY STEP', 'ANALYSIS / OBSERVATION'],
    ['1st Why', report.fiveWhy.why1],
    ['2nd Why', report.fiveWhy.why2],
    ['3rd Why', report.fiveWhy.why3],
    ['4th Why', report.fiveWhy.why4],
    ['5th Why (Root Cause)', report.fiveWhy.why5],
    [],
    ['CORRECTIVE ACTIONS', '', '', '', ''],
    ['Action Description', 'Assignee', 'Priority', 'Status', 'Target Date'],
    ...report.correctiveActions.map((ca) => [
      ca.action,
      ca.assignee,
      ca.priority,
      ca.status,
      ca.targetDate
    ]),
    [],
    ['SPARE PARTS & MATERIALS', '', '', '', '', ''],
    ['Part Name', 'Part Number', 'Quantity', 'Unit Cost ($)', 'Total Cost ($)', 'Status'],
    ...report.spareParts.map((sp) => [
      sp.partName,
      sp.partNumber,
      sp.quantity,
      sp.unitCost,
      sp.quantity * sp.unitCost,
      sp.status
    ]),
    ['TOTAL SPARE PARTS COST', '', '', '', totalCost, '']
  ];

  if (report.photos && report.photos.length > 0) {
    rows.push([]);
    rows.push(['ATTACHED PHOTOS', '', '', '']);
    rows.push(['Photo Index', 'Caption / Notes', 'Timestamp', 'Note']);
    report.photos.forEach((ph, idx) => {
      rows.push([
        `Photo #${idx + 1}`,
        ph.caption || 'No caption',
        ph.timestamp || 'N/A',
        'See attached photo files exported alongside this report'
      ]);
    });
  }

  return XLSX.utils.aoa_to_sheet(rows);
};

/**
 * Batch Excel Export
 * Combines all reports for a shutdown into a single workbook (one sheet per report)
 */
export const exportBatchToExcel = async (reports: MaintenanceReport[], shutdownName: string): Promise<void> => {
  if (!reports || reports.length === 0) return;
  const wb = XLSX.utils.book_new();
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

    const ws = buildReportExcelSheet(r);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
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
  XLSX.writeFile(wb, filename);
};

/**
 * 2. PDF Export (jspdf & html2canvas)
 * Renders report with section-aware pagination, proper page breaks, and photo scaling
 */
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

    // Color sanitizer for Tailwind OKLCH/P3 values
    const sanitizeColorsInClone = (clonedDoc: Document, clonedElement: HTMLElement) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 1;
      tempCanvas.height = 1;
      const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

      const colorToRgb = (colorStr: string): string => {
        if (!ctx || !colorStr) return 'rgb(0,0,0)';
        try {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = '#000000';
          ctx.fillStyle = colorStr;
          ctx.fillRect(0, 0, 1, 1);
          const data = ctx.getImageData(0, 0, 1, 1).data;
          const r = data[0];
          const g = data[1];
          const b = data[2];
          const a = (data[3] / 255).toFixed(2);
          return data[3] === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
        } catch {
          return 'rgb(0,0,0)';
        }
      };

      const replaceUnsupportedColors = (text: string): string => {
        if (!text || typeof text !== 'string') return text;
        return text.replace(/(oklch|oklab|lab|lch|color|hwb)\([^)]+\)/gi, (match) => {
          return colorToRgb(match);
        });
      };

      // 1. Style tags
      Array.from(clonedDoc.querySelectorAll('style')).forEach((styleTag) => {
        if (styleTag.textContent && /(oklch|oklab|lab|lch|color|hwb)\(/i.test(styleTag.textContent)) {
          styleTag.textContent = replaceUnsupportedColors(styleTag.textContent);
        }
      });

      // 2. Stylesheets
      try {
        Array.from(clonedDoc.styleSheets).forEach((sheet) => {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) return;
            for (let i = rules.length - 1; i >= 0; i--) {
              const rule = rules[i];
              if (rule.cssText && /(oklch|oklab|lab|lch|color|hwb)\(/i.test(rule.cssText)) {
                const newCssText = replaceUnsupportedColors(rule.cssText);
                try {
                  sheet.deleteRule(i);
                  sheet.insertRule(newCssText, i);
                } catch {
                  // ignore rule insertion error
                }
              }
            }
          } catch {
            // ignore cross-origin sheet
          }
        });
      } catch {
        // ignore
      }

      // 3. Computed styles on elements
      const allNodes = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))];
      const colorProps = [
        'color', 'background-color', 'border-color', 'border-top-color',
        'border-right-color', 'border-bottom-color', 'border-left-color',
        'outline-color', 'fill', 'stroke', 'box-shadow', 'text-decoration-color'
      ];

      allNodes.forEach((node) => {
        const el = node as HTMLElement;
        if (!el || !el.style) return;
        const styleAttr = el.getAttribute('style');
        if (styleAttr && /(oklch|oklab|lab|lch|color|hwb)\(/i.test(styleAttr)) {
          el.setAttribute('style', replaceUnsupportedColors(styleAttr));
        }
        try {
          const computed = clonedDoc.defaultView?.getComputedStyle(el) || window.getComputedStyle(el);
          if (computed) {
            colorProps.forEach((prop) => {
              const val = computed.getPropertyValue(prop);
              if (val && /(oklch|oklab|lab|lch|color|hwb)\(/i.test(val)) {
                el.style.setProperty(prop, replaceUnsupportedColors(val), 'important');
              }
            });
          }
        } catch {
          // ignore
        }
      });
    };

    // Grab child section blocks from the printable container
    const sectionNodes = Array.from(element.children) as HTMLElement[];

    // If there are distinct sections, render each section and budget page Y-coordinates
    if (sectionNodes.length > 0) {
      let currentY = margin;
      let isFirstPage = true;

      for (let i = 0; i < sectionNodes.length; i++) {
        const sectionEl = sectionNodes[i];
        if (!sectionEl || sectionEl.offsetHeight === 0) continue;

        const sectionCanvas = await html2canvas(sectionEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (doc, el) => sanitizeColorsInClone(doc, el)
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
      onclone: (clonedDoc, clonedElement) => sanitizeColorsInClone(clonedDoc, clonedElement)
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
 * Builds the inner HTML body for a single maintenance report in Word format
 */
export const buildReportWordSectionHtml = (report: MaintenanceReport): string => {
  const actionsHtml = report.correctiveActions
    .map(
      (a) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${a.action}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${a.assignee}</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>${a.priority}</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${a.status}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${a.targetDate}</td>
      </tr>
    `
    )
    .join('');

  const sparePartsHtml = report.spareParts
    .map(
      (p) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.partName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${p.partNumber}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${p.unitCost}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">$${p.quantity * p.unitCost}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.status}</td>
      </tr>
    `
    )
    .join('');

  const photosHtml = report.photos
    .map(
      (ph) => `
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${ph.url}" style="max-width: 500px; height: auto; border: 1px solid #cccccc; border-radius: 4px;" alt="${ph.caption}" />
        <p style="font-size: 11px; color: #555555; margin-top: 4px;"><em>${ph.caption} (${ph.timestamp})</em></p>
      </div>
    `
    )
    .join('');

  const totalSparePartsCost = report.spareParts.reduce((acc, p) => acc + p.quantity * p.unitCost, 0);

  return `
    <div style="margin-bottom: 24px;">
      <h1>PLANT SHUTDOWN MAINTENANCE REPORT</h1>
      
      <table class="meta-table">
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
export const exportReportToWord = (report: MaintenanceReport) => {
  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Shutdown Maintenance Report - ${getReportIdentifier(report)}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
        h1 { color: #0f172a; font-size: 24px; border-bottom: 3px solid #0284c7; padding-bottom: 8px; margin-bottom: 16px; }
        h2 { color: #0369a1; font-size: 16px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .meta-table td { padding: 6px 10px; border: 1px solid #cbd5e1; }
        .meta-label { background-color: #f1f5f9; font-weight: bold; width: 25%; color: #334155; }
        .data-table th { background-color: #0284c7; color: #ffffff; padding: 10px; text-align: left; border: 1px solid #0284c7; font-size: 13px; }
        .data-table td { font-size: 13px; }
        .why-box { background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 10px 14px; margin-bottom: 8px; border-radius: 2px; }
        .why-title { font-weight: bold; color: #0369a1; font-size: 12px; }
        .why-desc { font-size: 13px; color: #1e293b; margin-top: 2px; }
        .root-cause { background-color: #fef2f2; border-left: 4px solid #ef4444; }
        .root-cause .why-title { color: #991b1b; }
      </style>
    </head>
    <body>
      ${buildReportWordSectionHtml(report)}
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
        h1 { color: #0f172a; font-size: 22px; border-bottom: 3px solid #0284c7; padding-bottom: 8px; margin-bottom: 16px; }
        h2 { color: #0369a1; font-size: 15px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .meta-table td { padding: 6px 10px; border: 1px solid #cbd5e1; }
        .meta-label { background-color: #f1f5f9; font-weight: bold; width: 25%; color: #334155; }
        .data-table th { background-color: #0284c7; color: #ffffff; padding: 8px; text-align: left; border: 1px solid #0284c7; font-size: 12px; }
        .data-table td { font-size: 12px; }
        .why-box { background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 8px 12px; margin-bottom: 6px; border-radius: 2px; }
        .why-title { font-weight: bold; color: #0369a1; font-size: 12px; }
        .why-desc { font-size: 12px; color: #1e293b; margin-top: 2px; }
        .root-cause { background-color: #fef2f2; border-left: 4px solid #ef4444; }
        .root-cause .why-title { color: #991b1b; }
        .batch-report-divider { page-break-before: always; margin-top: 30px; border-top: 2px dashed #94a3b8; padding-top: 20px; }
        .report-header-banner { background-color: #0284c7; color: white; padding: 8px 12px; font-weight: bold; font-size: 14px; margin-bottom: 12px; border-radius: 4px; }
      </style>
    </head>
    <body>
  `;

  const sectionsHtml = reports
    .map((report, idx) => {
      const headerBanner = `<div class="report-header-banner">REPORT ${idx + 1} OF ${reports.length}: ${getReportIdentifier(report)} — ${report.equipmentName} (${report.equipmentCode})</div>`;
      const reportContent = buildReportWordSectionHtml(report);
      if (idx === 0) {
        return `${headerBanner}${reportContent}`;
      }
      return `<div class="batch-report-divider">${headerBanner}${reportContent}</div>`;
    })
    .join('');

  const fullWordHtml = `${wordHeader}${sectionsHtml}</body></html>`;

  const blob = new Blob(['\ufeff', fullWordHtml], {
    type: 'application/msword'
  });
  const cleanName = (shutdownName || 'General').replace(/\s+/g, '_');
  const filename = `Shutdown_${cleanName}_Batch.docx`;
  saveAs(blob, filename);
};
