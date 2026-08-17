import React, { useState } from 'react';
import { MaintenanceReport, FiveWhy } from '../../types';
import { ArrowDown, HelpCircle, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FiveWhyStepProps {
  reportData: Partial<MaintenanceReport>;
  onChange: (updates: Partial<MaintenanceReport>) => void;
}

export const FiveWhyStep: React.FC<FiveWhyStepProps> = ({ reportData, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const fiveWhy: FiveWhy = reportData.fiveWhy || {
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: ''
  };

  const updateWhy = (key: keyof FiveWhy, val: string) => {
    onChange({
      fiveWhy: {
        ...fiveWhy,
        [key]: val
      }
    });
  };

  // AI Assistant for 5-Why Root Cause Generation
  const generateAI5Why = async () => {
    setIsGenerating(true);
    try {
      const problem = reportData.fiveWOneH?.what || reportData.failureType || 'Equipment vibration and flow reduction';
      const eq = reportData.equipmentName || 'Plant Equipment';

      // Simulate intelligent root cause analysis for field reliability
      setTimeout(() => {
        onChange({
          fiveWhy: {
            why1: `Why did ${eq} fail? Excessive vibration and flow drop during operation.`,
            why2: `Why was vibration high? Internal clearance widened and component seal suffered degradation.`,
            why3: `Why did component degrade? Pitting and erosion accumulated from continuous recirculation.`,
            why4: `Why did erosion accumulate? System operated below minimum stable flow threshold for extended period.`,
            why5: `Why operated below threshold? Recirculation bypass control valve stuck in partial position due to particulate buildup (ROOT CAUSE).`
          }
        });
        setIsGenerating(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const whySteps = [
    { key: 'why1' as const, label: 'WHY #1', prompt: 'First direct physical observation' },
    { key: 'why2' as const, label: 'WHY #2', prompt: 'Immediate sub-assembly or mechanical cause' },
    { key: 'why3' as const, label: 'WHY #3', prompt: 'Component level wear or operational stress' },
    { key: 'why4' as const, label: 'WHY #4', prompt: 'Operating condition or maintenance practice' },
    { key: 'why5' as const, label: 'WHY #5 (ROOT CAUSE)', prompt: 'Systemic / process / root cause factor' }
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">5-Why Root Cause Analysis</strong>
            <p className="text-[11px] text-purple-700 mt-0.5">
              Drill down sequentially from symptom to true root cause. Each why must logically answer the preceding box.
            </p>
          </div>
        </div>

        <button
          onClick={generateAI5Why}
          disabled={isGenerating}
          className="flex-shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 shadow-sm disabled:opacity-50"
          title="Auto-suggest 5-Why breakdown based on problem description"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Analyzing...' : 'AI 5-Why Helper'}</span>
        </button>
      </div>

      <div className="space-y-3">
        {whySteps.map((step, idx) => {
          const isRootCause = idx === 4;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isRootCause
                    ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`font-extrabold text-xs tracking-wider uppercase ${
                      isRootCause ? 'text-rose-700 flex items-center space-x-1' : 'text-purple-700'
                    }`}
                  >
                    <span>{step.label}</span>
                    {isRootCause && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{step.prompt}</span>
                </div>

                <textarea
                  rows={2}
                  value={fiveWhy[step.key]}
                  onChange={(e) => updateWhy(step.key, e.target.value)}
                  placeholder={`e.g. Why did it happen? ${step.prompt}...`}
                  className={`w-full p-2.5 text-xs rounded-lg border focus:outline-none focus:ring-2 resize-none ${
                    isRootCause
                      ? 'bg-white dark:bg-slate-900 border-rose-200 text-slate-900 dark:text-slate-100 focus:ring-rose-500 font-medium'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-sky-500'
                  }`}
                />
              </div>

              {!isRootCause && (
                <div className="flex justify-center">
                  <div className="p-1 bg-purple-100 text-purple-600 rounded-full border border-purple-200 shadow-xs">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
