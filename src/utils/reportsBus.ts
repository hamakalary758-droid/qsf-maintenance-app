type ReportsChangedListener = () => void;

class ReportsBus {
  private listeners: Set<ReportsChangedListener> = new Set();

  subscribe(listener: ReportsChangedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyChanged(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Prevent one listener's error from breaking others
      }
    });
  }
}

export const reportsBus = new ReportsBus();

export function notifyReportsChanged(): void {
  reportsBus.notifyChanged();
}
