'use client';

import { useMemo, useState } from 'react';
import type { FeedbackThreadView, Profile } from '@/lib/types';
import { buildDirectedReplyPrefix } from '@/lib/utils/feedback';
import FeedbackComposer from '@/components/feedback/FeedbackComposer';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

interface FeedbackThreadConversationProps {
  action: (prevState: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
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
  thread,
  userRole,
}: FeedbackThreadConversationProps) {
  const [replyTargetLabel, setReplyTargetLabel] = useState<string | null>(null);

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
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {formatDateTime(reply.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReplyTo(reply.publicAuthorLabel)}
                    className="text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
                  >
                    Reply
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
                  {reply.content}
                </p>
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
      </div>
    </>
  );
}
