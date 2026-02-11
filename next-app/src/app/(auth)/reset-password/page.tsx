'use client';

import { useActionState } from 'react';
import { resetPassword } from '@/lib/actions/auth';

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Reset your password</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">{state.error}</div>
          )}
          <form action={formAction}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">New Password</label>
              <input type="password" id="password" name="password" required minLength={8} className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="••••••••" />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">At least 8 characters</p>
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text)] mb-2">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={pending} className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {pending ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
