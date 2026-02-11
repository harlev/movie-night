'use client';

import { useActionState, useEffect } from 'react';
import { bootstrap } from '@/lib/actions/auth';

export default function BootstrapForm() {
  const [state, formAction, pending] = useActionState(bootstrap, null);

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
          <p className="text-[var(--color-text-muted)] mt-2">Create the first admin account</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)] text-[var(--color-warning)] rounded-lg p-3 mb-6">
            <p className="text-sm">
              This page allows you to create the first admin account. It will only work once - when there are no users in the database.
            </p>
          </div>

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
              {state.error}
            </div>
          )}

          <form action={formAction}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">Email</label>
              <input type="email" id="email" name="email" defaultValue={state?.email || ''} required className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="admin@example.com" />
            </div>

            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-[var(--color-text)] mb-2">Display Name</label>
              <input type="text" id="displayName" name="displayName" defaultValue={state?.displayName || ''} required className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="Admin" />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">Password</label>
              <input type="password" id="password" name="password" required minLength={8} className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="••••••••" />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">At least 8 characters</p>
            </div>

            <button type="submit" disabled={pending} className="w-full py-2 px-4 bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {pending ? 'Creating Admin...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
