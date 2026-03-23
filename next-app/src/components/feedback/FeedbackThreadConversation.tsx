'use client';

import { useMemo, useState } from 'react';
import type { FeedbackThreadView, Profile } from '@/lib/types';
import { buildDirectedReplyPrefix } from '@/lib/utils/feedback';
import FeedbackComposer from '@/components/feedback/FeedbackComposer';
import FeedbackInlineEditor from '@/components/feedback/FeedbackInlineEditor';
import FeedbackOwnerMenu from '@/components/feedback/FeedbackOwnerMenu';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

interface FeedbackThreadConversationProps {
  action: (prevState: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  editReplyAction: (prevState: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteReplyAction: (
    prevState: any,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean; redirectTo?: string }>;
  thread: FeedbackThreadView;
  userRole?: Profile['role'];
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function FeedbackThreadConversation({
  action,
  editReplyAction,
  deleteReplyAction,
  thread,
  userRole,
}: FeedbackThreadConversationProps) {
  const [replyTargetLabel, setReplyTargetLabel] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  const initialReplyContent = useMemo(
    () => (replyTargetLabel ? buildDirectedReplyPrefix(replyTargetLabel) : ''),
    [replyTargetLabel]
  );

  function handleReplyTo(label: string) {
    setReplyTargetLabel(label);
    document.getElementById('reply-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">Replies</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {thread.replyCount > 0
                ? `${thread.replyCount} ${thread.replyCount === 1 ? 'reply' : 'replies'} in this thread.`
                : 'No replies yet.'}
            </p>
          </div>
        </div>

        {thread.replies.length > 0 ? (
          <Card padding="md" className="space-y-3">
            {thread.replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {reply.publicAuthorLabel}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <p>{formatDateTime(reply.created_at)}</p>
                      {reply.editedAt ? (
                        <span className="rounded-full border border-[var(--color-border)]/60 px-2 py-0.5">
                          Edited
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {reply.canEdit || reply.canDelete ? (
                    <div className="self-start shrink-0">
                      <FeedbackOwnerMenu
                        canEdit={reply.canEdit}
                        canDelete={reply.canDelete}
                        onEdit={() => setEditingReplyId(reply.id)}
                        deleteAction={deleteReplyAction}
                        deleteHiddenFields={[{ name: 'replyId', value: reply.id }]}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="mt-2">
                  {editingReplyId === reply.id ? (
                    <FeedbackInlineEditor
                      action={editReplyAction}
                      hiddenFields={[{ name: 'replyId', value: reply.id }]}
                      initialContent={reply.content}
                      onCancel={() => setEditingReplyId(null)}
                      onSuccess={() => setEditingReplyId(null)}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
                      {reply.content}
                    </p>
                  )}
                </div>
                {thread.canReply ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleReplyTo(reply.publicAuthorLabel)}
                      className="inline-flex items-center text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
                    >
                      Reply
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </Card>
        ) : (
          <Card padding="md">
            <EmptyState
              icon="comments"
              title="No replies yet"
              description="Start the thread by adding the first reply."
            />
          </Card>
        )}
      </section>

      <div id="reply-composer">
        {thread.canReply ? (
          <FeedbackComposer
            action={action}
            mode="reply"
            threadId={thread.id}
            userRole={userRole}
            initialContent={initialReplyContent}
            replyTargetLabel={replyTargetLabel}
            onClearReplyTarget={() => setReplyTargetLabel(null)}
            autoFocusKey={replyTargetLabel || ''}
          />
        ) : (
          <Card padding="md">
            <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              You can’t reply to a deleted thread.
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
