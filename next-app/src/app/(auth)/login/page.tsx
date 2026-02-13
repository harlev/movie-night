'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthMethodPicker from '@/components/AuthMethodPicker';

const errorMessages: Record<string, string> = {
  auth_failed: 'Authentication failed. Please try again.',
  account_disabled: 'Your account has been disabled.',
  no_invite: 'You need an invite code to create an account.',
};

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-primary)]/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-secondary)]/8 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Movie Night" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-display italic font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Your private cinema club</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl p-8 shadow-2xl shadow-black/40 border border-[var(--color-border)]/50">
          {errorParam && errorMessages[errorParam] && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 mb-6">
              {errorMessages[errorParam]}
            </div>
          )}

          <AuthMethodPicker flow="login" />

          <div className="mt-6 text-center text-[var(--color-text-muted)] text-sm">
            Have an invite code?{' '}
            <a href="/signup" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Sign up</a>
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
