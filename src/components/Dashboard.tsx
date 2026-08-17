import React, { useMemo } from 'react';
import { MaintenanceReport } from '../types';
import { BarChart3, Wrench, AlertCircle, Repeat, DollarSign } from 'lucide-react';

interface DashboardProps {
  reports: MaintenanceReport[];
}

export const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  const stats = useMemo(() => {
    const total = reports.length;

    const byFailureType = new Map<string, number>();
    const byEquipment = new Map<string, number>();
    const byShutdown = new Map<string, number>();
    let totalSpareCost = 0;
    const costByEquipmentMap = new Map<string, number>();
    const costByShutdownMap = new Map<string, number>();

    for (const r of reports) {
      byFailureType.set(r.failureType, (byFailureType.get(r.failureType) || 0) + 1);
      const equipKey = `${r.equipmentName} (${r.equipmentCode})`;
      byEquipment.set(equipKey, (byEquipment.get(equipKey) || 0) + 1);
      if (r.shutdownName) {
        byShutdown.set(r.shutdownName, (byShutdown.get(r.shutdownName) || 0) + 1);
      }

      for (const sp of r.spareParts || []) {
        const itemCost = (sp.quantity || 0) * (sp.unitCost || 0);
        totalSpareCost += itemCost;
        costByEquipmentMap.set(equipKey, (costByEquipmentMap.get(equipKey) || 0) + itemCost);
        if (r.shutdownName) {
          costByShutdownMap.set(r.shutdownName, (costByShutdownMap.get(r.shutdownName) || 0) + itemCost);
        }
      }
    }

    const topFailureTypes = [...byFailureType.entries()].sort((a, b) => b[1] - a[1]);
    const repeatEquipment = [...byEquipment.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
    const byShutdownSorted = [...byShutdown.entries()].sort((a, b) => b[1] - a[1]);
    const costByEquipment = [...costByEquipmentMap.entries()].filter(([, cost]) => cost > 0).sort((a, b) => b[1] - a[1]);
    const costByShutdown: [string, number][] = [...costByShutdownMap.entries()]
      .filter(([, cost]) => cost > 0)
      .sort((a, b) => b[1] - a[1]);

    return { total, topFailureTypes, repeatEquipment, byShutdownSorted, totalSpareCost, costByEquipment, costByShutdown };
  }, [reports]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

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

      {/* Part P: Spare Parts Cost Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Spare Parts & Materials Cost
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Spent:</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalSpareCost)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Highest Cost Equipment
          </p>
          {stats.costByEquipment.map(([equip, cost]) => (
            <div key={equip} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-400" /> {equip}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(cost)}</span>
            </div>
          ))}
          {stats.costByEquipment.length === 0 && (
            <p className="text-xs text-slate-400">No spare parts recorded in reports yet.</p>
          )}
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

