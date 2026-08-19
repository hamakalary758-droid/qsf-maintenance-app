import React from 'react';
import { MaintenanceReport } from '../types';
import { ValidationError } from '../utils/validation';
import { FileCheck, Edit2, AlertTriangle, CheckCircle2, DollarSign, Camera, FileText, FileSpreadsheet, FileBox, Info, ListChecks, GitBranch, FileSignature, AlertCircle, ArrowRight } from 'lucide-react';
import { exportReportToExcel, exportReportToPDF, exportReportToWord, getReportIdentifier } from '../utils/exports';

interface ReviewScreenProps {
  reportData: Partial<MaintenanceReport>;
  validationErrors?: ValidationError[];
  onEditSection: (stepIndex: number) => void;
  onFinalize: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ reportData, validationErrors = [], onEditSection, onFinalize }) => {
  const r = reportData;
  const fiveW = r.fiveWOneH || { what: '', when: '', where: '', who: '', which: '', how: '' };
  const fiveWhy = r.fiveWhy || { why1: '', why2: '', why3: '', why4: '', why5: '' };
  const actions = r.correctiveActions || [];
  const parts = r.spareParts || [];
  const photos = r.photos || [];

  const totalPartCost = parts.reduce((acc, p) => acc + (p.quantity || 0) * (p.unitCost || 0), 0);
  const hasErrors = validationErrors.length > 0;

  const sectionStepNames: Record<number, string> = {
    0: 'Basic Info',
    1: '5W+1H Breakdown',
    2: '5-Why Analysis',
    3: 'Actions & Parts',
    4: 'Photos & Markup'
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Step 17: Pre-Commit Audit</span>
              <h2 className="text-lg font-bold text-white">Review Report Before Finalizing</h2>
            </div>
          </div>
          <button
            onClick={onFinalize}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg transition-transform active:scale-95 flex items-center space-x-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalize & Save Report</span>
          </button>
        </div>
        <p className="text-xs text-slate-300">
          Verify all maintenance facts, 5W+1H responses, root cause logic, spare parts, and photos below. Click any section&apos;s edit button to adjust inputs.
        </p>
      </div>

      {/* Validation Errors Notice (Top) */}
      {hasErrors && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-xl p-4 space-y-2.5 animate-fadeIn">
          <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <h3 className="font-bold text-xs uppercase tracking-wider">
              {validationErrors.length === 1 ? '1 Required Field Missing' : `${validationErrors.length} Required Fields Missing`}
            </h3>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Please resolve the following items before finalizing this maintenance report:
          </p>
          <div className="space-y-1.5 pt-1">
            {validationErrors.map((err, idx) => (
              <div
                key={`val-err-top-${idx}`}
                className="flex items-center justify-between bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-medium">{err.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditSection(err.stepIndex)}
                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold text-[11px] rounded-md transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <span>Fix in {sectionStepNames[err.stepIndex] || `Step ${err.stepIndex + 1}`}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="review-report-printable" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-6 shadow-sm overflow-hidden">
        
        {/* Header Block with Colored Band */}
        <div className="p-5 bg-sky-600 dark:bg-sky-800 text-white flex flex-wrap justify-between items-start gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/15 text-white text-xs font-bold rounded-full border border-white/20 shadow-xs">
              {r.reportNumber || 'Pending Assignment'}
            </span>
            <h1 className="text-xl font-extrabold text-white mt-2">
              {r.equipmentName || 'Equipment Maintenance Report'}
            </h1>
            <p className="text-xs text-sky-100 mt-0.5">{r.shutdownName || 'Shutdown Event'}</p>
          </div>

          <div className="text-right text-xs space-y-1 bg-white/10 dark:bg-black/20 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
            <div><span className="text-sky-200">Date:</span> <strong className="text-white ml-1">{r.date || 'N/A'}</strong></div>
            <div><span className="text-sky-200">Technician:</span> <strong className="text-white ml-1">{r.technicianName || 'N/A'} ({r.technicianId || 'N/A'})</strong></div>
            <div><span className="text-sky-200">Type:</span> <strong className="text-amber-300 ml-1 font-bold">{r.failureType || 'Mechanical'}</strong></div>
          </div>
        </div>

        {/* Section 1: General Info */}
        <div className="space-y-2 px-5">
          <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 p-2.5 rounded-lg border border-sky-100 dark:border-slate-700">
            <div className="flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h3 className="font-bold text-xs text-sky-900 dark:text-sky-100">1. Basic Equipment & Location Info</h3>
            </div>
            <button
              onClick={() => onEditSection(0)}
              className="text-sky-600 dark:text-sky-400 font-bold text-xs hover:underline flex items-center space-x-1 print-hide"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Section</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div><span className="text-slate-400 dark:text-slate-500 block text-[10px]">Equipment Code</span><strong className="text-slate-800 dark:text-slate-200 font-mono">{r.equipmentCode || 'N/A'}</strong></div>
            <div><span className="text-slate-400 dark:text-slate-500 block text-[10px]">Plant Area</span><strong className="text-slate-800 dark:text-slate-200">{r.location || 'N/A'}</strong></div>
            <div><span className="text-slate-400 dark:text-slate-500 block text-[10px]">Failure Classification</span><strong className="text-slate-800 dark:text-slate-200">{r.failureType || 'N/A'}</strong></div>
          </div>
        </div>

        {/* Section 2: 5W+1H */}
        <div className="space-y-2 px-5">
          <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 p-2.5 rounded-lg border border-sky-100 dark:border-slate-700">
            <div className="flex items-center space-x-1.5">
              <ListChecks className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h3 className="font-bold text-xs text-sky-900 dark:text-sky-100">2. 5W + 1H Methodical Breakdown</h3>
            </div>
            <button
              onClick={() => onEditSection(1)}
              className="text-sky-600 dark:text-sky-400 font-bold text-xs hover:underline flex items-center space-x-1 print-hide"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-sky-700 dark:text-sky-400 text-[10px] uppercase block">WHAT</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{fiveW.what || 'Not recorded'}</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-sky-700 dark:text-sky-400 text-[10px] uppercase block">WHEN</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{fiveW.when || 'Not recorded'}</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-sky-700 dark:text-sky-400 text-[10px] uppercase block">WHERE</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{fiveW.where || 'Not recorded'}</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-sky-700 dark:text-sky-400 text-[10px] uppercase block">WHO</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{fiveW.who || 'Not recorded'}</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-sky-700 dark:text-sky-400 text-[10px] uppercase block">WHICH</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{fiveW.which || 'Not recorded'}</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-sky-700 dark:text-sky-400 text-[10px] uppercase block">HOW</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{fiveW.how || 'Not recorded'}</p>
            </div>
          </div>
        </div>

        {/* Section 3: 5-Why Timeline */}
        <div className="space-y-2 px-5">
          <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 p-2.5 rounded-lg border border-sky-100 dark:border-slate-700">
            <div className="flex items-center space-x-1.5">
              <GitBranch className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h3 className="font-bold text-xs text-sky-900 dark:text-sky-100">3. 5-Why Root Cause Flow</h3>
            </div>
            <button
              onClick={() => onEditSection(2)}
              className="text-sky-600 dark:text-sky-400 font-bold text-xs hover:underline flex items-center space-x-1 print-hide"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Section</span>
            </button>
          </div>

          <div className="relative pl-6 space-y-3 pt-1 pb-1">
            {/* Connecting vertical timeline line */}
            <div className="absolute left-[9px] top-3 bottom-4 w-0.5 bg-slate-300 dark:bg-slate-600" />

            {/* Why 1 */}
            <div className="relative">
              <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="text-xs text-slate-800 dark:text-slate-200 py-1">
                <span className="font-bold text-sky-700 dark:text-sky-400 mr-2">Why #1:</span>
                <span>{fiveWhy.why1 || 'N/A'}</span>
              </div>
            </div>

            {/* Why 2 */}
            <div className="relative">
              <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="text-xs text-slate-800 dark:text-slate-200 py-1">
                <span className="font-bold text-sky-700 dark:text-sky-400 mr-2">Why #2:</span>
                <span>{fiveWhy.why2 || 'N/A'}</span>
              </div>
            </div>

            {/* Why 3 */}
            <div className="relative">
              <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="text-xs text-slate-800 dark:text-slate-200 py-1">
                <span className="font-bold text-sky-700 dark:text-sky-400 mr-2">Why #3:</span>
                <span>{fiveWhy.why3 || 'N/A'}</span>
              </div>
            </div>

            {/* Why 4 */}
            <div className="relative">
              <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="text-xs text-slate-800 dark:text-slate-200 py-1">
                <span className="font-bold text-sky-700 dark:text-sky-400 mr-2">Why #4:</span>
                <span>{fiveWhy.why4 || 'N/A'}</span>
              </div>
            </div>

            {/* Why 5 - Terminal Root Cause Node */}
            <div className="relative">
              <div className="absolute -left-[20px] top-3.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800 font-medium text-rose-900 dark:text-rose-200 text-xs">
                <span className="font-extrabold text-rose-700 dark:text-rose-400 mr-2 uppercase block sm:inline">Why #5 (Root Cause):</span>
                <span>{fiveWhy.why5 || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Actions & Parts */}
        <div className="space-y-2 px-5">
          <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 p-2.5 rounded-lg border border-sky-100 dark:border-slate-700">
            <div className="flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h3 className="font-bold text-xs text-sky-900 dark:text-sky-100">4. Actions & Spare Parts</h3>
            </div>
            <button
              onClick={() => onEditSection(3)}
              className="text-sky-600 dark:text-sky-400 font-bold text-xs hover:underline flex items-center space-x-1 print-hide"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Actions Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/50">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">Corrective Action Items</span>
              {actions.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 italic">No actions logged</p>
              ) : (
                <ul className="space-y-1.5">
                  {actions.map((a, idx) => (
                    <li key={a.id || idx} className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{a.action}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Assigned: {a.assignee}</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Spare Parts Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">Spare Parts Inventory</span>
                <span className="font-mono font-bold text-emerald-600">${totalPartCost.toFixed(2)}</span>
              </div>
              {parts.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 italic">No parts logged</p>
              ) : (
                <ul className="space-y-1.5">
                  {parts.map((p, idx) => (
                    <li key={p.id || idx} className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{p.partName}</p>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{p.partNumber} ({p.quantity}x)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${(p.quantity * p.unitCost).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Photos */}
        {photos.length > 0 && (
          <div className="space-y-2 px-5">
            <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 p-2.5 rounded-lg border border-sky-100 dark:border-slate-700">
              <div className="flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <h3 className="font-bold text-xs text-sky-900 dark:text-sky-100">5. Attached Inspection Photos & Annotations ({photos.length})</h3>
              </div>
              <button
                onClick={() => onEditSection(4)}
                className="text-sky-600 dark:text-sky-400 font-bold text-xs hover:underline flex items-center space-x-1 print-hide"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Section</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photos.map((ph, idx) => (
                <div key={ph.id || idx} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
                  <div className="bg-slate-950 p-1 flex justify-center items-center">
                    <img
                      src={ph.url}
                      alt={ph.caption || `Photo #${idx + 1}`}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-56 object-contain rounded"
                    />
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{ph.caption || `Inspection Photo #${idx + 1}`}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{ph.timestamp || 'Recorded'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 6: Sign-off & Approval */}
        <div className="space-y-2 px-5 pb-5">
          <div className="flex items-center justify-between bg-sky-50 dark:bg-slate-800 p-2.5 rounded-lg border border-sky-100 dark:border-slate-700">
            <div className="flex items-center space-x-1.5">
              <FileSignature className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h3 className="font-bold text-xs text-sky-900 dark:text-sky-100">6. Sign-off & Approval</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <div className="border-b border-slate-400 dark:border-slate-600 h-10 mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Maintenance Technician</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.technicianName || 'Technician'}</p>
            </div>
            <div>
              <div className="border-b border-slate-400 dark:border-slate-600 h-10 mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Plant Reliability Engineer</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Signature & Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Validation Errors Notice if any */}
      {hasErrors && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span><strong>{validationErrors.length} required field(s)</strong> must be resolved before finalizing. Click &apos;Fix in Section&apos; above.</span>
          </div>
        </div>
      )}

      {/* Export Bar & Finalize Action */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
        <div>
          <span className="text-xs text-sky-400 font-bold uppercase block">Ready to Commit</span>
          <p className="text-xs text-slate-300">Save to history or export instantly to Excel, PDF, or Word</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { void exportReportToExcel(r as MaintenanceReport); }}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportReportToPDF('review-report-printable', getReportIdentifier(r as MaintenanceReport))}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => { void exportReportToWord(r as MaintenanceReport); }}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
          >
            <FileBox className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>

          <button
            onClick={onFinalize}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Finalize Report &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

