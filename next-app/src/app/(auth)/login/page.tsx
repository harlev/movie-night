'use client';

import { useActionState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from '@/lib/actions/auth';
import { useState, Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const showResetSuccess = searchParams.get('reset') === 'success';
  const [state, formAction, pending] = useActionState(login, null);
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
          <p className="text-[var(--color-text-muted)] mt-2">Sign in to your account</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          {showResetSuccess && (
            <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 mb-6">
              Password reset successful. Please sign in with your new password.
            </div>
          )}

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
              {state.error}
            </div>
          )}

          <form action={formAction}>
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

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="••••••••"
              />
              <label className="flex items-center mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="mr-2 accent-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-text-muted)]">Show password</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/forgot-password" className="text-[var(--color-primary)] hover:underline text-sm">
              Forgot your password?
            </a>
          </div>

          <div className="mt-4 text-center text-[var(--color-text-muted)] text-sm">
            Have an invite code?{' '}
            <a href="/signup" className="text-[var(--color-primary)] hover:underline">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
