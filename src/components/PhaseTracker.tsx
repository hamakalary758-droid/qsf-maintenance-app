import React from 'react';
import { CheckCircle2, Circle, Smartphone, Wrench, Shield, FileText, Camera, FileCheck, Download, Sparkles } from 'lucide-react';

interface PhaseTrackerProps {
  onSelectTab: (tab: any) => void;
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ onSelectTab }) => {
  const phases = [
    {
      phaseNumber: 'Phase 1',
      title: 'Mockups & Layout Wireframes',
      status: 'Completed',
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
      status: 'Completed',
      icon: Shield,
      color: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
      actionTab: 'setup-guide',
      steps: [
        { id: 7, name: 'Firebase project configuration & link readiness' },
        { id: 8, name: 'Spending cap / zero-cost safety net (kill-switch)' }
      ]
    },
    {
      phaseNumber: 'Phase 3',
      title: 'Build Input Section',
      status: 'Completed',
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
      status: 'Completed',
      icon: Camera,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      actionTab: 'new-report',
      steps: [
        { id: 13, name: 'Offline-first local save to storage' },
        { id: 14, name: 'Camera/Photo upload support' },
        { id: 15, name: 'Photo crop tool' },
        { id: 16, name: 'Photo highlight & markup tool' }
      ]
    },
    {
      phaseNumber: 'Phase 5',
      title: 'Review + History',
      status: 'Completed',
      icon: FileCheck,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      actionTab: 'history',
      steps: [
        { id: 17, name: 'Review screen (see everything, edit before submitting)' },
        { id: 18, name: 'Report history list (pull up all past saved reports anytime)' }
      ]
    },
    {
      phaseNumber: 'Phase 6',
      title: 'Export Engine',
      status: 'Completed',
      icon: Download,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      actionTab: 'history',
      steps: [
        { id: 19, name: 'Excel export (.xlsx)' },
        { id: 20, name: 'PDF export (.pdf)' },
        { id: 21, name: 'Word export (.doc/.docx formatted)' }
      ]
    },
    {
      phaseNumber: 'Phase 7',
      title: 'Test & Plant Polish',
      status: 'Completed',
      icon: Sparkles,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      actionTab: 'history',
      steps: [
        { id: 22, name: 'Plant condition reliability (Offline local cache & high contrast)' },
        { id: 23, name: 'Full polish, quick sample loader, and mobile field layout' }
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-sky-400 font-semibold">Project Blueprint</span>
            <h2 className="text-xl font-bold tracking-tight text-white">23-Step Building Plan Progress</h2>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
            23 / 23 Steps Completed
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          All 7 phases of your shutdown maintenance application specification have been built and verified. Explore mockups, test data entry, annotate plant photos, review past reports, or export to Excel, PDF, and Word.
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                  </span>
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
