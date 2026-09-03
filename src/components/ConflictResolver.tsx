import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Cloud,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  FileText,
  Calendar,
  Wrench,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock
} from 'lucide-react';
import { ConflictRecord } from '../offline/db';
import { MaintenanceReport } from '../types';
import {
  getConflicts,
  resolveConflictKeepMine,
  resolveConflictKeepServer
} from '../offline/syncQueue';

interface ConflictResolverProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  isOpen,
  onClose,
  onResolved
}) => {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [inspectedReport, setInspectedReport] = useState<{
    type: 'local' | 'server';
    data: MaintenanceReport;
  } | null>(null);

  const loadConflicts = async () => {
    setIsLoading(true);
    try {
      const list = await getConflicts();
      setConflicts(list);
    } catch (err) {
      // Silently ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConflicts();
    }
  }, [isOpen]);

  const handleKeepMine = async (localId: string) => {
    setResolvingId(localId);
    try {
      await resolveConflictKeepMine(localId);
      setResolutionSuccess('Applied local version. Sync queued to update cloud database.');
      await loadConflicts();
      if (onResolved) onResolved();
      setTimeout(() => setResolutionSuccess(null), 4000);
    } catch (err: any) {
      // Silently ignore
    } finally {
      setResolvingId(null);
    }
  };

  const handleKeepServer = async (localId: string) => {
    setResolvingId(localId);
    try {
      await resolveConflictKeepServer(localId);
      setResolutionSuccess('Adopted cloud server version. Local report updated.');
      await loadConflicts();
      if (onResolved) onResolved();
      setTimeout(() => setResolutionSuccess(null), 4000);
    } catch (err: any) {
      // Silently ignore
    } finally {
      setResolvingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Sync Conflict Resolution
                {conflicts.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-amber-500 text-white">
                    {conflicts.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Changes were made on another device or session while you were offline. Choose which version to keep.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close conflict resolver"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Success Alert */}
        {resolutionSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resolutionSuccess}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Checking sync conflict records...</span>
            </div>
          ) : conflicts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Conflicts Detected
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                All of your reports are in sync with the cloud database. There are no outstanding version mismatches.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Back to Reports
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {conflicts.map((conflict) => {
                const local = conflict.localData;
                const server = conflict.serverData;
                const isResolving = resolvingId === conflict.localId;
                const isExpanded = expandedDetailsId === conflict.localId;

                const localUpdated = local.updatedAt ? new Date(local.updatedAt).toLocaleString() : 'Unknown';
                const serverUpdated = server.updatedAt ? new Date(server.updatedAt).toLocaleString() : 'Unknown';
                const detectedAt = conflict.detectedAt ? new Date(conflict.detectedAt).toLocaleString() : 'Just now';

                return (
                  <div
                    key={conflict.localId}
                    className="border border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
                  >
                    {/* Report Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                            {local.reportNumber || server.reportNumber || 'Unassigned #'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {local.title || server.title || 'Untitled Maintenance Report'}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {local.equipmentName || server.equipmentName || 'Equipment'} ({local.equipmentCode || server.equipmentCode || 'N/A'})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Conflict Detected: {detectedAt}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedDetailsId(isExpanded ? null : conflict.localId)}
                        className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Differences' : 'Compare Differences'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Side-by-Side Version Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Local Device Version */}
                      <div className="bg-white dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400">
                              <HardDrive className="w-4 h-4" />
                              <span className="text-xs font-extrabold uppercase tracking-wider">
                                Your Local Version
                              </span>
                            </div>
                            <span className="text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                              v{local.version || 1} (Local)
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                              Last edited locally: <strong className="text-slate-700 dark:text-slate-200">{localUpdated}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[11px]">Status:</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{local.status || 'Draft'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[11px]">Failure Type:</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{local.failureType}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[11px]">Technician:</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{local.technicianName || 'N/A'}</span>
                            </div>
                            {local.notes && (
                              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 italic">
                                "{local.notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setInspectedReport({ type: 'local', data: local })}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Inspect full local report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeepMine(conflict.localId)}
                            disabled={isResolving}
                            className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            {isResolving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Keep My Version</span>
                          </button>
                        </div>
                      </div>

                      {/* Cloud Server Version */}
                      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                              <Cloud className="w-4 h-4" />
                              <span className="text-xs font-extrabold uppercase tracking-wider">
                                Cloud Server Version
                              </span>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              v{server.version || 1} (Server)
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                              Saved to cloud: <strong className="text-slate-700 dark:text-slate-200">{serverUpdated}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[11px]">Status:</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{server.status || 'Draft'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[11px]">Failure Type:</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{server.failureType}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[11px]">Technician:</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{server.technicianName || 'N/A'}</span>
                            </div>
                            {server.notes && (
                              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 italic">
                                "{server.notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setInspectedReport({ type: 'server', data: server })}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Inspect full server report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeepServer(conflict.localId)}
                            disabled={isResolving}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            {isResolving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Keep Server Version</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Detailed Comparison Table (Collapsible) */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-800/40 space-y-3">
                        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Field-by-Field Comparison
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 w-1/4">Field</th>
                                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 w-3/8 text-sky-700 dark:text-sky-400">Your Local Data</th>
                                <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 w-3/8 text-emerald-700 dark:text-emerald-400">Server Cloud Data</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              <tr>
                                <td className="p-2.5 font-semibold text-slate-500">Report Title</td>
                                <td className={`p-2.5 ${local.title !== server.title ? 'bg-amber-100/50 dark:bg-amber-950/40 font-bold' : ''}`}>
                                  {local.title || '(empty)'}
                                </td>
                                <td className={`p-2.5 ${local.title !== server.title ? 'bg-amber-100/50 dark:bg-amber-950/40 font-bold' : ''}`}>
                                  {server.title || '(empty)'}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-semibold text-slate-500">Shutdown / Unit</td>
                                <td className={`p-2.5 ${local.shutdownName !== server.shutdownName ? 'bg-amber-100/50 dark:bg-amber-950/40 font-bold' : ''}`}>
                                  {local.shutdownName || '(empty)'}
                                </td>
                                <td className={`p-2.5 ${local.shutdownName !== server.shutdownName ? 'bg-amber-100/50 dark:bg-amber-950/40 font-bold' : ''}`}>
                                  {server.shutdownName || '(empty)'}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-semibold text-slate-500">5-Why Root Cause</td>
                                <td className={`p-2.5 ${local.fiveWhy?.why5 !== server.fiveWhy?.why5 ? 'bg-amber-100/50 dark:bg-amber-950/40 font-bold' : ''}`}>
                                  {local.fiveWhy?.why5 || local.fiveWhy?.why1 || '(empty)'}
                                </td>
                                <td className={`p-2.5 ${local.fiveWhy?.why5 !== server.fiveWhy?.why5 ? 'bg-amber-100/50 dark:bg-amber-950/40 font-bold' : ''}`}>
                                  {server.fiveWhy?.why5 || server.fiveWhy?.why1 || '(empty)'}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-semibold text-slate-500">Corrective Actions</td>
                                <td className="p-2.5">
                                  {local.correctiveActions?.length || 0} action(s) defined
                                </td>
                                <td className="p-2.5">
                                  {server.correctiveActions?.length || 0} action(s) defined
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-semibold text-slate-500">Spare Parts</td>
                                <td className="p-2.5">
                                  {local.spareParts?.length || 0} part(s) listed
                                </td>
                                <td className="p-2.5">
                                  {server.spareParts?.length || 0} part(s) listed
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Resolving will immediately update your database and sync queues.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full Report Inspection Sub-Modal */}
      {inspectedReport && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setInspectedReport(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {inspectedReport.type === 'local' ? 'Local Device' : 'Server Cloud'} Report Inspection
                </h3>
              </div>
              <button
                onClick={() => setInspectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <strong className="block text-slate-400 text-[10px] uppercase">Title</strong>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{inspectedReport.data.title || 'Untitled'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="block text-slate-400 text-[10px] uppercase">Equipment</strong>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{inspectedReport.data.equipmentName} ({inspectedReport.data.equipmentCode})</p>
                </div>
                <div>
                  <strong className="block text-slate-400 text-[10px] uppercase">Technician</strong>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{inspectedReport.data.technicianName || 'N/A'}</p>
                </div>
              </div>
              <div>
                <strong className="block text-slate-400 text-[10px] uppercase">5-Why Analysis</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 mt-1">
                  {inspectedReport.data.fiveWhy?.why1 && <li>Why 1: {inspectedReport.data.fiveWhy.why1}</li>}
                  {inspectedReport.data.fiveWhy?.why2 && <li>Why 2: {inspectedReport.data.fiveWhy.why2}</li>}
                  {inspectedReport.data.fiveWhy?.why3 && <li>Why 3: {inspectedReport.data.fiveWhy.why3}</li>}
                  {inspectedReport.data.fiveWhy?.why4 && <li>Why 4: {inspectedReport.data.fiveWhy.why4}</li>}
                  {inspectedReport.data.fiveWhy?.why5 && <li>Root Cause: {inspectedReport.data.fiveWhy.why5}</li>}
                </ul>
              </div>
              {inspectedReport.data.notes && (
                <div>
                  <strong className="block text-slate-400 text-[10px] uppercase">Notes</strong>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{inspectedReport.data.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectedReport(null)}
                className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-700 rounded-xl text-xs font-bold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
