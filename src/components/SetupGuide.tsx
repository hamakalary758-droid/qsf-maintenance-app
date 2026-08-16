import React from 'react';
import { Shield, Lock, DollarSign, Smartphone, Database, CheckCircle2, AlertTriangle, Zap, Server } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          <span>Phase 2 — Firebase Free-Tier & Plant Reliability Architecture</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Zero-Cost Safety Net & Phone Reliability</h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Configured with offline-first client persistence and Firebase Spark Free Tier limits to guarantee 100% free operation with zero billing risk inside heavy plant facilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guardrail 1: Spending Cap & Zero Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3>Step 8: Hard Spending Cap & Kill-Switch</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your application runs entirely within Firebase&apos;s generous Spark Plan free allowances:
          </p>

          <ul className="space-y-2 text-xs">
            <li className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">50,000 Free Reads / Day</strong>
                <p className="text-[11px] text-slate-500">More than enough for thousands of maintenance reports per month.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">20,000 Free Writes / Day</strong>
                <p className="text-[11px] text-slate-500">Writing field reports and uploading 5-Why analysis costs $0.00.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Budget Limit & Spending Alerts ($0 Cap)</strong>
                <p className="text-[11px] text-slate-500">Set up Google Cloud Budget Alert at $0.01 threshold with automatic kill-switch disabling billing.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Guardrail 2: Plant Offline Reliability */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-sm">
            <div className="p-2 bg-sky-50 rounded-lg border border-sky-200">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3>Plant Floor Offline Reliability</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Subtle concrete structures and metal tanks block cell signals. The app is engineered for zero-latency offline work:
          </p>

          <ul className="space-y-2 text-xs">
            <li className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Zap className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">IndexedDB & Local Storage Cache</strong>
                <p className="text-[11px] text-slate-500">Reports, photos, and drafts save instantly to your phone memory without waiting for network connection.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Database className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Automatic Sync on Reconnect</strong>
                <p className="text-[11px] text-slate-500">When you exit the basement/unit back into Wi-Fi or LTE range, stored reports automatically synchronize.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Lock className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Standalone Single-User Mode</strong>
                <p className="text-[11px] text-slate-500">No complex login barriers or multi-user access bottlenecks required for your personal use.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
