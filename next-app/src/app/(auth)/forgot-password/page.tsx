'use client';

import { useActionState } from 'react';
import { forgotPassword } from '@/lib/actions/auth';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPassword, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Reset your password</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          {state?.success ? (
            <>
              <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-4 mb-6">
                <p className="font-medium">Check your email</p>
                <p className="text-sm mt-1">If an account exists with that email, we&apos;ve sent password reset instructions.</p>
              </div>
              <a href="/login" className="block w-full text-center py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors">
                Back to Login
              </a>
            </>
          ) : (
            <>
              {state?.error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">{state.error}</div>
              )}
              <p className="text-[var(--color-text-muted)] text-sm mb-6">Enter your email address and we&apos;ll send you instructions to reset your password.</p>
              <form action={formAction}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">Email</label>
                  <input type="email" id="email" name="email" required className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="you@example.com" />
                </div>
                <button type="submit" disabled={pending} className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {pending ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <a href="/login" className="text-[var(--color-primary)] hover:underline text-sm">Back to login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
