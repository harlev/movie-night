'use client';

import { useEffect, useState } from 'react';
import { getSuggestionAcceptedToast } from '@/lib/utils/suggestMovieFlow';

interface SuggestionAcceptedToastProps {
  show: boolean;
}

export default function SuggestionAcceptedToast({ show }: SuggestionAcceptedToastProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] shadow-xl shadow-black/30"
    >
      {getSuggestionAcceptedToast()}
    </div>
  );
}
