import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  tone: 'error' | 'success';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  const isError = toast.tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="fixed bottom-5 right-5 z-50 max-w-[380px] w-[calc(100vw-2.5rem)] bg-[var(--tf-surface-solid)] border border-[var(--tf-border)] rounded-xl px-4 py-3 shadow-[var(--tf-shadow-2)] flex items-start gap-3"
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 text-[var(--tf-danger-ink)] mt-0.5 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-[var(--tf-success-ink)] mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <p className="flex-1 text-[13px] leading-[18px] font-medium text-[var(--tf-ink)]">
        {toast.text}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="w-6 h-6 -mr-1 -mt-0.5 inline-flex items-center justify-center rounded-md text-[var(--tf-ink-muted)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
