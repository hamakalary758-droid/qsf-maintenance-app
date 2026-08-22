import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppTab, MaintenanceReport } from '../types';
import { Wrench, Smartphone, History, Shield, CheckSquare, Plus, Wifi, WifiOff, Menu, Bell, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw, X, Key, Eye, EyeOff, BarChart3, ChevronDown } from 'lucide-react';
import { subscribeToSyncStatus, processSyncQueue, SyncStatusInfo } from '../offline/syncQueue';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  reportCount: number;
  reports?: MaintenanceReport[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onAutoFill: () => void;
  isQskView: boolean;
  onToggleQskView: () => void;
}

const LS_LOGO_KEY = 'qsf_qsk_logo';
const LS_QSK_THEME_KEY = 'qsk_theme_v2';
const LS_QSK_DENSITY_KEY = 'qsk_density_v1';
const LS_QSK_LANG_KEY = 'qsk_lang_v2';

const PAIRED_STYLES = ['glassy', 'claude', 'dark-slate'];

const FIXED_THEME_NAMES: Record<string, string> = {
  'warm-sand': 'Warm Sand',
  'purple': 'Purple',
  'mono': 'Mono',
  'teal': 'Teal',
  'qsf': 'QSF',
};

const QSK_STYLES = [
  { id: 'glassy', label: 'Glassy' },
  { id: 'claude', label: 'Claude' },
  { id: 'dark-slate', label: 'Dark Slate' },
  { id: 'warm-sand', label: 'Warm Sand' },
  { id: 'purple', label: 'Purple' },
  { id: 'mono', label: 'Mono' },
  { id: 'teal', label: 'Teal' },
  { id: 'qsf', label: 'QSF' },
];

function getStyleFromQskTheme(theme: string): string {
  if (!theme || theme === 'dark' || theme === 'light') return 'glassy';
  if (theme.startsWith('claude')) return 'claude';
  if (theme.startsWith('dark-slate')) return 'dark-slate';
  if (['warm-sand', 'purple', 'mono', 'teal', 'qsf'].includes(theme)) return theme;
  return 'glassy';
}

function getQskThemeString(style: string, isDark: boolean): string {
  if (style === 'glassy') return isDark ? 'dark' : 'light';
  if (style === 'claude') return isDark ? 'claude-dark' : 'claude-light';
  if (style === 'dark-slate') return isDark ? 'dark-slate' : 'dark-slate-light';
  return style; // fixed themes: 'warm-sand', 'purple', 'mono', 'teal', 'qsf'
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  reportCount,
  reports = [],
  theme,
  onToggleTheme,
  onAutoFill,
  isQskView,
  onToggleQskView
}) => {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
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

  const [qskStyle, setQskStyle] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LS_QSK_THEME_KEY) || 'dark';
      return getStyleFromQskTheme(stored);
    } catch {
      return 'glassy';
    }
  });

  const [qskDensity, setQskDensity] = useState<'wide' | 'tight'>(() => {
    try {
      const stored = localStorage.getItem(LS_QSK_DENSITY_KEY);
      return stored === 'tight' ? 'tight' : 'wide';
    } catch {
      return 'wide';
    }
  });

  const [qskLang, setQskLang] = useState<'en' | 'ar' | 'ckb'>(() => {
    try {
      const stored = localStorage.getItem(LS_QSK_LANG_KEY);
      if (stored === 'ar' || stored === 'ckb' || stored === 'en') return stored;
    } catch {
      // ignore
    }
    return 'en';
  });

  const sendToQskIframe = (data: { type: string; [key: string]: any }) => {
    const message = { source: 'qsf-settings', ...data };
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(message, window.location.origin);
      } catch {
        // ignore
      }
    });
  };

  const handleToggleTheme = () => {
    const nextIsDark = theme !== 'dark';
    onToggleTheme();

    if (PAIRED_STYLES.includes(qskStyle)) {
      const themeName = getQskThemeString(qskStyle, nextIsDark);
      try {
        localStorage.setItem(LS_QSK_THEME_KEY, themeName);
      } catch {
        // ignore
      }
      sendToQskIframe({ type: 'SET_THEME', theme: themeName });
    }
  };

  const handleQskStyleChange = (newStyle: string) => {
    setQskStyle(newStyle);
    const isDark = theme === 'dark';
    const themeName = getQskThemeString(newStyle, isDark);
    try {
      localStorage.setItem(LS_QSK_THEME_KEY, themeName);
    } catch {
      // ignore
    }
    sendToQskIframe({ type: 'SET_THEME', theme: themeName });
  };

  const handleToggleDensity = () => {
    const nextDensity = qskDensity === 'tight' ? 'wide' : 'tight';
    setQskDensity(nextDensity);
    try {
      localStorage.setItem(LS_QSK_DENSITY_KEY, nextDensity);
    } catch {
      // ignore
    }
    sendToQskIframe({ type: 'SET_DENSITY', density: nextDensity });
  };

  const handleLanguageChange = (newLang: 'en' | 'ar' | 'ckb') => {
    setQskLang(newLang);
    try {
      localStorage.setItem(LS_QSK_LANG_KEY, newLang);
    } catch {
      // ignore
    }
    sendToQskIframe({ type: 'SET_LOCALE', locale: newLang });
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const overdueActionsCount = useMemo(() => {
    if (!reports || reports.length === 0) return 0;
    let count = 0;
    for (const r of reports) {
      for (const ca of r.correctiveActions || []) {
        if ((ca.status === 'Pending' || ca.status === 'In Progress') && ca.targetDate && ca.targetDate < todayStr) {
          count++;
        }
      }
    }
    return count;
  }, [reports, todayStr]);


  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('qsf_gemini_api_key');
      if (savedKey) {
        setGeminiApiKey(savedKey);
      }
    } catch {
      // ignore
    }
    try {
      const savedLogo = localStorage.getItem(LS_LOGO_KEY);
      if (savedLogo) {
        setLogoDataUrl(savedLogo);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpe?g)$/i)) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      try {
        localStorage.setItem(LS_LOGO_KEY, result);
        setLogoDataUrl(result);
      } catch {
        // ignore
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(LS_LOGO_KEY);
    } catch {
      // ignore
    }
    setLogoDataUrl(null);
  };

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
    if (isSettingsOpen) {
      try {
        const storedTheme = localStorage.getItem(LS_QSK_THEME_KEY) || 'dark';
        setQskStyle(getStyleFromQskTheme(storedTheme));
        const storedDensity = localStorage.getItem(LS_QSK_DENSITY_KEY);
        setQskDensity(storedDensity === 'tight' ? 'tight' : 'wide');
        const storedLang = localStorage.getItem(LS_QSK_LANG_KEY);
        if (storedLang === 'ar' || storedLang === 'ckb' || storedLang === 'en') {
          setQskLang(storedLang);
        }
      } catch {
        // ignore
      }
    }
  }, [isSettingsOpen]);

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

  const renderOverdueBadge = () => {
    if (overdueActionsCount === 0) return null;
    return (
      <button
        onClick={() => onSelectTab('history')}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25 transition-colors cursor-pointer"
        title={`${overdueActionsCount} overdue corrective action(s) — tap to view reports`}
      >
        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
        <span>{overdueActionsCount} Overdue</span>
      </button>
    );
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/png,image/jpeg"
            className="hidden"
            aria-label="Upload company logo"
          />
          <div
            onClick={() => logoInputRef.current?.click()}
            title={logoDataUrl ? 'Click to change logo' : 'Click to upload company logo'}
            className="relative group h-7 min-w-[28px] max-w-[84px] bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30 flex items-center justify-center shadow-xs shrink-0 cursor-pointer overflow-visible transition-all hover:border-sky-400/60 p-0.5"
          >
            {logoDataUrl ? (
              <>
                <img
                  src={logoDataUrl}
                  alt="Company logo"
                  className="h-full w-auto max-w-full object-contain rounded"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  title="Remove logo"
                  aria-label="Remove logo"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </>
            ) : (
              <Wrench className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            )}
          </div>
          <h1 className="font-semibold text-sm text-white">
            {isQskView ? 'QSK master data explorer' : 'QSF maintenance'}
          </h1>
        </div>

        {/* Status & Menu */}
        <div className="flex items-center space-x-3.5">
          {/* Overdue bell */}
          <button
            onClick={() => onSelectTab('history')}
            aria-label={overdueActionsCount > 0 ? `${overdueActionsCount} overdue corrective actions` : 'No overdue actions'}
            className="relative text-slate-300 hover:text-white transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {overdueActionsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {/* QSK view toggle */}
          <button
            onClick={onToggleQskView}
            aria-label={isQskView ? 'Switch back to QSF maintenance' : 'Switch to QSK master data explorer'}
            title={isQskView ? 'Back to QSF maintenance' : 'Open QSK master data explorer'}
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide hidden sm:inline">
              {isQskView ? 'QSF' : 'QSK'}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isQskView ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Sync status dot */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            aria-label={`Sync status: ${syncInfo.state}`}
            className="p-0.5"
          >
            <span
              className={`block w-2 h-2 rounded-full ${
                !syncInfo.isOnline || syncInfo.state === 'offline'
                  ? 'bg-amber-400'
                  : syncInfo.state === 'syncing'
                  ? 'bg-sky-400 animate-pulse'
                  : syncInfo.state === 'sync_failed'
                  ? 'bg-rose-500'
                  : syncInfo.state === 'pending_sync' || syncInfo.pendingCount > 0
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          </button>

          {/* Settings Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              aria-label="Menu"
              aria-expanded={isSettingsOpen}
              className={`p-2 rounded-lg border transition-colors ${
                isSettingsOpen
                  ? 'bg-slate-800 text-sky-400 border-slate-700'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-50 text-slate-900 dark:text-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
                {/* 1. Appearance */}
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-1">
                  Appearance
                </div>

                {/* Dark Mode Row */}
                <div
                  onClick={handleToggleTheme}
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

                {/* Fixed theme hint */}
                {FIXED_THEME_NAMES[qskStyle] && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 px-2 pb-1 leading-tight">
                    QSK is on a fixed theme ({FIXED_THEME_NAMES[qskStyle]}) and won&apos;t change
                  </div>
                )}

                {/* Density Row */}
                <div
                  onClick={handleToggleDensity}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Density
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {qskDensity === 'tight' ? 'Tight spacing' : 'Wide spacing'}
                    </span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 flex items-center ${
                      qskDensity === 'tight' ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                        qskDensity === 'tight' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. QSK Color Theme */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between px-1 py-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      QSK color theme
                    </span>
                    <div className="relative">
                      <select
                        value={qskStyle}
                        onChange={(e) => handleQskStyleChange(e.target.value)}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 pr-6 focus:outline-none focus:ring-1.5 focus:ring-sky-500 appearance-none font-medium cursor-pointer"
                      >
                        {QSK_STYLES.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 3. Language */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between px-1 py-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Language
                    </span>
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {(['en', 'ar', 'ckb'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleLanguageChange(lang)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                            qskLang === lang
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Divider */}
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
      {!isQskView && (
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
      )}

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


