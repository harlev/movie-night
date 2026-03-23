import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import { getFeedbackThreads } from '@/lib/queries/feedback';
import {
  createFeedbackThreadAction,
  deleteFeedbackThreadAction,
  updateFeedbackThreadAction,
} from '@/lib/actions/feedback';
import FeedbackComposer from '@/components/feedback/FeedbackComposer';
import FeedbackThreadCard from '@/components/feedback/FeedbackThreadCard';
import EmptyState from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Feedback - Movie Night',
};

function resolveSortMode(value: string | undefined): 'active' | 'new' {
  return value === 'new' ? 'new' : 'active';
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortMode = resolveSortMode(sort);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserById(user.id) : null;
  const threads = await getFeedbackThreads(sortMode, {
    currentUserId: user?.id,
    userRole: profile?.role,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Feedback</h1>
        <p className="text-[var(--color-text-muted)]">For snacks, themes, movies, or anything else.</p>
      </div>

      <div id="feedback-composer">
        <FeedbackComposer
          action={createFeedbackThreadAction}
          mode="thread"
          userRole={profile?.role}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">Threads</h2>
        </div>

        <div className="inline-flex rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-1">
          <Link
            href="/feedback?sort=active"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortMode === 'active'
                ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Recent activity
          </Link>
          <Link
            href="/feedback?sort=new"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortMode === 'new'
                ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Newest
          </Link>
        </div>
      </div>

      {threads.length > 0 ? (
        <div className="space-y-4">
          {threads.map((thread) => (
            <FeedbackThreadCard
              key={thread.id}
              thread={thread}
              editAction={updateFeedbackThreadAction}
              deleteAction={deleteFeedbackThreadAction}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] shadow-lg shadow-black/20">
          <EmptyState
            icon="comments"
            title="No posts yet"
            description={
              profile?.role === 'viewer'
                ? 'Posts will show up here once the conversation starts.'
                : 'Start the conversation with the first post.'
            }
            actionLabel={profile?.role === 'viewer' ? 'Refresh' : 'Share a thought'}
            actionHref={profile?.role === 'viewer' ? '/feedback' : '/feedback#feedback-composer'}
          />
        </div>
      )}
    </div>
  );
}
