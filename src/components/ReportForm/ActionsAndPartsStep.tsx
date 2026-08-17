import React, { useState } from 'react';
import { MaintenanceReport, CorrectiveAction, SparePart } from '../../types';
import { Plus, Trash2, CheckCircle2, Package, Wrench, DollarSign } from 'lucide-react';

interface ActionsAndPartsStepProps {
  reportData: Partial<MaintenanceReport>;
  onChange: (updates: Partial<MaintenanceReport>) => void;
}

export const ActionsAndPartsStep: React.FC<ActionsAndPartsStepProps> = ({ reportData, onChange }) => {
  const actions: CorrectiveAction[] = reportData.correctiveActions || [];
  const spareParts: SparePart[] = reportData.spareParts || [];

  // Add Action Item
  const addAction = () => {
    const newAction: CorrectiveAction = {
      id: 'ca-' + Date.now(),
      action: '',
      assignee: reportData.technicianName || 'Maintenance Tech',
      priority: 'High',
      status: 'In Progress',
      targetDate: new Date().toISOString().split('T')[0]
    };
    onChange({ correctiveActions: [...actions, newAction] });
  };

  const updateAction = (id: string, updates: Partial<CorrectiveAction>) => {
    const updated = actions.map((a) => (a.id === id ? { ...a, ...updates } : a));
    onChange({ correctiveActions: updated });
  };

  const removeAction = (id: string) => {
    onChange({ correctiveActions: actions.filter((a) => a.id !== id) });
  };

  // Add Spare Part
  const addSparePart = () => {
    const newPart: SparePart = {
      id: 'sp-' + Date.now(),
      partName: '',
      partNumber: '',
      quantity: 1,
      unitCost: 0,
      status: 'In Stock'
    };
    onChange({ spareParts: [...spareParts, newPart] });
  };

  const updateSparePart = (id: string, updates: Partial<SparePart>) => {
    const updated = spareParts.map((p) => (p.id === id ? { ...p, ...updates } : p));
    onChange({ spareParts: updated });
  };

  const removeSparePart = (id: string) => {
    onChange({ spareParts: spareParts.filter((p) => p.id !== id) });
  };

  const totalPartCost = spareParts.reduce((acc, p) => acc + (p.quantity || 0) * (p.unitCost || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Corrective Actions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-xs text-emerald-900">Corrective Action Items</h3>
              <p className="text-[10px] text-emerald-700">Immediate and follow-up maintenance repairs</p>
            </div>
          </div>
          <button
            onClick={addAction}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action</span>
          </button>
        </div>

        {actions.length === 0 ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
            No corrective actions added yet. Click &quot;Add Action&quot; to log repair steps.
          </div>
        ) : (
          <div className="space-y-2.5">
            {actions.map((ca, idx) => (
              <div key={ca.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Action #{idx + 1}</span>
                  <button
                    onClick={() => removeAction(ca.id)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded transition-colors"
                    title="Remove action"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={ca.action}
                  onChange={(e) => updateAction(ca.id, { action: e.target.value })}
                  placeholder="e.g. Replace worn slurry impeller with chrome alloy replacement"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Assignee</label>
                    <input
                      type="text"
                      value={ca.assignee}
                      onChange={(e) => updateAction(ca.id, { assignee: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Priority</label>
                    <select
                      value={ca.priority}
                      onChange={(e) => updateAction(ca.id, { priority: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Status</label>
                    <select
                      value={ca.status}
                      onChange={(e) => updateAction(ca.id, { status: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Target Date</label>
                    <input
                      type="date"
                      value={ca.targetDate}
                      onChange={(e) => updateAction(ca.id, { targetDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Spare Parts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl p-3">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-sky-600" />
            <div>
              <h3 className="font-bold text-xs text-sky-900">Spare Parts & Warehouse Materials</h3>
              <p className="text-[10px] text-sky-700">Log replacement parts, part numbers, quantities, and cost</p>
            </div>
          </div>
          <button
            onClick={addSparePart}
            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Part</span>
          </button>
        </div>

        {spareParts.length === 0 ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
            No spare parts logged. Click &quot;Add Part&quot; to record material usage.
          </div>
        ) : (
          <div className="space-y-2.5">
            {spareParts.map((sp, idx) => (
              <div key={sp.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Part #{idx + 1}</span>
                  <button
                    onClick={() => removeSparePart(sp.id)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded transition-colors"
                    title="Remove spare part"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={sp.partName}
                    onChange={(e) => updateSparePart(sp.id, { partName: e.target.value })}
                    placeholder="Part Name (e.g. Slurry Impeller 280mm)"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <input
                    type="text"
                    value={sp.partNumber}
                    onChange={(e) => updateSparePart(sp.id, { partNumber: e.target.value })}
                    placeholder="Part # / Tag (e.g. IMP-8802-CR)"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={sp.quantity}
                      onChange={(e) => updateSparePart(sp.id, { quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Unit Cost ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={sp.unitCost}
                      onChange={(e) => updateSparePart(sp.id, { unitCost: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Status</label>
                    <select
                      value={sp.status}
                      onChange={(e) => updateSparePart(sp.id, { status: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Urgent Request">Urgent Request</option>
                      <option value="Replaced">Replaced</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Total Cost Banner */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
              <div className="flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Total Spare Parts Expenditure:</span>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                ${totalPartCost.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
