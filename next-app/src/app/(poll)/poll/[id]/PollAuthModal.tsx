'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PollAuthModalProps {
  pollId: string;
}

export default function PollAuthModal({ pollId }: PollAuthModalProps) {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [oauthPending, setOauthPending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkPending, setMagicLinkPending] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setOauthPending(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/poll/${pollId}`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthPending(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMagicLinkPending(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/poll/${pollId}`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setError(error.message);
      setMagicLinkPending(false);
    } else {
      setMagicLinkSent(true);
      setMagicLinkPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)]/50 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/40 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-display font-semibold text-[var(--color-text)] text-center mb-1">
          Sign in to vote with your name
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] text-center mb-5">
          Your name will appear on your ballot
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={oauthPending}
          className="w-full py-2.5 px-4 bg-white text-gray-900 font-medium rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {oauthPending ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">or use email</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        {magicLinkSent ? (
          <div className="text-center py-3">
            <div className="text-2xl mb-2">✉️</div>
            <p className="text-sm font-medium text-[var(--color-text)]">Check your email</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              We sent a sign-in link to <span className="font-medium text-[var(--color-text)]">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 min-w-0 px-3 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <button
              type="submit"
              disabled={magicLinkPending || !email.trim()}
              className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 whitespace-nowrap"
            >
              {magicLinkPending ? 'Sending...' : 'Send Link'}
            </button>
          </form>
        )}

        {/* Dismiss */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full mt-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-center"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}
