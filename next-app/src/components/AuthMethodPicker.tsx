'use client';

import { useActionState, useState } from 'react';
import { sendMagicLink, signInWithOAuth } from '@/lib/actions/auth';

interface AuthMethodPickerProps {
  flow: 'login' | 'signup' | 'bootstrap';
}

export default function AuthMethodPicker({ flow }: AuthMethodPickerProps) {
  const [state, formAction, pending] = useActionState(sendMagicLink, null);
  const [oauthPending, setOauthPending] = useState(false);

  return (
    <>
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-4 mb-6">
          <p className="font-medium">Check your email</p>
          <p className="text-sm mt-1">We sent you a sign-in link. Click it to continue.</p>
        </div>
      )}

      {/* Google OAuth */}
      <form
        action={async () => {
          setOauthPending(true);
          await signInWithOAuth();
        }}
      >
        <button
          type="submit"
          disabled={oauthPending}
          className="w-full py-2.5 px-4 bg-white text-gray-900 font-medium rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {oauthPending ? 'Redirecting...' : 'Continue with Google'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Magic link form */}
      <form action={formAction}>
        <input type="hidden" name="flow" value={flow} />
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {pending ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </form>
    </>
  );
}
