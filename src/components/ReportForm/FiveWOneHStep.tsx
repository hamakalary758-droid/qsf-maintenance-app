import React from 'react';
import { MaintenanceReport, FiveWOneH } from '../../types';
import { HelpCircle, AlertCircle, Clock, MapPin, User, Settings, Eye } from 'lucide-react';

interface FiveWOneHStepProps {
  reportData: Partial<MaintenanceReport>;
  onChange: (updates: Partial<MaintenanceReport>) => void;
}

export const FiveWOneHStep: React.FC<FiveWOneHStepProps> = ({ reportData, onChange }) => {
  const fiveWOneH: FiveWOneH = reportData.fiveWOneH || {
    what: '',
    when: '',
    where: '',
    who: '',
    which: '',
    how: ''
  };

  const updateField = (field: keyof FiveWOneH, value: string) => {
    onChange({
      fiveWOneH: {
        ...fiveWOneH,
        [field]: value
      }
    });
  };

  const fields = [
    {
      key: 'what' as const,
      title: 'WHAT Happened?',
      subtitle: 'Problem & damage description',
      icon: AlertCircle,
      placeholder: 'e.g. Impeller vanes severely pitted & high vibration on slurry pump bearing',
      color: 'border-l-sky-500'
    },
    {
      key: 'when' as const,
      title: 'WHEN Discovered?',
      subtitle: 'Exact time / shift / operating phase',
      icon: Clock,
      placeholder: 'e.g. Discovered during Day Shift pre-shutdown line drain at 10:30 AM',
      color: 'border-l-indigo-500'
    },
    {
      key: 'where' as const,
      title: 'WHERE Located?',
      subtitle: 'Component, housing, or sub-assembly',
      icon: MapPin,
      placeholder: 'e.g. Suction casing housing & shaft bearing assembly #2',
      color: 'border-l-purple-500'
    },
    {
      key: 'who' as const,
      title: 'WHO Discovered / Team?',
      subtitle: 'Technicians and operators involved',
      icon: User,
      placeholder: 'e.g. Marcus Vance (Sr. Tech) & Shift Operator David K.',
      color: 'border-l-amber-500'
    },
    {
      key: 'which' as const,
      title: 'WHICH Mode / Condition?',
      subtitle: 'Operating load, pressure, or fluid type',
      icon: Settings,
      placeholder: 'e.g. Running under 85% high viscosity slurry load prior to shutdown',
      color: 'border-l-emerald-500'
    },
    {
      key: 'how' as const,
      title: 'HOW Detected / Severity?',
      subtitle: 'Sensors, noise, leakage, visual inspection',
      icon: Eye,
      placeholder: 'e.g. Triggered by inline vibration sensor alarm (12.4 mm/s) + acoustic noise',
      color: 'border-l-rose-500'
    }
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex items-start space-x-2">
        <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">5W + 1H Methodical Analysis</strong>
          <p className="text-[11px] text-indigo-700 mt-0.5">
            Fill in the 6 structured boxes to establish complete factual clarity before root cause analysis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {fields.map((f) => {
          const IconComp = f.icon;
          return (
            <div
              key={f.key}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm border-l-4 ${f.color} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <IconComp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{f.title}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{f.subtitle}</p>

                <textarea
                  rows={2}
                  value={fiveWOneH[f.key]}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
