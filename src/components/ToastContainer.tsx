import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastItem } from '../utils/toastBus';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        let containerStyle = 'bg-slate-900/95 dark:bg-slate-900/95 border-slate-700 text-slate-100 shadow-xl';
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

        if (isError) {
          containerStyle = 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 shadow-xl shadow-rose-950/10';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
        } else if (isSuccess) {
          containerStyle = 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 shadow-xl shadow-emerald-950/10';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 animate-fadeIn ${containerStyle}`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
