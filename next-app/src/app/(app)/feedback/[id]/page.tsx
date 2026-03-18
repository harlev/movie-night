import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import { getFeedbackThreadById } from '@/lib/queries/feedback';
import { createFeedbackReplyAction } from '@/lib/actions/feedback';
import FeedbackThreadCard from '@/components/feedback/FeedbackThreadCard';
import FeedbackThreadConversation from '@/components/feedback/FeedbackThreadConversation';

interface FeedbackThreadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: FeedbackThreadPageProps): Promise<Metadata> {
  const { id } = await params;
  const thread = await getFeedbackThreadById(id);

  return {
    title: thread ? 'Conversation - Movie Night' : 'Feedback - Movie Night',
  };
}

export default async function FeedbackThreadPage({
  params,
}: FeedbackThreadPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, thread] = await Promise.all([
    user ? getUserById(user.id) : null,
    getFeedbackThreadById(id),
  ]);

  if (!thread) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Link
        href="/feedback"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-light)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to feedback
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Conversation</h1>
        <p className="text-[var(--color-text-muted)]">See the full conversation.</p>
      </div>

      <FeedbackThreadCard thread={thread} variant="detail" />
      <FeedbackThreadConversation
        action={createFeedbackReplyAction}
        thread={thread}
        userRole={profile?.role}
      />
    </div>
  );
}
