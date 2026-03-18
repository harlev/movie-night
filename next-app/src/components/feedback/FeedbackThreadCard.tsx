import Link from 'next/link';
import Card from '@/components/ui/Card';
import type { FeedbackThreadView } from '@/lib/types';

interface FeedbackThreadCardProps {
  thread: FeedbackThreadView;
  variant?: 'feed' | 'detail';
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
}: FeedbackThreadCardProps) {
  const showActions = variant === 'feed';
  const lastActivityLabel =
    thread.lastActivityAt !== thread.created_at
      ? `Active ${formatDateTime(thread.lastActivityAt)}`
      : `Posted ${formatDateTime(thread.created_at)}`;

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">{thread.publicAuthorLabel}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Posted {formatDateTime(thread.created_at)}
          </p>
        </div>
        <div className="rounded-full border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
          {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
        {thread.content}
      </p>

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
            <Link
              href={`/feedback/${thread.id}`}
              className="rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--color-primary-light)] transition-colors hover:border-[var(--color-primary)]/70 hover:bg-[var(--color-primary)]/15"
            >
              Reply
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
