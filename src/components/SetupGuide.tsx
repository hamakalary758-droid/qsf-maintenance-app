import React from 'react';
import { Shield, Lock, DollarSign, Smartphone, Database, CheckCircle2, Zap } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          <span>Phase 2 — Supabase Free-Tier & Plant Reliability Architecture</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Zero-Cost Safety Net & Phone Reliability</h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Configured with client persistence and Supabase Free Tier allowances to guarantee 100% free operation with zero billing risk inside heavy plant facilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guardrail 1: Spending Cap & Zero Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3>Step 8: Hard Spending Cap & Free Tier</h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your application runs entirely within Supabase&apos;s generous free plan allowances:
          </p>

          <ul className="space-y-2 text-xs">
            <li className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">500 MB Free PostgreSQL Database</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Stores tens of thousands of maintenance records, 5-Why root cause trees, and spare part logs.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Unlimited API Requests & Operations</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Writing field reports and querying report history costs $0.00 without pay-per-read fees.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">No Credit Card Required ($0 Risk)</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Free project tier never incurs unexpected charges or credit card debits.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Guardrail 2: Plant Offline Reliability */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-sm">
            <div className="p-2 bg-sky-50 rounded-lg border border-sky-200">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3>Plant Floor Offline Reliability</h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Subtle concrete structures and metal tanks block cell signals. The app is engineered for zero-latency offline work:
          </p>

          <ul className="space-y-2 text-xs">
            <li className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Zap className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Local Draft Cache</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Active reports, photos, and edits save instantly to local storage without losing progress if signal drops.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Database className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Graceful Local Fallback</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Even without database environment credentials, all features and report saving work seamlessly offline.</p>
              </div>
            </li>

            <li className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Lock className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Direct Plant Floor Access</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No complex login barriers or multi-user access bottlenecks required for your personal use.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
