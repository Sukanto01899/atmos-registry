import { useEffect } from "react";

export type ToastVariant = "success" | "info" | "critical";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  info: "ℹ",
  critical: "⚠",
};

const TOAST_TTL = 4000;

/** Infer a toast tone from the feedback message text. */
export function inferToastVariant(message: string): ToastVariant {
  const text = message.toLowerCase();
  if (
    /\b(unable|failed|fail|error|invalid|not found|denied|unavailable)\b/.test(
      text,
    ) ||
    text.includes("check browser")
  ) {
    return "critical";
  }
  if (
    /\b(no |nothing|already|enter |paste |empty|cleared|requires)\b/.test(text)
  ) {
    return "info";
  }
  return "success";
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_TTL);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast toast--${toast.variant}`} role="status">
      <span className="toast__icon" aria-hidden="true">
        {ICONS[toast.variant]}
      </span>
      <span className="toast__body">{toast.message}</span>
      <button
        className="toast__close"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
