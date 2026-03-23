import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  Profile,
  FeedbackReply,
  FeedbackReplyView,
  FeedbackSortMode,
  FeedbackThread,
  FeedbackThreadView,
} from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import {
  getFeedbackAuthorLabel,
  getFeedbackThreadDisplayContent,
  sortFeedbackThreads,
} from '@/lib/utils/feedback';

interface FeedbackViewerContext {
  currentUserId?: string | null;
  userRole?: Profile['role'] | null;
}

interface FeedbackThreadRecord {
  id: string;
  authorId: string | null;
  status: FeedbackThread['status'];
  deletedAt: string | null;
  deletedByAuthor: boolean;
}

interface FeedbackReplyRecord {
  id: string;
  threadId: string;
  authorId: string | null;
  status: FeedbackReply['status'];
}

function isFeedbackOwner(authorId: string | null, currentUserId?: string | null): boolean {
  return !!authorId && !!currentUserId && authorId === currentUserId;
}

function isFeedbackAdmin(userRole?: Profile['role'] | null): boolean {
  return userRole === 'admin';
}

function toFeedbackReplyView(
  reply: FeedbackReply,
  viewerContext: FeedbackViewerContext
): FeedbackReplyView {
  const isOwner = isFeedbackOwner(reply.author_id, viewerContext.currentUserId);
  const isAdmin = isFeedbackAdmin(viewerContext.userRole);
  const canDelete = isAdmin || (reply.status === 'visible' && isOwner);
  const canEdit = reply.status === 'visible' && isOwner && viewerContext.userRole !== 'viewer';

  return {
    id: reply.id,
    thread_id: reply.thread_id,
    content: reply.content,
    is_anonymous: reply.is_anonymous,
    status: reply.status,
    created_at: reply.created_at,
    updated_at: reply.updated_at,
    editedAt: reply.edited_at,
    publicAuthorLabel: getFeedbackAuthorLabel({
      isAnonymous: reply.is_anonymous,
      authorDisplayNameSnapshot: reply.author_display_name_snapshot,
    }),
    canEdit,
    canDelete,
  };
}

export function buildFeedbackThreadViews(
  threads: FeedbackThread[],
  replies: FeedbackReply[],
  sortMode: FeedbackSortMode,
  viewerContext: FeedbackViewerContext = {}
): FeedbackThreadView[] {
  const repliesByThreadId = new Map<string, FeedbackReplyView[]>();

  for (const reply of replies) {
    const currentReplies = repliesByThreadId.get(reply.thread_id) || [];
    currentReplies.push(toFeedbackReplyView(reply, viewerContext));
    repliesByThreadId.set(reply.thread_id, currentReplies);
  }

  const threadViews = threads.map((thread) => {
    const isOwner = isFeedbackOwner(thread.author_id, viewerContext.currentUserId);
    const isAdmin = isFeedbackAdmin(viewerContext.userRole);
    const threadReplies = (repliesByThreadId.get(thread.id) || []).sort(
      (left, right) => Date.parse(left.created_at) - Date.parse(right.created_at)
    );
    const lastReply = threadReplies[threadReplies.length - 1];
    const canDelete = !thread.deleted_at && (isAdmin || (thread.status === 'visible' && isOwner));
    const canEdit =
      thread.status === 'visible' &&
      !thread.deleted_at &&
      isOwner &&
      viewerContext.userRole !== 'viewer';

    return {
      id: thread.id,
      content: getFeedbackThreadDisplayContent({
        content: thread.content,
        deletedAt: thread.deleted_at,
      }),
      is_anonymous: thread.is_anonymous,
      status: thread.status,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      editedAt: thread.edited_at,
      deletedAt: thread.deleted_at,
      deletedByAuthor: thread.deleted_by_author,
      publicAuthorLabel: getFeedbackAuthorLabel({
        isAnonymous: thread.is_anonymous,
        authorDisplayNameSnapshot: thread.author_display_name_snapshot,
      }),
      canEdit,
      canDelete,
      canReply: thread.status === 'visible' && !thread.deleted_at,
      replyCount: threadReplies.length,
      lastActivityAt: lastReply?.created_at || thread.created_at,
      replies: threadReplies,
    };
  });

  return sortFeedbackThreads(threadViews, sortMode);
}

export async function createFeedbackThread(data: {
  authorId: string;
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
  authorId: string;
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
  options: { limit?: number; currentUserId?: string | null; userRole?: Profile['role'] | null } = {}
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
    return buildFeedbackThreadViews(threads, [], sortMode, options).slice(0, options.limit);
  }

  return buildFeedbackThreadViews(threads, replies || [], sortMode, options).slice(0, options.limit);
}

export async function getFeedbackThreadById(
  id: string,
  viewerContext: FeedbackViewerContext = {}
): Promise<FeedbackThreadView | null> {
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
    return buildFeedbackThreadViews([thread], [], 'active', viewerContext)[0] || null;
  }

  return buildFeedbackThreadViews([thread], replies || [], 'active', viewerContext)[0] || null;
}

export async function getFeedbackThreadRecordById(
  id: string
): Promise<FeedbackThreadRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('feedback_threads')
    .select('id, author_id, status, deleted_at, deleted_by_author')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load feedback thread record:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    authorId: data.author_id,
    status: data.status,
    deletedAt: data.deleted_at,
    deletedByAuthor: data.deleted_by_author,
  };
}

export async function getFeedbackReplyRecordById(id: string): Promise<FeedbackReplyRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('feedback_replies')
    .select('id, thread_id, author_id, status')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load feedback reply record:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    threadId: data.thread_id,
    authorId: data.author_id,
    status: data.status,
  };
}

export async function getFeedbackReplyCountForThread(threadId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('feedback_replies')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId);

  if (error) {
    console.error('Failed to count feedback replies:', error);
    return 0;
  }

  return count || 0;
}

export async function updateFeedbackThreadContent(data: {
  id: string;
  content: string;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('feedback_threads')
    .update({
      content: data.content,
      updated_at: now,
      edited_at: now,
    })
    .eq('id', data.id);

  if (error) {
    throw error;
  }
}

export async function updateFeedbackReplyContent(data: {
  id: string;
  content: string;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('feedback_replies')
    .update({
      content: data.content,
      updated_at: now,
      edited_at: now,
    })
    .eq('id', data.id);

  if (error) {
    throw error;
  }
}

export async function deleteFeedbackReplyRecord(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('feedback_replies').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function hardDeleteFeedbackThreadRecord(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('feedback_threads').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function tombstoneFeedbackThreadRecord(
  id: string,
  options: { deletedByAuthor: boolean }
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('feedback_threads')
    .update({
      content: '',
      updated_at: now,
      deleted_at: now,
      deleted_by_author: options.deletedByAuthor,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
