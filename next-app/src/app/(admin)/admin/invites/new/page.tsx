'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createInviteAction } from '@/lib/actions/invites';
import QRCodeDisplay from '@/components/QRCodeDisplay';

export default function NewInvitePage() {
  const [state, formAction, pending] = useActionState(createInviteAction, null);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  function handleCopyCode(code: string) {
    copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyUrl(code: string) {
    const url = `${window.location.origin}/signup?code=${code}`;
    copyToClipboard(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <Link
          href="/admin/invites"
          className="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invites
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">Generate Invite</h1>
      </div>

      {state?.success && state.invite ? (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] rounded-lg p-4 mb-4">
            <p className="text-[var(--color-success)] font-medium">Invite created successfully!</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Invite Code
              </label>
              <div className="flex gap-2">
                <code className="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] rounded-lg text-lg font-mono text-[var(--color-text)] text-center">
                  {state.invite.code}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyCode(state.invite.code)}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Sign-up Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?code=${state.invite.code}`}
                  className="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] rounded-lg text-sm text-[var(--color-text)]"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(state.invite.code)}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                QR Code
              </label>
              <QRCodeDisplay
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?code=${state.invite.code}`}
              />
            </div>

            <p className="text-sm text-[var(--color-text-muted)]">
              Role:{' '}
              <span className="text-[var(--color-text)] capitalize">{state.invite.role || 'member'}</span>
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Expires:{' '}
              {new Date(state.invite.expires_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/invites"
              className="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Back to Invites
            </Link>
            <Link
              href="/admin/invites/new"
              className="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors"
            >
              Generate Another
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
              {state.error}
            </div>
          )}

          <form action={formAction}>
            <div className="mb-6">
              <label htmlFor="expiresInDays" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Expires In
              </label>
              <select
                id="expiresInDays"
                name="expiresInDays"
                defaultValue="7"
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Viewers can browse content but cannot suggest movies, vote, or comment.
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {pending ? 'Generating...' : 'Generate Invite Code'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
