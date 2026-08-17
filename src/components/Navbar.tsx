import React, { useState, useEffect, useRef } from 'react';
import { AppTab } from '../types';
import { Wrench, Smartphone, History, Shield, CheckSquare, Plus, Wifi, WifiOff, Settings, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw, X, Key, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { subscribeToSyncStatus, processSyncQueue, SyncStatusInfo } from '../offline/syncQueue';

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
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>({
    state: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    pendingCount: 0,
    failedCount: 0,
    failedReports: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('qsf_gemini_api_key');
      if (savedKey) {
        setGeminiApiKey(savedKey);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleApiKeyChange = (newVal: string) => {
    setGeminiApiKey(newVal);
    try {
      if (newVal.trim()) {
        localStorage.setItem('qsf_gemini_api_key', newVal.trim());
      } else {
        localStorage.removeItem('qsf_gemini_api_key');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((info) => {
      setSyncInfo(info);
    });
    return () => unsubscribe();
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
        setIsSyncModalOpen(false);
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

  const handleManualRetry = () => {
    processSyncQueue(true);
  };

  // Render badge based on exact IndexedDB state
  const renderSyncBadge = () => {
    if (!syncInfo.isOnline || syncInfo.state === 'offline') {
      return (
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          title="Offline mode - changes saved locally"
        >
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
          {syncInfo.pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 rounded-full text-[9px]">
              {syncInfo.pendingCount}
            </span>
          )}
        </button>
      );
    }

    if (syncInfo.state === 'syncing') {
      return (
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse"
          title="Syncing reports with cloud..."
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Syncing</span>
        </button>
      );
    }

    if (syncInfo.state === 'sync_failed') {
      return (
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25 transition-colors cursor-pointer"
          title="Sync failed - tap to inspect and retry"
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Sync Failed {syncInfo.failedCount > 1 ? `(${syncInfo.failedCount})` : ''}</span>
        </button>
      );
    }

    if (syncInfo.state === 'pending_sync' || syncInfo.pendingCount > 0) {
      return (
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          title="Pending synchronization"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Pending Sync {syncInfo.pendingCount > 1 ? `(${syncInfo.pendingCount})` : ''}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsSyncModalOpen(true)}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
        title="Connected and fully synced"
      >
        <Wifi className="w-3 h-3" />
        <span>Online</span>
      </button>
    );
  };

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
          {renderSyncBadge()}

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
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-50 text-slate-900 dark:text-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
                {/* 1. Appearance */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-1">
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

                {/* 3. Gemini API Key */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-1 flex items-center justify-between">
                  <span>Gemini API Key</span>
                  <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold lowercase">5-Why AI</span>
                </div>
                <div className="px-1 py-1 space-y-1.5">
                  <div className="relative flex items-center">
                    <div className="absolute left-2.5 text-slate-400 pointer-events-none">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={geminiApiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="Enter Gemini API key..."
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-purple-500 focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((prev) => !prev)}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    Used only in your browser to call Gemini's API directly for 5-Why suggestions. Never sent anywhere else.
                  </p>
                </div>

                {/* 4. Divider */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                {/* 5. Test Data */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-1">
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

                {/* 6. Divider */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                {/* 7. App Details */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-1">
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
            { id: 'history' as const, label: `Report History (${reportCount})`, icon: History },
            { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 }
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

      {/* Sync Status & Retry Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-xl">
                  <RefreshCw className={`w-4 h-4 ${syncInfo.state === 'syncing' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">IndexedDB & Cloud Sync Status</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Offline-First Local Storage Engine</span>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-400">Network State:</span>
                <span className={`font-bold ${syncInfo.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {syncInfo.isOnline ? 'Connected (Online)' : 'No Connection (Offline)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-400">Sync Status:</span>
                <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                  {syncInfo.state.replace('_', ' ')}
                </span>
              </div>

              {syncInfo.pendingCount > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
                  <p className="font-bold">
                    {syncInfo.pendingCount} report(s) waiting to sync
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Records are safely saved in IndexedDB and will push automatically when online.
                  </p>
                </div>
              )}

              {syncInfo.failedReports.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">
                    Sync Failures ({syncInfo.failedReports.length}):
                  </span>
                  {syncInfo.failedReports.map((item, idx) => (
                    <div
                      key={item.localId || idx}
                      className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200"
                    >
                      <div className="font-semibold text-[11px]">{item.title}</div>
                      {item.error && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-300 font-mono mt-0.5">
                          {item.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {syncInfo.state === 'online' && syncInfo.pendingCount === 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>All reports and photos are synced and up to date.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleManualRetry}
                disabled={syncInfo.state === 'syncing'}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-transform active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncInfo.state === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Retry Sync Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


