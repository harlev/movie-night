'use client';

import { useActionState, useState, useEffect } from 'react';
import { validateBootstrapAndSetCookie } from '@/lib/actions/auth';
import AuthMethodPicker from '@/components/AuthMethodPicker';

export default function BootstrapForm() {
  const [step, setStep] = useState(1);
  const [bootstrapState, bootstrapAction, bootstrapPending] = useActionState(
    validateBootstrapAndSetCookie,
    null
  );

  useEffect(() => {
    if (bootstrapState?.success) {
      setStep(2);
    }
  }, [bootstrapState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">
            {step === 1 ? 'Create the first admin account' : 'Choose how to sign in'}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)] text-[var(--color-warning)] rounded-lg p-3 mb-6">
            <p className="text-sm">
              This page allows you to create the first admin account. It will only work once — when
              there are no users in the database.
            </p>
          </div>

          {step === 1 && (
            <>
              {bootstrapState?.error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
                  {bootstrapState.error}
                </div>
              )}

              <form action={bootstrapAction}>
                <div className="mb-6">
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-[var(--color-text)] mb-2"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={bootstrapState?.displayName || ''}
                    required
                    className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="Admin"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bootstrapPending}
                  className="w-full py-2 px-4 bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bootstrapPending ? 'Validating...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <AuthMethodPicker flow="bootstrap" />

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
