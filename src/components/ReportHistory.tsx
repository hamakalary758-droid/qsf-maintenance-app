import React, { useState, useMemo } from 'react';
import { MaintenanceReport } from '../types';
import { FAILURE_TYPES } from '../constants/failureTypes';
import { EQUIPMENT_TEMPLATES, EquipmentTemplate } from '../constants/equipmentTemplates';
import { Search, Filter, Calendar, MapPin, Wrench, FileSpreadsheet, FileText, FileBox, Archive, Eye, Plus, RotateCcw, AlertTriangle, Copy, Download, ArchiveRestore, X, CheckCircle2 } from 'lucide-react';
import { exportReportToExcel, exportReportToPDF, exportReportToWord, exportBatchToExcel, exportBatchToWord, exportReportsToCSV } from '../utils/exports';

interface ReportHistoryProps {
  reports: MaintenanceReport[];
  isLoading?: boolean;
  onSelectReport: (report: MaintenanceReport) => void;
  onArchiveReport: (id: string, reason?: string) => void;
  onUnarchiveReport?: (id: string) => void;
  onNewReport: () => void;
  onDuplicateReport: (report: MaintenanceReport) => void;
  onNewReportFromTemplate: (template: EquipmentTemplate) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports,
  isLoading = false,
  onSelectReport,
  onArchiveReport,
  onUnarchiveReport,
  onNewReport,
  onDuplicateReport,
  onNewReportFromTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFailureType, setSelectedFailureType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedShutdown, setSelectedShutdown] = useState<string>('');
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');

  // Archive modal state
  const [reportToArchive, setReportToArchive] = useState<MaintenanceReport | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');

  const activeReports = useMemo(() => reports.filter((r) => !r.isArchived), [reports]);
  const archivedReports = useMemo(() => reports.filter((r) => Boolean(r.isArchived)), [reports]);

  const targetList = viewTab === 'active' ? activeReports : archivedReports;

  const filteredReports = targetList.filter((r) => {
    const term = searchTerm.toLowerCase().trim();

    const fiveWhyText = r.fiveWhy
      ? [r.fiveWhy.why1, r.fiveWhy.why2, r.fiveWhy.why3, r.fiveWhy.why4, r.fiveWhy.why5].filter(Boolean).join(' ')
      : '';

    const fiveWOneHText = r.fiveWOneH
      ? [r.fiveWOneH.what, r.fiveWOneH.when, r.fiveWOneH.where, r.fiveWOneH.who, r.fiveWOneH.which, r.fiveWOneH.how].filter(Boolean).join(' ')
      : '';

    const combinedAnalysisText = `${fiveWhyText} ${fiveWOneHText}`.toLowerCase();

    const matchesSearch =
      !term ||
      r.title.toLowerCase().includes(term) ||
      r.equipmentName.toLowerCase().includes(term) ||
      r.equipmentCode.toLowerCase().includes(term) ||
      r.reportNumber.toLowerCase().includes(term) ||
      r.technicianName.toLowerCase().includes(term) ||
      r.location.toLowerCase().includes(term) ||
      (r.notes ? r.notes.toLowerCase().includes(term) : false) ||
      combinedAnalysisText.includes(term);

    const matchesType = selectedFailureType === 'ALL' || r.failureType === selectedFailureType;

    const matchesDate =
      (!dateFrom || r.date >= dateFrom) &&
      (!dateTo || r.date <= dateTo);

    return matchesSearch && matchesType && matchesDate;
  });

  const distinctShutdowns = useMemo(() => {
    const names = Array.from(new Set(targetList.map((r) => r.shutdownName?.trim()).filter(Boolean) as string[]));
    return names;
  }, [targetList]);

  const activeShutdown = selectedShutdown && distinctShutdowns.includes(selectedShutdown)
    ? selectedShutdown
    : distinctShutdowns[0] || '';

  const shutdownReports = targetList.filter((r) => (r.shutdownName?.trim() || '') === activeShutdown);

  const confirmArchive = () => {
    if (reportToArchive) {
      onArchiveReport(reportToArchive.id, archiveReason.trim() || undefined);
      setReportToArchive(null);
      setArchiveReason('');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Archive Confirmation Modal */}
      {reportToArchive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel-solid)] border border-[var(--panel-border)] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[var(--text-0)]">
                  Archive Maintenance Report?
                </h3>
                <p className="text-xs text-[var(--text-2)] mt-1">
                  Report <strong className="text-[var(--text-0)]">{reportToArchive.reportNumber || reportToArchive.equipmentName}</strong> will be moved to the archive and hidden from active views.
                </p>
                <p className="text-[11px] text-[var(--text-2)] mt-1">
                  All photos, markups, and root cause analyses are preserved safely. You can restore it anytime.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-1)]">
                Archive Reason (Optional)
              </label>
              <input
                type="text"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Superseded by final overhaul, test draft, duplicate"
                className="w-full text-xs p-2 rounded-lg border border-[var(--panel-border)] bg-[var(--bg-1)] text-[var(--text-0)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--panel-border)]">
              <button
                type="button"
                onClick={() => {
                  setReportToArchive(null);
                  setArchiveReason('');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--bg-2)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmArchive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-[var(--panel-solid)] text-[var(--text-0)] rounded-xl p-5 border border-[var(--panel-border)] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-wider">Step 18: Historical Archive</span>
            <h2 className="text-xl font-bold text-[var(--text-0)]">Plant Shutdown Maintenance Reports</h2>
            <p className="text-xs text-[var(--text-1)] mt-0.5">
              Access, inspect, edit, duplicate, or re-export past plant shutdown reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Part Q: CSV Export of Filtered Reports */}
            <button
              onClick={() => exportReportsToCSV(filteredReports)}
              disabled={filteredReports.length === 0}
              className="p-2 bg-[var(--bg-2)] hover:bg-[var(--panel-border-strong)] disabled:opacity-50 text-[var(--text-1)] hover:text-[var(--text-0)] border border-[var(--panel-border)] rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-semibold"
              title={`Export ${filteredReports.length} filtered report(s) to CSV`}
            >
              <Download className="w-4 h-4 text-[var(--accent)]" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>

            {/* Part O: Quick Start Template Dropdown */}
            <div className="flex items-center">
              <select
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || val === '__blank__') {
                    onNewReport();
                  } else {
                    const template = EQUIPMENT_TEMPLATES.find((t) => t.id === val);
                    if (template) {
                      onNewReportFromTemplate(template);
                    } else {
                      onNewReport();
                    }
                  }
                  e.target.value = '';
                }}
                className="bg-[var(--bg-2)] hover:bg-[var(--panel-border-strong)] border border-[var(--panel-border)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] font-medium cursor-pointer"
                title="Start a new report from a template or blank draft"
              >
                <option value="" disabled hidden>Quick Start...</option>
                <option value="__blank__">Blank Report</option>
                {EQUIPMENT_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onNewReport}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-bold text-xs rounded-lg shadow-md transition-transform active:scale-95 flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Report</span>
            </button>
          </div>
        </div>

        {/* View Tabs: Active vs Archived */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[var(--panel-border)] text-xs">
          <button
            type="button"
            onClick={() => setViewTab('active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewTab === 'active'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-2)]'
            }`}
          >
            <span>Active Reports</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              viewTab === 'active' ? 'bg-[var(--panel-solid)] text-[var(--accent)]' : 'bg-[var(--bg-2)] text-[var(--text-2)]'
            }`}>
              {activeReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('archived')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewTab === 'archived'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-2)]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              viewTab === 'archived' ? 'bg-[var(--panel-solid)] text-amber-300' : 'bg-[var(--bg-2)] text-[var(--text-2)]'
            }`}>
              {archivedReports.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-3 border-t border-[var(--panel-border)]">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-[var(--text-2)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment, tag, technician, location, notes, or report #..."
              className="w-full bg-[var(--bg-2)] border border-[var(--panel-border)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--text-0)] placeholder-[var(--text-2)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <select
              value={selectedFailureType}
              onChange={(e) => setSelectedFailureType(e.target.value)}
              className="w-full bg-[var(--bg-2)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-0)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="ALL">All Failure Classifications</option>
              {FAILURE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-[var(--bg-2)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-0)] focus:outline-none focus:border-[var(--accent)]"
              title="From date (inclusive)"
              placeholder="From Date"
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-[var(--bg-2)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-0)] focus:outline-none focus:border-[var(--accent)]"
              title="To date (inclusive)"
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      {/* Batch Export by Shutdown Section */}
      {distinctShutdowns.length > 0 && (
        <div className="bg-[var(--panel-solid)] border border-[var(--panel-border)] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[var(--accent-dim)] text-[var(--accent)] rounded-xl border border-[var(--accent)]/30">
              <FileBox className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-0)]">
                Export Batch by Shutdown Event
              </h3>
              <p className="text-[11px] text-[var(--text-2)]">
                Bundle all {shutdownReports.length} report(s) from this shutdown into a single consolidated file
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={activeShutdown}
              onChange={(e) => setSelectedShutdown(e.target.value)}
              className="bg-[var(--bg-2)] border border-[var(--panel-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-0)] font-medium focus:outline-none focus:border-[var(--accent)] max-w-[200px] truncate"
            >
              {distinctShutdowns.map((name) => (
                <option key={name} value={name}>
                  {name} ({reports.filter((r) => (r.shutdownName?.trim() || '') === name).length} reports)
                </option>
              ))}
            </select>

            <button
              onClick={async () => {
                if (!activeShutdown || shutdownReports.length === 0) return;
                setIsBatchExporting(true);
                try {
                  await exportBatchToExcel(shutdownReports, activeShutdown);
                } finally {
                  setIsBatchExporting(false);
                }
              }}
              disabled={isBatchExporting || shutdownReports.length === 0}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              title="Export all reports for this shutdown to a single multi-sheet Excel file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Batch (Excel)</span>
            </button>

            <button
              onClick={async () => {
                if (!activeShutdown || shutdownReports.length === 0) return;
                setIsBatchExporting(true);
                try {
                  await exportBatchToWord(shutdownReports, activeShutdown);
                } finally {
                  setIsBatchExporting(false);
                }
              }}
              disabled={isBatchExporting || shutdownReports.length === 0}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              title="Export all reports for this shutdown to a single concatenated Word document"
            >
              <FileBox className="w-3.5 h-3.5" />
              <span>Export Batch (Word)</span>
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="bg-[var(--panel-solid)] border border-[var(--panel-border)] rounded-2xl p-10 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-2)] font-medium">Loading reports from database...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-[var(--panel-solid)] border border-[var(--panel-border)] rounded-2xl p-10 text-center space-y-3">
          <Wrench className="w-10 h-10 text-[var(--text-2)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-0)]">No Matching Reports Found</h3>
          <p className="text-xs text-[var(--text-2)] max-w-sm mx-auto">
            No reports match your current search criteria. Clear filters or create a new shutdown maintenance report.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedFailureType('ALL');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-3 py-1.5 bg-[var(--bg-2)] hover:bg-[var(--panel-border-strong)] text-[var(--text-1)] font-semibold text-xs rounded-lg"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((r) => (
            <div
              key={r.id}
              className="bg-[var(--panel-solid)] border border-[var(--panel-border)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              {/* Left Column: Report Meta */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                    r.reportNumber
                      ? 'bg-[var(--bg-2)] text-[var(--text-0)] border-[var(--panel-border)]'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}>
                    {r.reportNumber || 'Pending Assignment'}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full border border-amber-200">
                    {r.failureType}
                  </span>
                  {r.isArchived && (
                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded-full border border-rose-200 dark:border-rose-800 flex items-center space-x-1">
                      <Archive className="w-2.5 h-2.5" />
                      <span>Archived {r.archivedAt ? `(${new Date(r.archivedAt).toLocaleDateString()})` : ''}</span>
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-2)] font-mono">
                    <Calendar className="w-3 h-3 inline mr-0.5 text-[var(--text-2)]" />
                    {r.date}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[var(--text-0)] group-hover:text-[var(--accent)] transition-colors">
                  {r.title || r.equipmentName}
                </h3>

                {r.isArchived && r.archiveReason && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800 font-medium">
                    <strong>Archive Reason:</strong> {r.archiveReason}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-2)]">
                  <span className="flex items-center">
                    <Wrench className="w-3.5 h-3.5 mr-1 text-[var(--text-2)]" />
                    {r.equipmentName} ({r.equipmentCode})
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[var(--text-2)]" />
                    {r.location}
                  </span>
                  <span className="text-[var(--text-2)]">Tech: <strong className="text-[var(--text-1)]">{r.technicianName}</strong></span>
                </div>

                {r.fiveWhy?.why5 && (
                  <p className="text-[11px] text-rose-700 bg-rose-50/60 p-1.5 rounded border border-rose-100 font-medium">
                    <strong className="text-rose-800">Root Cause:</strong> {r.fiveWhy.why5}
                  </p>
                )}
              </div>

              {/* Right Column: Actions & Exports */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--panel-border)] gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onSelectReport(r)}
                    className="py-1.5 px-3 bg-[var(--accent-2)] hover:bg-[var(--accent)] text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Edit</span>
                  </button>

                  <button
                    onClick={() => onDuplicateReport(r)}
                    className="p-1.5 text-[var(--text-2)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] rounded-lg transition-colors cursor-pointer"
                    title="Duplicate report (prefills equipment, location, and shutdown into new draft)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {r.isArchived ? (
                    onUnarchiveReport && (
                      <button
                        onClick={() => onUnarchiveReport(r.id)}
                        className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
                        title="Restore / Unarchive report"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => setReportToArchive(r)}
                      className="p-1.5 text-[var(--text-2)] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Archive report (soft-delete)"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Direct File Export Pills */}
                <div className="flex items-center space-x-1 pt-1">
                  <button
                    onClick={() => { void exportReportToExcel(r); }}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 transition-colors cursor-pointer"
                    title="Export to Excel spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => exportReportToWord(r)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-colors cursor-pointer"
                    title="Export to Word document"
                  >
                    <FileBox className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectReport(r)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded border border-rose-200 transition-colors flex items-center space-x-0.5 cursor-pointer"
                    title="Open PDF Review & Export"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[9px]">PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

