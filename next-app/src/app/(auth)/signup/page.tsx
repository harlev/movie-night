'use client';

import { useActionState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signup } from '@/lib/actions/auth';
import { useState, Suspense } from 'react';

function SignupForm() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  const [state, formAction, pending] = useActionState(signup, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      window.location.href = '/dashboard';
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Create your account</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
              {state.error}
            </div>
          )}

          <form action={formAction}>
            <div className="mb-4">
              <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                name="inviteCode"
                defaultValue={state?.inviteCode || codeFromUrl}
                required
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors uppercase"
                placeholder="ABCD1234"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={state?.email || ''}
                required
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                defaultValue={state?.displayName || ''}
                required
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                minLength={8}
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="••••••••"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">At least 8 characters</p>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                required
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="mr-2 accent-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-text-muted)]">Show passwords</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-[var(--color-text-muted)] text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-[var(--color-primary)] hover:underline">Sign in</a>
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
