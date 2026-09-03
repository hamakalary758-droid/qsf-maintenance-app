import React, { useState, useEffect } from 'react';
import { MaintenanceReport, AppTab } from './types';
import {
  getReportsFromStorage,
  saveReportToStorage,
  archiveReportInStorage,
  unarchiveReportInStorage,
  deleteReportFromStorage,
  saveDraftToStorage,
  saveDraftPhotosToStorage,
  getDraftFromStorage,
  clearDraftFromStorage,
  clearDraftTextOnly,
  generateReportId
} from './utils/storage';
import { validateReportForFinalization, ValidationError } from './utils/validation';
import { useTheme } from './hooks/useTheme';
import { showToast } from './utils/toastBus';
import { reportsBus } from './utils/reportsBus';
import { Navbar } from './components/Navbar';
import { PhaseTracker } from './components/PhaseTracker';
import { SetupGuide } from './components/SetupGuide';
import { ReportHistory } from './components/ReportHistory';
import { BasicInfoStep } from './components/ReportForm/BasicInfoStep';
import { FiveWOneHStep } from './components/ReportForm/FiveWOneHStep';
import { FiveWhyStep } from './components/ReportForm/FiveWhyStep';
import { ActionsAndPartsStep } from './components/ReportForm/ActionsAndPartsStep';
import { PhotoCaptureStep } from './components/ReportForm/PhotoCaptureStep';
import { ReviewScreen } from './components/ReviewScreen';
import { Dashboard } from './components/Dashboard';
import { EquipmentTemplate } from './constants/equipmentTemplates';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AppTab>('new-report');
  const [isQskView, setIsQskView] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  // Current active form report draft
  const [reportData, setReportData] = useState<Partial<MaintenanceReport>>({
    id: generateReportId(),
    reportNumber: '',
    title: '',
    technicianName: '',
    technicianId: '',
    date: new Date().toISOString().split('T')[0],
    shutdownName: '',
    equipmentName: '',
    equipmentCode: '',
    location: '',
    failureType: 'Mechanical Failure',
    fiveWOneH: {
      what: '',
      when: '',
      where: '',
      who: '',
      which: '',
      how: ''
    },
    fiveWhy: {
      why1: '',
      why2: '',
      why3: '',
      why4: '',
      why5: ''
    },
    correctiveActions: [],
    spareParts: [],
    photos: [],
    status: 'Draft'
  });

  // Load stored reports on mount
  useEffect(() => {
    let isMounted = true;

    // Part 5: Request persistent storage to reduce browser eviction risks under storage pressure
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().then(() => {
        // Persisted storage granted
      }).catch(() => {
        // Silently ignore — non-critical
      });
    }

    const loadInitialReports = async () => {
      setIsLoadingReports(true);
      setErrorMsg(null);
      try {
        const loaded = await getReportsFromStorage();
        if (isMounted) {
          setReports(loaded);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg("Couldn't load reports from storage. Operating in local mode.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingReports(false);
        }
      }

      // Check for draft in storage (with photos rehydrated from IndexedDB)
      try {
        const draft = await getDraftFromStorage();
        if (draft && draft.equipmentName && isMounted) {
          setReportData(draft);
        }
      } catch (err) {
        showToast("Couldn't reload your unsaved draft. You can start a fresh report.", 'info');
      }
    };

    loadInitialReports();

    const handleBrowserOnline = () => {
      getReportsFromStorage().then((updated) => {
        if (isMounted) {
          setReports(updated);
        }
      }).catch(() => {});
    };
    window.addEventListener('online', handleBrowserOnline);

    const handleDraftStorageWarning = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      if (customEvent.detail?.message && isMounted) {
        setDraftWarning(customEvent.detail.message);
      }
    };
    window.addEventListener('draft_storage_warning', handleDraftStorageWarning);

    const unsubscribeReportsBus = reportsBus.subscribe(() => {
      getReportsFromStorage().then((updated) => {
        if (isMounted) {
          setReports(updated);
        }
      }).catch(() => {});
    });

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('draft_storage_warning', handleDraftStorageWarning);
      unsubscribeReportsBus();
    };
  }, []);

  const sendInset = () => {
    let inset = 0;
    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    }
    const iframe = document.getElementById('qsk-content-iframe') as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage(
      { source: 'qsf-settings', type: 'SET_VV_BOTTOM_INSET', inset },
      window.location.origin
    );
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) {
        return; // Ignore messages from any other origin
      }
      if (e.data?.source === 'qsf-qsk' && e.data?.type === 'QSK_READY') {
        sendInset();
      }
    };

    window.addEventListener('message', handleMessage);
    sendInset();

    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      vv.addEventListener('resize', sendInset);
      vv.addEventListener('scroll', sendInset);
      return () => {
        window.removeEventListener('message', handleMessage);
        vv.removeEventListener('resize', sendInset);
        vv.removeEventListener('scroll', sendInset);
      };
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdateReportData = (updates: Partial<MaintenanceReport>) => {
    const updated = { ...reportData, ...updates };
    setReportData(updated);
    // When user modifies fields, clear existing validation errors if any were flagged
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    saveDraftToStorage(updated);
    if (updates.photos !== undefined && updated.id) {
      saveDraftPhotosToStorage(updated.id, updates.photos);
    }
  };

  const handleFinalizeReport = async () => {
    // 1. Strict validation gate — kill fallback chains
    const validationResult = validateReportForFinalization(reportData);
    if (!validationResult.valid) {
      setValidationErrors(validationResult.errors);
      setCurrentStepIndex(5); // Bring user to Review screen showing full audit errors
      setErrorMsg(`Please resolve the ${validationResult.errors.length} missing required field(s) before finalizing.`);
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    setErrorMsg(null);

    const finalReport: MaintenanceReport = {
      id: reportData.id || generateReportId(),
      reportNumber: reportData.reportNumber || '',
      title: reportData.title?.trim()
        ? reportData.title.trim()
        : `${reportData.equipmentName!.trim()} Shutdown Report`,
      technicianName: reportData.technicianName!.trim(),
      technicianId: (reportData.technicianId || '').trim(),
      date: reportData.date!.trim(),
      shutdownName: (reportData.shutdownName || '').trim(),
      equipmentName: reportData.equipmentName!.trim(),
      equipmentCode: reportData.equipmentCode!.trim(),
      location: reportData.location!.trim(),
      failureType: reportData.failureType!,
      fiveWOneH: reportData.fiveWOneH || { what: '', when: '', where: '', who: '', which: '', how: '' },
      fiveWhy: reportData.fiveWhy || { why1: '', why2: '', why3: '', why4: '', why5: '' },
      correctiveActions: reportData.correctiveActions || [],
      spareParts: reportData.spareParts || [],
      photos: reportData.photos || [],
      status: 'Finalized',
      version: reportData.version || 1,
      createdAt: reportData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const updatedList = await saveReportToStorage(finalReport);
      setReports(updatedList);
      await clearDraftTextOnly();

      // Reset draft form for next entry
      setReportData({
        id: generateReportId(),
        reportNumber: '',
        title: '',
        technicianName: '',
        technicianId: '',
        date: new Date().toISOString().split('T')[0],
        shutdownName: '',
        equipmentName: '',
        equipmentCode: '',
        location: '',
        failureType: 'Mechanical Failure',
        fiveWOneH: { what: '', when: '', where: '', who: '', which: '', how: '' },
        fiveWhy: { why1: '', why2: '', why3: '', why4: '', why5: '' },
        correctiveActions: [],
        spareParts: [],
        photos: [],
        status: 'Draft'
      });

      setCurrentStepIndex(0);
      setActiveTab('history');
    } catch (err) {
      setErrorMsg("Couldn't save report, check your connection. Your draft is safely saved locally.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectReportToEdit = (report: MaintenanceReport) => {
    setReportData(report);
    setValidationErrors([]);
    setCurrentStepIndex(5); // Go straight to Review Screen for full view
    setActiveTab('new-report');
  };

  const handleNewReport = () => {
    setValidationErrors([]);
    setReportData({
      id: generateReportId(),
      reportNumber: '',
      title: '',
      technicianName: '',
      technicianId: '',
      date: new Date().toISOString().split('T')[0],
      shutdownName: '',
      equipmentName: '',
      equipmentCode: '',
      location: '',
      failureType: 'Mechanical Failure',
      fiveWOneH: { what: '', when: '', where: '', who: '', which: '', how: '' },
      fiveWhy: { why1: '', why2: '', why3: '', why4: '', why5: '' },
      correctiveActions: [],
      spareParts: [],
      photos: [],
      status: 'Draft',
      notes: ''
    });
    setCurrentStepIndex(0);
    setActiveTab('new-report');
  };

  const handleDiscardDraft = () => {
    setShowDiscardModal(true);
  };

  const handleConfirmDiscard = () => {
    clearDraftFromStorage(reportData.id);
    handleNewReport();
    setShowDiscardModal(false);
  };

  const handleDuplicateReport = (source: MaintenanceReport) => {
    setValidationErrors([]);
    const originLine = `[Duplicated from ${source.reportNumber || 'PENDING report'} — ${source.equipmentName} (${source.equipmentCode}) — on ${new Date().toISOString().split('T')[0]}]`;
    const carriedNotes = source.notes ? `${originLine}\n${source.notes}` : originLine;

    setReportData({
      id: generateReportId(),
      reportNumber: '',
      title: '',
      technicianName: '',
      technicianId: '',
      date: new Date().toISOString().split('T')[0],
      shutdownName: source.shutdownName,
      equipmentName: source.equipmentName,
      equipmentCode: source.equipmentCode,
      location: source.location,
      failureType: source.failureType,
      fiveWOneH: { what: '', when: '', where: '', who: '', which: '', how: '' },
      fiveWhy: { why1: '', why2: '', why3: '', why4: '', why5: '' },
      correctiveActions: [],
      spareParts: [],
      photos: [],
      status: 'Draft',
      notes: carriedNotes
    });
    setCurrentStepIndex(0);
    setActiveTab('new-report');
  };

  const handleNewReportFromTemplate = (template: EquipmentTemplate) => {
    setValidationErrors([]);
    setReportData({
      id: generateReportId(),
      reportNumber: '',
      title: '',
      technicianName: '',
      technicianId: '',
      date: new Date().toISOString().split('T')[0],
      shutdownName: template.shutdownName || '',
      equipmentName: template.equipmentName,
      equipmentCode: template.equipmentCode,
      location: template.location,
      failureType: template.failureType,
      fiveWOneH: { what: '', when: '', where: '', who: '', which: '', how: '' },
      fiveWhy: { why1: '', why2: '', why3: '', why4: '', why5: '' },
      correctiveActions: [],
      spareParts: [],
      photos: [],
      status: 'Draft',
      notes: ''
    });
    setCurrentStepIndex(0);
    setActiveTab('new-report');
  };

  const handleArchiveReport = async (id: string, reason?: string) => {
    setErrorMsg(null);
    try {
      const updated = await archiveReportInStorage(id, 'Current User', reason);
      setReports(updated);
    } catch (err) {
      setErrorMsg("Couldn't archive report. Please check your storage connection.");
    }
  };

  const handleUnarchiveReport = async (id: string) => {
    setErrorMsg(null);
    try {
      const updated = await unarchiveReportInStorage(id);
      setReports(updated);
    } catch (err) {
      setErrorMsg("Couldn't restore report. Please check your storage connection.");
    }
  };

  const formStepTitles = [
    'Basic Info',
    '5W + 1H',
    '5-Why Analysis',
    'Actions & Parts',
    'Photos & Markup',
    'Review & Finalize'
  ];

  // Quick Demo Auto-Fill for instant field testing
  const prefillSampleData = () => {
    setReportData({
      ...reportData,
      title: 'Centrifugal Pump P-102A Impeller Cavitation',
      technicianName: 'Marcus Vance',
      technicianId: 'TECH-4092',
      date: '2026-08-15',
      shutdownName: '2026 August Major Plant Shutdown',
      equipmentName: 'Slurry Centrifugal Pump P-102A',
      equipmentCode: 'EQ-PMP-102A',
      location: 'Area 3 - Heavy Processing Unit',
      failureType: 'Mechanical Failure',
      fiveWOneH: {
        what: 'Impeller vanes severely pitted from cavitation and shaft vibration reached 12.4 mm/s RMS.',
        when: 'During Day Shift startup at 10:30 AM during pre-shutdown flush.',
        where: 'Suction housing and main impeller shaft bearing assembly #2.',
        who: 'Marcus Vance (Sr. Mechanical Tech) & Plant Operator David K.',
        which: 'Unit running under 85% high-viscosity slurry load prior to system drain.',
        how: 'Detected by inline vibration sensor alarm followed by acoustic cavitation noise.'
      },
      fiveWhy: {
        why1: 'Why did the pump fail? Excessive vibration and reduced flow rate during slurry transfer.',
        why2: 'Why was vibration high? Impeller balance was lost and front bearing seal degraded.',
        why3: 'Why did impeller lose balance? Severe pitting erosion and chunk breakage on 2 vanes.',
        why4: 'Why was pitting severe? Operating below minimum continuous stable flow (MCSF) for 48 hours.',
        why5: 'Why operated below MCSF? Bypass recirculation control valve CV-102 stuck in 15% open position due to debris.'
      },
      correctiveActions: [
        {
          id: 'ca-1',
          action: 'Replace eroded impeller with high-chrome alloy replacement (Part #IMP-8802).',
          assignee: 'Marcus Vance',
          priority: 'Critical',
          status: 'Completed',
          targetDate: '2026-08-15'
        }
      ],
      spareParts: [
        {
          id: 'sp-1',
          partName: 'Slurry Impeller 280mm Chrome Alloy',
          partNumber: 'IMP-8802-CR',
          quantity: 1,
          unitCost: 1450,
          status: 'Replaced'
        }
      ],
      photos: [
        {
          id: 'ph-demo-1',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          caption: 'Severe vane erosion and cavitation pitting on Impeller P-102A',
          timestamp: '2026-08-15 10:45'
        }
      ]
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        reportCount={reports.length}
        reports={reports}
        theme={theme}
        onToggleTheme={toggleTheme}
        onAutoFill={prefillSampleData}
        isQskView={isQskView}
        onToggleQskView={() => setIsQskView(prev => !prev)}
        geminiApiKey={geminiApiKey}
        onGeminiApiKeyChange={setGeminiApiKey}
        onConflictResolved={async () => {
          try {
            const updated = await getReportsFromStorage();
            setReports(updated);
          } catch (err) {
            showToast("Conflict was resolved, but refreshing the report list failed. Try reloading the page.", 'error');
          }
        }}
      />

      {/* Main Content Area — QSF (normal tabbed content) */}
      <main
        className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6"
        style={{ display: isQskView ? 'none' : undefined }}
      >
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-xs font-semibold">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg cursor-pointer"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Draft Storage Quota Warning Banner */}
        {draftWarning && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-bold block">Local Storage Notice</strong>
                <span>{draftWarning}</span>
              </div>
            </div>
            <button
              onClick={() => setDraftWarning(null)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1 rounded-lg cursor-pointer shrink-0"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: NEW REPORT FORM WIZARD */}
        {activeTab === 'new-report' && (
          <div className="space-y-4 pb-24 sm:pb-0">
            
            {/* Form Wizard Step Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    {formStepTitles[currentStepIndex]}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({currentStepIndex + 1} of {formStepTitles.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="flex items-center space-x-1 text-xs font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Discard this draft and start fresh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              </div>

              {/* Progress Steps Pills */}
              <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {formStepTitles.map((title, idx) => {
                  const isActive = currentStepIndex === idx;
                  const isDone = currentStepIndex > idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`py-1.5 px-1 text-[10px] font-bold rounded-lg text-center truncate transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm'
                          : isDone
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <span className="hidden sm:inline">{title}</span>
                      <span className="sm:hidden">#{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Form Component */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 shadow-sm">
              {currentStepIndex === 0 && (
                <BasicInfoStep reportData={reportData} onChange={handleUpdateReportData} />
              )}
              {currentStepIndex === 1 && (
                <FiveWOneHStep reportData={reportData} onChange={handleUpdateReportData} />
              )}
              {currentStepIndex === 2 && (
                <FiveWhyStep reportData={reportData} onChange={handleUpdateReportData} geminiApiKey={geminiApiKey} />
              )}
              {currentStepIndex === 3 && (
                <ActionsAndPartsStep reportData={reportData} onChange={handleUpdateReportData} />
              )}
              {currentStepIndex === 4 && (
                <PhotoCaptureStep reportData={reportData} onChange={handleUpdateReportData} />
              )}
              {currentStepIndex === 5 && (
                <ReviewScreen
                  reportData={reportData}
                  validationErrors={validationErrors}
                  onEditSection={(idx) => setCurrentStepIndex(idx)}
                  onFinalize={handleFinalizeReport}
                />
              )}
            </div>

            {/* Wizard Navigation Footer Buttons */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 sm:border sm:rounded-2xl shadow-sm fixed bottom-0 left-0 right-0 z-40 p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:static sm:z-auto sm:pb-3.5">
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
                className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl disabled:opacity-40 transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                Auto-Saved to Local Storage Cache
              </div>

              {currentStepIndex < formStepTitles.length - 1 ? (
                <button
                  onClick={() => setCurrentStepIndex((prev) => Math.min(formStepTitles.length - 1, prev + 1))}
                  className="py-2 px-5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinalizeReport}
                  disabled={isSaving}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalize & Save</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <ReportHistory
            reports={reports}
            isLoading={isLoadingReports}
            onSelectReport={handleSelectReportToEdit}
            onArchiveReport={handleArchiveReport}
            onUnarchiveReport={handleUnarchiveReport}
            onNewReport={handleNewReport}
            onDuplicateReport={handleDuplicateReport}
            onNewReportFromTemplate={handleNewReportFromTemplate}
          />
        )}

        {/* TAB 3: DASHBOARD */}
        {activeTab === 'dashboard' && <Dashboard reports={reports} />}

        {/* TAB 4: PHASE 2 SAFETY NET */}
        {activeTab === 'setup-guide' && <SetupGuide />}

        {/* TAB 5: 23-STEP CHECKLIST */}
        {activeTab === 'phase-checklist' && (
          <PhaseTracker onSelectTab={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Main Content Area — QSK Master Data Explorer (embedded, unmodified app, kept mounted so its session persists across toggles) */}
      <main
        className="flex-1 w-full flex flex-col"
        style={{ display: isQskView ? undefined : 'none' }}
      >
        <iframe
          id="qsk-content-iframe"
          src="/qsk/QSK_Master_Data_Explorer.html"
          title="QSK Master Data Explorer"
          className="flex-1 w-full border-0"
          style={{ minHeight: 'calc(100dvh - 130px)' }}
        />
      </main>

      {/* Discard Draft Confirmation Modal */}
      {showDiscardModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowDiscardModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Discard Report Draft?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to discard this draft and start a new report? All unsaved form inputs, photos, and analysis will be cleared. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Discard Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
