import React from 'react';
import { CheckCircle2, Smartphone, Wrench, Shield, Camera, FileCheck, Download, Sparkles, Clock, Check, Pencil } from 'lucide-react';

interface PhaseTrackerProps {
  onSelectTab: (tab: any) => void;
}

type PhaseStatus = 'Designed' | 'Implemented' | 'Tested' | 'Production Ready';

interface PhaseItem {
  phaseNumber: string;
  title: string;
  status: PhaseStatus;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  actionTab: string;
  steps: { id: number; name: string }[];
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ onSelectTab }) => {
  const phases: PhaseItem[] = [
    {
      phaseNumber: 'Phase 1',
      title: 'Mockups & Layout Wireframes',
      status: 'Production Ready',
      icon: Smartphone,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      actionTab: 'mockups',
      steps: [
        { id: 1, name: 'Input form layout mockup' },
        { id: 2, name: '5W+1H section mockup (6 boxes)' },
        { id: 3, name: '5-Why root cause section mockup (5 boxes)' },
        { id: 4, name: 'Corrective actions + spare parts fields' },
        { id: 5, name: 'Review screen layout' },
        { id: 6, name: 'Output report layout mockup (Excel/PDF/Word)' }
      ]
    },
    {
      phaseNumber: 'Phase 2',
      title: 'Setup & Free-Tier Guardrails',
      status: 'Implemented',
      icon: Shield,
      color: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
      actionTab: 'setup-guide',
      steps: [
        { id: 7, name: 'Supabase PostgreSQL configuration & table schema readiness' },
        { id: 8, name: 'Spending cap / zero-cost safety net (kill-switch)' }
      ]
    },
    {
      phaseNumber: 'Phase 3',
      title: 'Build Input Section',
      status: 'Production Ready',
      icon: Wrench,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
      actionTab: 'new-report',
      steps: [
        { id: 9, name: 'Basic fields (Technician, Date, Equipment, Location, Failure)' },
        { id: 10, name: '5W+1H boxes added' },
        { id: 11, name: '5-Why boxes added' },
        { id: 12, name: 'Corrective actions + spare parts added' }
      ]
    },
    {
      phaseNumber: 'Phase 4',
      title: 'Save + Photos Suite',
      status: 'Production Ready',
      icon: Camera,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      actionTab: 'new-report',
      steps: [
        { id: 13, name: 'Local draft save to storage' },
        { id: 14, name: 'Camera/Photo batch upload support' },
        { id: 15, name: 'Photo crop tool with boundary clamping' },
        { id: 16, name: 'Photo highlight & markup with touch/stylus support' }
      ]
    },
    {
      phaseNumber: 'Phase 5',
      title: 'Review + History',
      status: 'Production Ready',
      icon: FileCheck,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      actionTab: 'history',
      steps: [
        { id: 17, name: 'Review screen (see everything, edit before submitting)' },
        { id: 18, name: 'Report history list (pull up past saved reports anytime)' }
      ]
    },
    {
      phaseNumber: 'Phase 6',
      title: 'Export Engine',
      status: 'Production Ready',
      icon: Download,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      actionTab: 'history',
      steps: [
        { id: 19, name: 'Excel export (.xlsx)' },
        { id: 20, name: 'PDF export (.pdf)' },
        { id: 21, name: 'Word export (.doc formatted HTML document compatible with MS Word)' }
      ]
    },
    {
      phaseNumber: 'Phase 7',
      title: 'Test & Plant Polish',
      status: 'Production Ready',
      icon: Sparkles,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      actionTab: 'history',
      steps: [
        { id: 22, name: 'Offline-first architecture (IndexedDB local storage + sync queue + retry logic)' },
        { id: 23, name: 'Real Gemini-powered 5-Why AI suggestion assistant' },
        { id: 24, name: 'Mobile photo annotation / markup with touch pen & high-contrast tools' },
        { id: 25, name: 'Operational analytics dashboard (KPI cards, cost breakdowns & failure trends)' },
        { id: 26, name: 'Multi-report batch export (consolidated Excel and Word packages)' },
        { id: 27, name: 'Equipment-specific report templates dropdown pre-filling standard failure modes' },
        { id: 28, name: 'Spare parts cost summary card with automatic line-item and total calculation' },
        { id: 29, name: 'CSV data export for direct tabular analytics and external spreadsheet imports' },
        { id: 30, name: 'Overdue corrective actions badge highlighting uncompleted tasks past target dates' },
        { id: 31, name: 'Full visual redesign (Review screen, Word export styling, Excel workbook formatting)' },
        { id: 32, name: 'Discard Draft button with safety modal preventing accidental work loss' },
        { id: 33, name: 'Local-only photo storage (deliberate architecture: photos are persisted locally in this device\'s IndexedDB storage and survive refreshes/restarts, but are lost if browser/site data is cleared — never uploaded to any server)' }
      ]
    }
  ];

  const readyCount = phases.filter((p) => p.status === 'Production Ready').length;
  const testedCount = phases.filter((p) => p.status === 'Tested').length;
  const implementedCount = phases.filter((p) => p.status === 'Implemented').length;
  const designedCount = phases.filter((p) => p.status === 'Designed').length;

  const getStatusBadge = (status: PhaseStatus) => {
    switch (status) {
      case 'Production Ready':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-3 h-3 mr-1" /> Ready
          </span>
        );
      case 'Tested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Tested
          </span>
        );
      case 'Implemented':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 mr-1" /> Implemented
          </span>
        );
      case 'Designed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Pencil className="w-3 h-3 mr-1" /> Designed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-sky-400 font-semibold">Project Blueprint</span>
            <h2 className="text-xl font-bold tracking-tight text-white">Development Phase Status</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30">
              {readyCount} Ready
            </span>
            <span className="px-2.5 py-1 bg-sky-500/20 text-sky-400 font-bold rounded-lg border border-sky-500/30">
              {testedCount} Tested
            </span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-lg border border-amber-500/30">
              {implementedCount} Implemented
            </span>
            <span className="px-2.5 py-1 bg-slate-500/20 text-slate-300 font-bold rounded-lg border border-slate-500/30">
              {designedCount} Designed
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Tracking the 7 development phases of the shutdown maintenance reporter. Core input workflows, photo annotation, and multi-format export engines are tested and production-ready, with offline IndexedDB sync and Gemini-powered 5-Why AI assistance live today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {phases.map((phase, idx) => {
          const IconComp = phase.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg border ${phase.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{phase.phaseNumber}</span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{phase.title}</h3>
                    </div>
                  </div>
                  {getStatusBadge(phase.status)}
                </div>

                <ul className="space-y-1.5 my-3 pl-1">
                  {phase.steps.map((step) => (
                    <li key={step.id} className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200 mr-1">#{step.id}.</strong> {step.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onSelectTab(phase.actionTab)}
                className="mt-3 w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <span>View {phase.title}</span>
                <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

