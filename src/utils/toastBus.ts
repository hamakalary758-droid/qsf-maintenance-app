export type ToastType = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  createdAt: number;
}

type ToastListener = (toast: ToastItem) => void;

class ToastBus {
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(message: string, type: ToastType = 'error', duration?: number): void {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const defaultDuration = type === 'error' ? 7000 : 5000;
    const toast: ToastItem = {
      id,
      message,
      type,
      duration: duration ?? defaultDuration,
      createdAt: Date.now()
    };

    this.listeners.forEach((listener) => {
      try {
        listener(toast);
      } catch {
        // Prevent listener errors from breaking emitter
      }
    });
  }
}

export const toastBus = new ToastBus();

/**
 * Universal showToast helper callable from both React components and vanilla utility files
 */
export function showToast(message: string, type: ToastType = 'error', duration?: number): void {
  toastBus.emit(message, type, duration);
}
