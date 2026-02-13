'use client';

import React, { useActionState, useState } from 'react';
import Link from 'next/link';
import { expireInviteAction } from '@/lib/actions/invites';
import type { Invite } from '@/lib/types';
import QRCodeDisplay from '@/components/QRCodeDisplay';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function getStatusColor(status: string, expiresAt: string): string {
  if (status === 'expired' || isExpired(expiresAt))
    return 'bg-[var(--color-error)]/10 text-[var(--color-error)]';
  return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
}

function getDisplayStatus(status: string, expiresAt: string): string {
  if (status === 'expired' || isExpired(expiresAt)) return 'Expired';
  return 'Active';
}

interface InviteWithDetails extends Invite {
  creatorName: string;
  users: Array<{ userId: string; displayName: string; usedAt: string }>;
}

function CopyButton({ invite }: { invite: InviteWithDetails }) {
  const [copied, setCopied] = useState(false);

  function copyInviteUrl() {
    const url = `${window.location.origin}/signup?code=${invite.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        onClick={copyInviteUrl}
        className="ml-1.5 inline-flex items-center justify-center w-6 h-6 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-[var(--color-border)]">
        {copied ? 'Copied!' : 'Copy signup URL'}
      </span>
    </span>
  );
}

function QRButton({ inviteId, onToggle, isOpen }: { inviteId: string; onToggle: () => void; isOpen: boolean }) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        onClick={onToggle}
        className={`ml-1 inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
          isOpen
            ? 'text-[var(--color-primary)] bg-[var(--color-surface-elevated)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)]'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v3m0 3h.01M14 17h3" />
        </svg>
      </button>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-[var(--color-border)]">
        {isOpen ? 'Hide QR code' : 'Show QR code'}
      </span>
    </span>
  );
}

function ExpireButton({ inviteId }: { inviteId: string }) {
  const [state, formAction, pending] = useActionState(expireInviteAction, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="inviteId" value={inviteId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-[var(--color-error)] hover:underline disabled:opacity-50"
      >
        {pending ? '...' : 'Expire'}
      </button>
    </form>
  );
}

export default function InviteActions({ invites }: { invites: InviteWithDetails[] }) {
  const [expandedInvites, setExpandedInvites] = useState<Set<string>>(new Set());
  const [qrExpanded, setQrExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(inviteId: string) {
    setExpandedInvites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(inviteId)) {
        newSet.delete(inviteId);
      } else {
        newSet.add(inviteId);
      }
      return newSet;
    });
  }

  function toggleQR(inviteId: string) {
    setQrExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(inviteId)) {
        newSet.delete(inviteId);
      } else {
        newSet.add(inviteId);
      }
      return newSet;
    });
  }

  if (invites.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
        <p className="text-[var(--color-text-muted)]">No invites created yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--color-surface-elevated)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Created By
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Expires
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Uses
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {invites.map((invite) => (
            <React.Fragment key={invite.id}>
              <tr className="hover:bg-[var(--color-surface-elevated)]/50">
                <td className="px-4 py-4">
                  <code className="px-2 py-1 bg-[var(--color-surface-elevated)] rounded text-sm font-mono text-[var(--color-text)]">
                    {invite.code}
                  </code>
                  <CopyButton invite={invite} />
                  {invite.status === 'active' && !isExpired(invite.expires_at) && (
                    <QRButton
                      inviteId={invite.id}
                      onToggle={() => toggleQR(invite.id)}
                      isOpen={qrExpanded.has(invite.id)}
                    />
                  )}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(invite.status, invite.expires_at)}`}
                  >
                    {getDisplayStatus(invite.status, invite.expires_at)}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                  {invite.creatorName}
                </td>
                <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                  {formatDate(invite.expires_at)}
                </td>
                <td className="px-4 py-4">
                  {invite.use_count > 0 ? (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(invite.id)}
                      className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                      <span className="font-medium">{invite.use_count}</span>
                      <span className="text-[var(--color-text-muted)]">
                        {invite.use_count === 1 ? 'user' : 'users'}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedInvites.has(invite.id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-sm text-[var(--color-text-muted)]">0 users</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  {invite.status === 'active' && !isExpired(invite.expires_at) && (
                    <ExpireButton inviteId={invite.id} />
                  )}
                </td>
              </tr>
              {expandedInvites.has(invite.id) && invite.users.length > 0 && (
                <tr className="bg-[var(--color-surface-elevated)]/30">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="pl-4 border-l-2 border-[var(--color-border)]">
                      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                        Users who joined with this invite:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {invite.users.map((user) => (
                          <span
                            key={user.userId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-surface)] rounded text-sm"
                          >
                            <span className="text-[var(--color-text)]">{user.displayName}</span>
                            <span className="text-[var(--color-text-muted)] text-xs">
                              ({formatDate(user.usedAt)})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {qrExpanded.has(invite.id) && (
                <tr className="bg-[var(--color-surface-elevated)]/30">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="flex justify-center">
                      <QRCodeDisplay
                        url={`${window.location.origin}/signup?code=${invite.code}`}
                        size={160}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
