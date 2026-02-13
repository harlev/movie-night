'use client';

import { useActionState, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { validateInviteAndSetCookie } from '@/lib/actions/auth';
import AuthMethodPicker from '@/components/AuthMethodPicker';

function SignupForm() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  const errorFromUrl = searchParams.get('error');
  const [step, setStep] = useState(1);
  const [inviteState, inviteAction, invitePending] = useActionState(validateInviteAndSetCookie, null);

  useEffect(() => {
    if (inviteState?.success) {
      setStep(2);
    }
  }, [inviteState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-primary)]/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-secondary)]/8 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Movie Night" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-display italic font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">
            {step === 1 ? 'Create your account' : 'Choose how to sign in'}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl p-8 shadow-2xl shadow-black/40 border border-[var(--color-border)]/50">
          {errorFromUrl === 'no_invite' && step === 1 && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 mb-6">
              You need a valid invite code to create an account.
            </div>
          )}

          {step === 1 && (
            <>
              {inviteState?.error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 mb-6">
                  {inviteState.error}
                </div>
              )}

              <form action={inviteAction}>
                <div className="mb-4">
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    id="inviteCode"
                    name="inviteCode"
                    defaultValue={inviteState?.inviteCode || codeFromUrl}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all uppercase"
                    placeholder="ABCD1234"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="displayName" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={inviteState?.displayName || ''}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <button
                  type="submit"
                  disabled={invitePending}
                  className="w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 shadow-md shadow-[var(--color-primary)]/20"
                >
                  {invitePending ? 'Validating...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <AuthMethodPicker flow="signup" />

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Back
              </button>
            </>
          )}

          <div className="mt-6 text-center text-[var(--color-text-muted)] text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
