'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthMethodPicker from '@/components/AuthMethodPicker';

interface SurveyIdentityModalProps {
  open: boolean;
  surveyId: string;
  returnTo: string;
  defaultGuestDisplayName?: string | null;
  onClose: () => void;
  onSubmitGuest: (mode: 'guest_named', guestDisplayName: string) => void;
}

export default function SurveyIdentityModal({
  open,
  surveyId,
  returnTo,
  defaultGuestDisplayName,
  onClose,
  onSubmitGuest,
}: SurveyIdentityModalProps) {
  const [guestDisplayName, setGuestDisplayName] = useState(
    defaultGuestDisplayName || ''
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setGuestDisplayName(defaultGuestDisplayName || '');
  }, [defaultGuestDisplayName, open]);

  const authResumeKey = useMemo(
    () => `survey-auth-resume:${surveyId}`,
    [surveyId]
  );

  if (!open) {
    return null;
  }

  const handleSkipLogin = () => {
    const trimmedName = guestDisplayName.trim();
    if (!trimmedName) {
      return;
    }

    onSubmitGuest('guest_named', trimmedName);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">
          Finish submitting your ballot
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Log in or enter a name to vote as a guest.
        </p>

        <div className="mt-5">
          <AuthMethodPicker
            flow="login"
            nextPath={returnTo}
            onAuthStart={() => localStorage.setItem(authResumeKey, '1')}
            extraContent={
              <div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-border)]/50" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                      or vote as guest with your name
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="surveyGuestDisplayName"
                    className="mb-2 block text-sm font-medium text-[var(--color-text)]"
                  >
                    Your name{' '}
                    <span
                      aria-hidden="true"
                      className="text-[var(--color-primary)]"
                    >
                      *
                    </span>
                  </label>
                  <input
                    id="surveyGuestDisplayName"
                    type="text"
                    required
                    value={guestDisplayName}
                    onChange={(event) => setGuestDisplayName(event.target.value)}
                    maxLength={50}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSkipLogin}
                  disabled={!guestDisplayName.trim()}
                  className="w-full rounded-xl border border-[var(--color-border)]/60 px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors enabled:hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Vote as guest
                </button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
