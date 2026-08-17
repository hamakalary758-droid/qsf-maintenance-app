import React, { useState, useEffect } from 'react';
import { MaintenanceReport, AppTab } from './types';
import {
  getReportsFromStorage,
  saveReportToStorage,
  deleteReportFromStorage,
  saveDraftToStorage,
  getDraftFromStorage,
  clearDraftFromStorage
} from './utils/storage';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/Navbar';
import { PhaseTracker } from './components/PhaseTracker';
import { MockupsView } from './components/MockupsView';
import { SetupGuide } from './components/SetupGuide';
import { ReportHistory } from './components/ReportHistory';
import { BasicInfoStep } from './components/ReportForm/BasicInfoStep';
import { FiveWOneHStep } from './components/ReportForm/FiveWOneHStep';
import { FiveWhyStep } from './components/ReportForm/FiveWhyStep';
import { ActionsAndPartsStep } from './components/ReportForm/ActionsAndPartsStep';
import { PhotoCaptureStep } from './components/ReportForm/PhotoCaptureStep';
import { ReviewScreen } from './components/ReviewScreen';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AppTab>('new-report');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Current active form report draft
  const [reportData, setReportData] = useState<Partial<MaintenanceReport>>({
    id: 'rep-' + Date.now(),
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
    const loadInitialReports = async () => {
      setIsLoadingReports(true);
      setErrorMsg(null);
      try {
        const loaded = await getReportsFromStorage();
        if (isMounted) {
          setReports(loaded);
        }
      } catch (err) {
        console.error('Failed to load reports on mount:', err);
        if (isMounted) {
          setErrorMsg("Couldn't load reports from storage. Operating in local mode.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingReports(false);
        }
      }

      // Check for draft in storage
      const draft = getDraftFromStorage();
      if (draft && draft.equipmentName) {
        setReportData(draft);
      }
    };

    loadInitialReports();

    // Refetch reports once whenever the browser genuinely regains network
    // connectivity (e.g. a pending item completes sync and receives its
    // report_number). This listens to the browser's real 'online' event,
    // which fires only on an actual reconnect — NOT to the app's internal
    // sync-status broadcasts, which fire repeatedly (including a transient
    // 'syncing' state on every sync attempt, even when nothing needs
    // syncing) and previously caused an infinite refetch loop.
    const handleBrowserOnline = () => {
      getReportsFromStorage().then((updated) => {
        if (isMounted) {
          setReports(updated);
        }
      }).catch(() => {});
    };
    window.addEventListener('online', handleBrowserOnline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleBrowserOnline);
    };
  }, []);

  const handleUpdateReportData = (updates: Partial<MaintenanceReport>) => {
    const updated = { ...reportData, ...updates };
    setReportData(updated);
    saveDraftToStorage(updated);
  };

  const handleFinalizeReport = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    const finalReport: MaintenanceReport = {
      id: reportData.id || 'rep-' + Date.now(),
      reportNumber: reportData.reportNumber || '',
      title: reportData.title?.trim()
        ? reportData.title
        : (reportData.equipmentName ? `${reportData.equipmentName} Shutdown Report` : 'Shutdown Maintenance Report'),
      technicianName: reportData.technicianName || '',
      technicianId: reportData.technicianId || '',
      date: reportData.date || new Date().toISOString().split('T')[0],
      shutdownName: reportData.shutdownName || '',
      equipmentName: reportData.equipmentName || 'Unspecified Equipment',
      equipmentCode: reportData.equipmentCode || 'EQ-000',
      location: reportData.location || 'Plant Floor',
      failureType: reportData.failureType || 'Mechanical Failure',
      fiveWOneH: reportData.fiveWOneH || { what: '', when: '', where: '', who: '', which: '', how: '' },
      fiveWhy: reportData.fiveWhy || { why1: '', why2: '', why3: '', why4: '', why5: '' },
      correctiveActions: reportData.correctiveActions || [],
      spareParts: reportData.spareParts || [],
      photos: reportData.photos || [],
      status: 'Finalized',
      createdAt: reportData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const updatedList = await saveReportToStorage(finalReport);
      setReports(updatedList);
      clearDraftFromStorage();

      // Reset draft form for next entry
      setReportData({
        id: 'rep-' + Date.now(),
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
      console.error('Failed to save report to database:', err);
      setErrorMsg("Couldn't save report, check your connection. Your draft is safely saved locally.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectReportToEdit = (report: MaintenanceReport) => {
    setReportData(report);
    setCurrentStepIndex(5); // Go straight to Review Screen for full view
    setActiveTab('new-report');
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this saved report?')) {
      setErrorMsg(null);
      try {
        const updated = await deleteReportFromStorage(id);
        setReports(updated);
      } catch (err) {
        console.error('Failed to delete report:', err);
        setErrorMsg("Couldn't delete report. Please check your connection.");
      }
    }
  };

  const formSteps = [
    { title: 'Basic Info', component: <BasicInfoStep reportData={reportData} onChange={handleUpdateReportData} /> },
    { title: '5W + 1H', component: <FiveWOneHStep reportData={reportData} onChange={handleUpdateReportData} /> },
    { title: '5-Why Analysis', component: <FiveWhyStep reportData={reportData} onChange={handleUpdateReportData} /> },
    { title: 'Actions & Parts', component: <ActionsAndPartsStep reportData={reportData} onChange={handleUpdateReportData} /> },
    { title: 'Photos & Markup', component: <PhotoCaptureStep reportData={reportData} onChange={handleUpdateReportData} /> },
    { title: 'Review & Finalize', component: <ReviewScreen reportData={reportData} onEditSection={(idx) => setCurrentStepIndex(idx)} onFinalize={handleFinalizeReport} /> }
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
        theme={theme}
        onToggleTheme={toggleTheme}
        onAutoFill={prefillSampleData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-xs font-semibold">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: NEW REPORT FORM WIZARD */}
        {activeTab === 'new-report' && (
          <div className="space-y-4">
            
            {/* Form Wizard Step Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    {formSteps[currentStepIndex].title}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({currentStepIndex + 1} of {formSteps.length})</span>
                </div>
              </div>

              {/* Progress Steps Pills */}
              <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {formSteps.map((step, idx) => {
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
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">#{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Form Component */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 shadow-sm">
              {formSteps[currentStepIndex].component}
            </div>

            {/* Wizard Navigation Footer Buttons */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm">
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

              {currentStepIndex < formSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentStepIndex((prev) => Math.min(formSteps.length - 1, prev + 1))}
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
            onDeleteReport={handleDeleteReport}
            onNewReport={() => {
              setCurrentStepIndex(0);
              setActiveTab('new-report');
            }}
          />
        )}

        {/* TAB 3: PHASE 1 MOCKUPS */}
        {activeTab === 'mockups' && <MockupsView />}

        {/* TAB 4: PHASE 2 SAFETY NET */}
        {activeTab === 'setup-guide' && <SetupGuide />}

        {/* TAB 5: 23-STEP CHECKLIST */}
        {activeTab === 'phase-checklist' && (
          <PhaseTracker onSelectTab={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-4 text-center text-xs">
        <p className="font-semibold text-slate-300">
          Shutdown Maintenance Reporter &bull; Mobile Plant Companion
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Designed for mobile field entry with offline local cache, 5W+1H, 5-Why analysis, photo markup, and Excel/PDF/Word exports.
        </p>
      </footer>
    </div>
  );
}
