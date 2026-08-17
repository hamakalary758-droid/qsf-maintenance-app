import React, { useState } from 'react';
import { MaintenanceReport, FiveWhy } from '../../types';
import { ArrowDown, HelpCircle, Sparkles, AlertTriangle, CheckCircle2, Loader2, Check, X } from 'lucide-react';

interface FiveWhyStepProps {
  reportData: Partial<MaintenanceReport>;
  onChange: (updates: Partial<MaintenanceReport>) => void;
}

export const FiveWhyStep: React.FC<FiveWhyStepProps> = ({ reportData, onChange }) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<FiveWhy | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const cleanWhyLine = (raw: string): string => {
    return raw
      .replace(/^(why\s*#?\s*\d\s*[:\-\.]*|\d+[\.\)]\s*)/i, '')
      .replace(/^\*+|\*+$/g, '')
      .trim();
  };

  // Real Gemini API Call for 5-Why Root Cause Generation
  const generateAI5Why = async () => {
    setErrorMessage(null);
    
    // 1. Read key from localStorage
    let apiKey = '';
    try {
      apiKey = localStorage.getItem('qsf_gemini_api_key') || '';
    } catch {
      apiKey = '';
    }

    // 2. Validate key presence
    if (!apiKey || !apiKey.trim()) {
      setErrorMessage('Add your Gemini API key in Settings to use this feature.');
      return;
    }

    setIsGenerating(true);

    try {
      const eqName = reportData.equipmentName?.trim() || 'Plant Equipment';
      const eqCode = reportData.equipmentCode?.trim() || 'N/A';
      const location = reportData.location?.trim() || 'Plant Floor';
      const failureType = reportData.failureType || 'Mechanical Failure';
      const w1h = reportData.fiveWOneH || { what: '', when: '', where: '', who: '', which: '', how: '' };

      const promptText = `You are an expert industrial plant reliability engineer performing a root cause 5-Why analysis for a shutdown maintenance event.

Equipment Context:
- Equipment Name: ${eqName}
- Equipment Tag/Code: ${eqCode}
- Location: ${location}
- Failure Category: ${failureType}

5W+1H Investigation:
- What happened: ${w1h.what || 'Unspecified anomaly'}
- When occurred: ${w1h.when || 'During shutdown inspection'}
- Where located: ${w1h.where || location}
- Who discovered: ${w1h.who || 'Inspection technician'}
- Which component: ${w1h.which || 'Primary assembly'}
- How it failed: ${w1h.how || 'Degraded function'}

Task:
Propose a realistic, highly technical 5-Why chain where each answer logically answers the preceding question, leading to a definitive root cause at Why #5.
Keep each answer concise (1-2 sentences maximum).

Format your response strictly as 5 lines:
WHY1: <First direct observation of failure>
WHY2: <Sub-assembly or mechanical cause>
WHY3: <Component wear, operational stress, or physical mechanism>
WHY4: <Operating condition, preventive maintenance, or operational practice>
WHY5: <Systemic, design, quality, or management root cause>`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `API error (${response.status}: ${response.statusText})`;
        throw new Error(message);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Received an empty response from Gemini API.');
      }

      // Parse 5 distinct lines
      const rawLines = text
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

      const parsed: FiveWhy = {
        why1: '',
        why2: '',
        why3: '',
        why4: '',
        why5: ''
      };

      // Search for explicit WHY1 - WHY5 tags first
      for (const line of rawLines) {
        const lower = line.toLowerCase();
        if (lower.startsWith('why1:') || lower.startsWith('why 1:') || lower.startsWith('why #1:')) {
          parsed.why1 = cleanWhyLine(line);
        } else if (lower.startsWith('why2:') || lower.startsWith('why 2:') || lower.startsWith('why #2:')) {
          parsed.why2 = cleanWhyLine(line);
        } else if (lower.startsWith('why3:') || lower.startsWith('why 3:') || lower.startsWith('why #3:')) {
          parsed.why3 = cleanWhyLine(line);
        } else if (lower.startsWith('why4:') || lower.startsWith('why 4:') || lower.startsWith('why #4:')) {
          parsed.why4 = cleanWhyLine(line);
        } else if (lower.startsWith('why5:') || lower.startsWith('why 5:') || lower.startsWith('why #5:')) {
          parsed.why5 = cleanWhyLine(line);
        }
      }

      // Fallback: if explicit tags were not detected, take first 5 non-empty lines
      if (!parsed.why1 && rawLines.length >= 1) parsed.why1 = cleanWhyLine(rawLines[0]);
      if (!parsed.why2 && rawLines.length >= 2) parsed.why2 = cleanWhyLine(rawLines[1]);
      if (!parsed.why3 && rawLines.length >= 3) parsed.why3 = cleanWhyLine(rawLines[2]);
      if (!parsed.why4 && rawLines.length >= 4) parsed.why4 = cleanWhyLine(rawLines[3]);
      if (!parsed.why5 && rawLines.length >= 5) parsed.why5 = cleanWhyLine(rawLines[4]);

      // Populate separate suggestion state (do NOT write directly to form fields)
      setAiSuggestions(parsed);
      setAppliedKeys([]);
    } catch (err: any) {
      console.error('Gemini 5-Why API error:', err);
      setErrorMessage(err?.message || 'Failed to generate 5-Why suggestions. Please check your API key and connection.');
      setAiSuggestions(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestion = (key: keyof FiveWhy, val: string) => {
    updateWhy(key, val);
    if (!appliedKeys.includes(key)) {
      setAppliedKeys([...appliedKeys, key]);
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
      {/* Header Info & Trigger Button */}
      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 text-xs text-purple-900 dark:text-purple-200 flex flex-wrap sm:flex-nowrap items-start justify-between gap-3">
        <div className="flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">5-Why Root Cause Analysis</strong>
            <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
              Drill down sequentially from symptom to true root cause. Each why must logically answer the preceding box.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateAI5Why}
          disabled={isGenerating}
          className="flex-shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          title="Auto-suggest 5-Why breakdown based on current report data"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 5-Why Helper</span>
            </>
          )}
        </button>
      </div>

      {/* Inline Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* AI Suggested Analysis Review Box */}
      {aiSuggestions && (
        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                AI Suggested Analysis
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAiSuggestions(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
              title="Dismiss suggestions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Review proposed answers below. Click <strong>Accept</strong> to copy any line into your report.
          </p>

          <div className="space-y-2">
            {whySteps.map((step) => {
              const suggestedText = aiSuggestions[step.key];
              const isApplied = appliedKeys.includes(step.key);

              if (!suggestedText) return null;

              return (
                <div
                  key={`suggestion-${step.key}`}
                  className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                    isApplied
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-slate-600 dark:text-slate-300'
                      : 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800/60 text-slate-900 dark:text-slate-100 shadow-xs'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <span className="font-bold text-[10px] uppercase text-purple-700 dark:text-purple-400">
                      {step.label}
                    </span>
                    <p className="text-xs leading-relaxed font-sans">{suggestedText}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(step.key, suggestedText)}
                    disabled={isApplied}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs hover:shadow'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real Form Fields */}
      <div className="space-y-3">
        {whySteps.map((step, idx) => {
          const isRootCause = idx === 4;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isRootCause
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`font-extrabold text-xs tracking-wider uppercase ${
                      isRootCause
                        ? 'text-rose-700 dark:text-rose-400 flex items-center space-x-1'
                        : 'text-purple-700 dark:text-purple-400'
                    }`}
                  >
                    <span>{step.label}</span>
                    {isRootCause && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
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
                      ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-900 dark:text-slate-100 focus:ring-rose-500 font-medium'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-sky-500'
                  }`}
                />
              </div>

              {!isRootCause && (
                <div className="flex justify-center">
                  <div className="p-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800 shadow-xs">
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
