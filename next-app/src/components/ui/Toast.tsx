'use client';

import { useEffect } from 'react';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  durationMs?: number;
  variant?: ToastVariant;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: 'border-[var(--color-primary)]/40',
  success: 'border-[var(--color-success)]/40',
  warning: 'border-[var(--color-warning)]/40',
  error: 'border-[var(--color-error)]/40',
};

export default function Toast({
  message,
  onClose,
  durationMs = 5000,
  variant = 'info',
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, message, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] shadow-xl shadow-black/30 ${VARIANT_STYLES[variant]}`}
    >
      {message}
    </div>
  );
}
