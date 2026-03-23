'use client';

import Link from 'next/link';
import { useState } from 'react';
import FeedbackInlineEditor from '@/components/feedback/FeedbackInlineEditor';
import FeedbackOwnerMenu from '@/components/feedback/FeedbackOwnerMenu';
import Card from '@/components/ui/Card';
import type { FeedbackThreadView } from '@/lib/types';

interface FeedbackThreadCardProps {
  thread: FeedbackThreadView;
  variant?: 'feed' | 'detail';
  editAction?: (prevState: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteAction?: (
    prevState: any,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean; redirectTo?: string }>;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function FeedbackThreadCard({
  thread,
  variant = 'feed',
  editAction,
  deleteAction,
}: FeedbackThreadCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const showActions = variant === 'feed';
  const lastActivityLabel =
    thread.lastActivityAt !== thread.created_at
      ? `Active ${formatDateTime(thread.lastActivityAt)}`
      : `Posted ${formatDateTime(thread.created_at)}`;
  const editedLabel = thread.editedAt ? 'Edited' : null;

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">{thread.publicAuthorLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <p>Posted {formatDateTime(thread.created_at)}</p>
            {editedLabel ? (
              <span className="rounded-full border border-[var(--color-border)]/60 px-2 py-0.5">
                {thread.editedAt ? 'Edited' : null}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
            {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
          </div>
          {thread.canEdit || thread.canDelete ? (
            <FeedbackOwnerMenu
              canEdit={thread.canEdit}
              canDelete={thread.canDelete}
              onEdit={() => setIsEditing(true)}
              deleteAction={deleteAction}
              deleteHiddenFields={[
                { name: 'threadId', value: thread.id },
                ...(variant === 'detail' ? [{ name: 'returnTo', value: '/feedback' }] : []),
              ]}
            />
          ) : null}
        </div>
      </div>

      {isEditing && editAction ? (
        <FeedbackInlineEditor
          action={editAction}
          hiddenFields={[{ name: 'threadId', value: thread.id }]}
          initialContent={thread.content}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
          {thread.content}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">{lastActivityLabel}</p>

        {showActions ? (
          <div className="flex items-center gap-3">
            <Link
              href={`/feedback/${thread.id}`}
              className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              View thread
            </Link>
            {thread.canReply ? (
              <Link
                href={`/feedback/${thread.id}`}
                className="rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--color-primary-light)] transition-colors hover:border-[var(--color-primary)]/70 hover:bg-[var(--color-primary)]/15"
              >
                Reply
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
