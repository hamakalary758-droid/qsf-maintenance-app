import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToastItem, ToastType, showToast as busShowToast, toastBus } from '../utils/toastBus';
import { ToastContainer } from '../components/ToastContainer';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'error', duration?: number) => {
    busShowToast(message, type, duration);
  }, []);

  useEffect(() => {
    const unsubscribe = toastBus.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    });

    return unsubscribe;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: busShowToast,
      removeToast: () => {},
      toasts: []
    };
  }
  return context;
};
