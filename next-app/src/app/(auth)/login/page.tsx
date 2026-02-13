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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Sign in to your account</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
          {errorParam && errorMessages[errorParam] && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
              {errorMessages[errorParam]}
            </div>
          )}

          <AuthMethodPicker flow="login" />

          <div className="mt-6 text-center text-[var(--color-text-muted)] text-sm">
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
