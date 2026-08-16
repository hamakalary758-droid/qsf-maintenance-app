import React, { useState, useEffect, useRef } from 'react';
import { AppTab } from '../types';
import { Wrench, Smartphone, History, Shield, CheckSquare, Plus, Wifi, WifiOff, Settings, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  reportCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onAutoFill: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  reportCount,
  theme,
  onToggleTheme,
  onAutoFill
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

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

        {/* Network Indicator & Settings */}
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

          {/* Settings Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              aria-label="Settings"
              aria-expanded={isSettingsOpen}
              className={`p-2 rounded-lg border transition-colors ${
                isSettingsOpen
                  ? 'bg-slate-800 text-sky-400 border-slate-700'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2.5 z-50 text-slate-900 dark:text-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
                {/* 1. Appearance */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                  Appearance
                </div>
                <div
                  onClick={onToggleTheme}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Dark mode
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 flex items-center ${
                      theme === 'dark' ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                        theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Divider */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                {/* 3. Test Data */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                  Test data
                </div>
                <button
                  onClick={() => {
                    onAutoFill();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Auto-Fill Test Sample</span>
                </button>

                {/* 4. Divider */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                {/* 5. App Details */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                  App details
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      onSelectTab('mockups');
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      activeTab === 'mockups'
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>Phase 1 Mockups</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('setup-guide');
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      activeTab === 'setup-guide'
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>Phase 2 Safety Net</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('phase-checklist');
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      activeTab === 'phase-checklist'
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>23-Step Blueprint</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {[
            { id: 'new-report' as const, label: 'New Field Report', icon: Plus },
            { id: 'history' as const, label: `Report History (${reportCount})`, icon: History }
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

