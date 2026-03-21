import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  FeedbackReply,
  FeedbackReplyView,
  FeedbackSortMode,
  FeedbackThread,
  FeedbackThreadView,
} from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { getFeedbackAuthorLabel, sortFeedbackThreads } from '@/lib/utils/feedback';

function toFeedbackReplyView(reply: FeedbackReply): FeedbackReplyView {
  return {
    ...reply,
    publicAuthorLabel: getFeedbackAuthorLabel({
      isAnonymous: reply.is_anonymous,
      authorDisplayNameSnapshot: reply.author_display_name_snapshot,
    }),
  };
}

function buildFeedbackThreadViews(
  threads: FeedbackThread[],
  replies: FeedbackReply[],
  sortMode: FeedbackSortMode
): FeedbackThreadView[] {
  const repliesByThreadId = new Map<string, FeedbackReplyView[]>();

  for (const reply of replies) {
    const currentReplies = repliesByThreadId.get(reply.thread_id) || [];
    currentReplies.push(toFeedbackReplyView(reply));
    repliesByThreadId.set(reply.thread_id, currentReplies);
  }

  const threadViews = threads.map((thread) => {
    const threadReplies = (repliesByThreadId.get(thread.id) || []).sort(
      (left, right) => Date.parse(left.created_at) - Date.parse(right.created_at)
    );
    const lastReply = threadReplies[threadReplies.length - 1];

    return {
      ...thread,
      publicAuthorLabel: getFeedbackAuthorLabel({
        isAnonymous: thread.is_anonymous,
        authorDisplayNameSnapshot: thread.author_display_name_snapshot,
      }),
      replyCount: threadReplies.length,
      lastActivityAt: lastReply?.created_at || thread.created_at,
      replies: threadReplies,
    };
  });

  return sortFeedbackThreads(threadViews, sortMode);
}

export async function createFeedbackThread(data: {
  authorId: string | null;
  authorDisplayNameSnapshot: string | null;
  content: string;
  isAnonymous: boolean;
}): Promise<FeedbackThread> {
  const supabase = await createClient();
  const id = generateId();
  const { data: thread, error } = await supabase
    .from('feedback_threads')
    .insert({
      id,
      author_id: data.authorId,
      author_display_name_snapshot: data.authorDisplayNameSnapshot,
      content: data.content,
      is_anonymous: data.isAnonymous,
    })
    .select('*')
    .single();

  if (error) throw error;
  return thread;
}

export async function createFeedbackReply(data: {
  threadId: string;
  authorId: string | null;
  authorDisplayNameSnapshot: string | null;
  content: string;
  isAnonymous: boolean;
}): Promise<FeedbackReply> {
  const supabase = await createClient();
  const id = generateId();
  const { data: reply, error } = await supabase
    .from('feedback_replies')
    .insert({
      id,
      thread_id: data.threadId,
      author_id: data.authorId,
      author_display_name_snapshot: data.authorDisplayNameSnapshot,
      content: data.content,
      is_anonymous: data.isAnonymous,
    })
    .select('*')
    .single();

  if (error) throw error;
  return reply;
}

export async function getFeedbackThreads(
  sortMode: FeedbackSortMode = 'active',
  options: { limit?: number } = {}
): Promise<FeedbackThreadView[]> {
  const supabase = await createClient();
  const { data: threads, error: threadsError } = await supabase
    .from('feedback_threads')
    .select('*')
    .order('created_at', { ascending: false });

  if (threadsError) {
    console.error('Failed to load feedback threads:', threadsError);
    return [];
  }

  if (!threads || threads.length === 0) {
    return [];
  }

  const threadIds = threads.map((thread) => thread.id);
  const { data: replies, error: repliesError } = await supabase
    .from('feedback_replies')
    .select('*')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true });

  if (repliesError) {
    console.error('Failed to load feedback replies:', repliesError);
    return buildFeedbackThreadViews(threads, [], sortMode).slice(0, options.limit);
  }

  return buildFeedbackThreadViews(threads, replies || [], sortMode).slice(0, options.limit);
}

export async function getFeedbackThreadById(id: string): Promise<FeedbackThreadView | null> {
  const supabase = await createClient();
  const { data: thread, error: threadError } = await supabase
    .from('feedback_threads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (threadError) {
    console.error('Failed to load feedback thread:', threadError);
    return null;
  }

  if (!thread) {
    return null;
  }

  const { data: replies, error: repliesError } = await supabase
    .from('feedback_replies')
    .select('*')
    .eq('thread_id', id)
    .order('created_at', { ascending: true });

  if (repliesError) {
    console.error('Failed to load feedback thread replies:', repliesError);
    return buildFeedbackThreadViews([thread], [], 'active')[0] || null;
  }

  return buildFeedbackThreadViews([thread], replies || [], 'active')[0] || null;
}

export async function getFeedbackThreadRecordById(
  id: string
): Promise<Pick<FeedbackThread, 'id' | 'status'> | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('feedback_threads')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load feedback thread record:', error);
    return null;
  }

  return data;
}
