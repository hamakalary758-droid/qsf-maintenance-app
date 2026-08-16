import React from 'react';
import { MaintenanceReport, FailureType } from '../../types';
import { Wrench, Calendar, User, MapPin, AlertTriangle, Hash, Activity } from 'lucide-react';

interface BasicInfoStepProps {
  reportData: Partial<MaintenanceReport>;
  onChange: (updates: Partial<MaintenanceReport>) => void;
}

const FAILURE_TYPES: FailureType[] = [
  'Mechanical Failure',
  'Electrical Fault',
  'Hydraulic Leak / Pressure',
  'Pneumatic Issue',
  'Instrumentation / Sensor',
  'Wear & Tear',
  'Operational Error',
  'Thermal / Overheating',
  'Corrosion / Chemical'
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ reportData, onChange }) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-start space-x-2">
        <Activity className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">General Maintenance Data</strong>
          <p className="text-[11px] text-sky-700 mt-0.5">
            Record the basic equipment details, location, technician badge, and failure classification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Technician Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Technician Name *</span>
          </label>
          <input
            type="text"
            value={reportData.technicianName || ''}
            onChange={(e) => onChange({ technicianName: e.target.value })}
            placeholder="e.g. Marcus Vance"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Technician ID / Badge */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Hash className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Technician ID / Badge #</span>
          </label>
          <input
            type="text"
            value={reportData.technicianId || ''}
            onChange={(e) => onChange({ technicianId: e.target.value })}
            placeholder="e.g. TECH-4092"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Maintenance Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Maintenance Date *</span>
          </label>
          <input
            type="date"
            value={reportData.date || new Date().toISOString().split('T')[0]}
            onChange={(e) => onChange({ date: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Shutdown Event Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Wrench className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Shutdown Event Name *</span>
          </label>
          <input
            type="text"
            value={reportData.shutdownName || ''}
            onChange={(e) => onChange({ shutdownName: e.target.value })}
            placeholder="e.g. 2026 August Major Plant Shutdown"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Equipment Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Wrench className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Equipment Name *</span>
          </label>
          <input
            type="text"
            value={reportData.equipmentName || ''}
            onChange={(e) => onChange({ equipmentName: e.target.value })}
            placeholder="e.g. Slurry Centrifugal Pump P-102A"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Equipment Code / Tag */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
            <Hash className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Equipment Code / Tag Number</span>
          </label>
          <input
            type="text"
            value={reportData.equipmentCode || ''}
            onChange={(e) => onChange({ equipmentCode: e.target.value })}
            placeholder="e.g. EQ-PMP-102A"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Plant Location */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Plant Location / Unit Area *</span>
        </label>
        <input
          type="text"
          value={reportData.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="e.g. Area 3 - Heavy Processing Unit, Building B"
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Failure Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Failure Classification *</span>
        </label>
        <select
          value={reportData.failureType || 'Mechanical Failure'}
          onChange={(e) => onChange({ failureType: e.target.value as FailureType })}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          {FAILURE_TYPES.map((ft) => (
            <option key={ft} value={ft}>
              {ft}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
