import React, { useState, useEffect } from 'react';
import { AppTab } from '../types';
import { Wrench, Smartphone, History, Shield, CheckSquare, Plus, Wifi, WifiOff, FileText } from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  reportCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, reportCount }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Plant Badge */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 flex items-center justify-center shadow-xs">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                Shutdown Maintenance Reporter
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 text-sky-400 text-[10px] font-bold rounded-full border border-slate-700">
                Mobile Plant Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Plant Shutdown Field Companion</p>
          </div>
        </div>

        {/* Network & Local Storage Indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Online Sync Active' : 'Offline Local Mode'}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {[
            { id: 'new-report' as const, label: 'New Field Report', icon: Plus },
            { id: 'history' as const, label: `Report History (${reportCount})`, icon: History },
            { id: 'mockups' as const, label: 'Phase 1 Mockups', icon: Smartphone },
            { id: 'setup-guide' as const, label: 'Phase 2 Safety Net', icon: Shield },
            { id: 'phase-checklist' as const, label: '23-Step Blueprint', icon: CheckSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
