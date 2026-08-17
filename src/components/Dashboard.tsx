import React, { useMemo } from 'react';
import { MaintenanceReport } from '../types';
import { BarChart3, Wrench, AlertCircle, Repeat } from 'lucide-react';

interface DashboardProps {
  reports: MaintenanceReport[];
}

export const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  const stats = useMemo(() => {
    const total = reports.length;

    const byFailureType = new Map<string, number>();
    const byEquipment = new Map<string, number>();
    const byShutdown = new Map<string, number>();

    for (const r of reports) {
      byFailureType.set(r.failureType, (byFailureType.get(r.failureType) || 0) + 1);
      const equipKey = `${r.equipmentName} (${r.equipmentCode})`;
      byEquipment.set(equipKey, (byEquipment.get(equipKey) || 0) + 1);
      if (r.shutdownName) {
        byShutdown.set(r.shutdownName, (byShutdown.get(r.shutdownName) || 0) + 1);
      }
    }

    const topFailureTypes = [...byFailureType.entries()].sort((a, b) => b[1] - a[1]);
    const repeatEquipment = [...byEquipment.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
    const byShutdownSorted = [...byShutdown.entries()].sort((a, b) => b[1] - a[1]);

    return { total, topFailureTypes, repeatEquipment, byShutdownSorted };
  }, [reports]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          Maintenance Dashboard
        </h2>
        <p className="text-xs text-slate-300 mt-0.5">Summary across all {stats.total} report(s) in history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Reports</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Most Common Failure Type</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {stats.topFailureTypes[0]?.[0] || '—'}
          </p>
          <p className="text-xs text-slate-400">{stats.topFailureTypes[0]?.[1] || 0} occurrence(s)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Equipment With Repeat Issues</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.repeatEquipment.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500" /> Failure Types Breakdown
        </h3>
        <div className="space-y-1.5">
          {stats.topFailureTypes.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300">{type}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{count}</span>
            </div>
          ))}
          {stats.topFailureTypes.length === 0 && (
            <p className="text-xs text-slate-400">No reports yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-3">
          <Repeat className="w-4 h-4 text-rose-500" /> Equipment With Repeat Issues
        </h3>
        <div className="space-y-1.5">
          {stats.repeatEquipment.map(([equip, count]) => (
            <div key={equip} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-400" /> {equip}
              </span>
              <span className="font-bold text-rose-600">{count} reports</span>
            </div>
          ))}
          {stats.repeatEquipment.length === 0 && (
            <p className="text-xs text-slate-400">No equipment has more than one report yet.</p>
          )}
        </div>
      </div>

      {stats.byShutdownSorted.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Reports Per Shutdown</h3>
          <div className="space-y-1.5">
            {stats.byShutdownSorted.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">{name}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
