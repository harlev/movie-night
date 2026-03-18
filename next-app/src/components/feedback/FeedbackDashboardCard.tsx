import Link from 'next/link';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { FeedbackThreadView, Profile } from '@/lib/types';

interface FeedbackDashboardCardProps {
  threads: FeedbackThreadView[];
  userRole?: Profile['role'];
}

function getSnippet(content: string): string {
  return content.length > 120 ? `${content.slice(0, 117).trimEnd()}...` : content;
}

export default function FeedbackDashboardCard({
  threads,
  userRole,
}: FeedbackDashboardCardProps) {
  const isViewer = userRole === 'viewer';

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-[var(--color-text)]">Recent Feedback</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Suggestions, comments, and recent discussion from the group.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/feedback"
            className="text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
          >
            View all
          </Link>
          {!isViewer ? (
            <Link
              href="/feedback#feedback-composer"
              className="rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--color-primary-light)] transition-colors hover:border-[var(--color-primary)]/70 hover:bg-[var(--color-primary)]/15"
            >
              Leave feedback
            </Link>
          ) : null}
        </div>
      </div>

      <Card padding="md" className="space-y-4">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/feedback/${thread.id}`}
              className="block rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-elevated)] px-4 py-3 transition-colors hover:border-[var(--color-primary)]/40"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--color-text)]">{thread.publicAuthorLabel}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{getSnippet(thread.content)}</p>
            </Link>
          ))
        ) : (
          <EmptyState
            icon="comments"
            title="No feedback yet"
            description={isViewer ? 'Feedback threads will appear here once members start posting.' : 'Be the first to leave feedback for the group.'}
            actionLabel={isViewer ? 'View Feedback' : 'Leave Feedback'}
            actionHref="/feedback"
          />
        )}
      </Card>
    </section>
  );
}
