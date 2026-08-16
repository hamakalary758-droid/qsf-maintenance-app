import React, { useState } from 'react';
import { MaintenanceReport } from '../types';
import { Search, Filter, Calendar, MapPin, Wrench, FileSpreadsheet, FileText, FileBox, Trash2, Eye, Plus, RotateCcw, AlertTriangle } from 'lucide-react';
import { exportReportToExcel, exportReportToPDF, exportReportToWord } from '../utils/exports';

interface ReportHistoryProps {
  reports: MaintenanceReport[];
  isLoading?: boolean;
  onSelectReport: (report: MaintenanceReport) => void;
  onDeleteReport: (id: string) => void;
  onNewReport: () => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports,
  isLoading = false,
  onSelectReport,
  onDeleteReport,
  onNewReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFailureType, setSelectedFailureType] = useState('ALL');

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedFailureType === 'ALL' || r.failureType === selectedFailureType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Step 18: Historical Archive</span>
            <h2 className="text-xl font-bold text-white">Past Shutdown Maintenance Reports</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Access, inspect, edit, or re-export any past plant shutdown report.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onNewReport}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-transform active:scale-95 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Report</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment, tag, technician, location, or report #..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <select
              value={selectedFailureType}
              onChange={(e) => setSelectedFailureType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Failure Classifications</option>
              <option value="Mechanical Failure">Mechanical Failure</option>
              <option value="Electrical Fault">Electrical Fault</option>
              <option value="Hydraulic Leak / Pressure">Hydraulic Leak / Pressure</option>
              <option value="Pneumatic Issue">Pneumatic Issue</option>
              <option value="Wear & Tear">Wear & Tear</option>
              <option value="Instrumentation / Sensor">Instrumentation / Sensor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading reports from database...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Matching Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No reports match your current search criteria. Clear filters or create a new shutdown maintenance report.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedFailureType('ALL');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              {/* Left Column: Report Meta */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {r.reportNumber}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full border border-amber-200">
                    {r.failureType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3 h-3 inline mr-0.5 text-slate-400" />
                    {r.date}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                  {r.title || r.equipmentName}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center">
                    <Wrench className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {r.equipmentName} ({r.equipmentCode})
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {r.location}
                  </span>
                  <span className="text-slate-400">Tech: <strong>{r.technicianName}</strong></span>
                </div>

                {r.fiveWhy?.why5 && (
                  <p className="text-[11px] text-rose-700 bg-rose-50/60 p-1.5 rounded border border-rose-100 font-medium">
                    <strong className="text-rose-800">Root Cause:</strong> {r.fiveWhy.why5}
                  </p>
                )}
              </div>

              {/* Right Column: Actions & Exports */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onSelectReport(r)}
                    className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteReport(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct File Export Pills */}
                <div className="flex items-center space-x-1 pt-1">
                  <button
                    onClick={() => exportReportToExcel(r)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 transition-colors"
                    title="Export to Excel spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => exportReportToWord(r)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-colors"
                    title="Export to Word document"
                  >
                    <FileBox className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectReport(r)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded border border-rose-200 transition-colors flex items-center space-x-0.5"
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
