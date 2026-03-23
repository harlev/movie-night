import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import {
  createFeedbackReply,
  createFeedbackThread,
  deleteFeedbackReplyRecord,
  getFeedbackReplyCountForThread,
  getFeedbackReplyRecordById,
  getFeedbackThreadRecordById,
  hardDeleteFeedbackThreadRecord,
  tombstoneFeedbackThreadRecord,
  updateFeedbackReplyContent,
  updateFeedbackThreadContent,
} from '@/lib/queries/feedback';

type FeedbackPostingKind = 'thread' | 'reply';
type FeedbackUserRole = 'admin' | 'member' | 'viewer' | undefined;
type FeedbackActionResult = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  threadId?: string;
};

interface FeedbackThreadTarget {
  id: string;
  status: 'visible' | 'hidden';
  deletedAt?: string | null;
}

interface StoredFeedbackIdentityInput {
  authorId: string;
  authorDisplayNameSnapshot: string;
  isAnonymous: boolean;
}

interface FeedbackMutationAccessInput {
  userRole: FeedbackUserRole;
  currentUserId: string;
  authorId: string | null;
  status: 'visible' | 'hidden';
  deletedAt: string | null;
}

export function validateFeedbackPostingAccess(
  userRole: FeedbackUserRole,
  postingKind: FeedbackPostingKind
): { ok: true } | { ok: false; error: string } {
  if (userRole === 'viewer') {
    return {
      ok: false,
      error: postingKind === 'reply' ? 'Viewers cannot post replies' : 'Viewers cannot post feedback',
    };
  }

  return { ok: true };
}

export function validateFeedbackReplyThread(
  thread: FeedbackThreadTarget | null
): { ok: true } | { ok: false; error: string } {
  if (!thread) {
    return { ok: false, error: 'Thread not found' };
  }

  if (thread.status !== 'visible') {
    return { ok: false, error: 'Thread is unavailable' };
  }

  if (thread.deletedAt) {
    return { ok: false, error: 'You can’t reply to a deleted thread.' };
  }

  return { ok: true };
}

export function validateFeedbackEditAccess(
  input: FeedbackMutationAccessInput
): { ok: true } | { ok: false; error: string } {
  if (input.status !== 'visible' || input.deletedAt) {
    return { ok: false, error: 'Feedback is unavailable' };
  }

  if (!input.authorId || input.authorId !== input.currentUserId) {
    return { ok: false, error: 'You can only edit your own feedback' };
  }

  if (input.userRole === 'viewer') {
    return { ok: false, error: 'Viewers cannot edit feedback' };
  }

  return { ok: true };
}

export function validateFeedbackDeleteAccess(
  input: FeedbackMutationAccessInput
): { ok: true } | { ok: false; error: string } {
  if (input.deletedAt) {
    return { ok: false, error: 'Feedback is unavailable' };
  }

  if (input.userRole === 'admin') {
    return { ok: true };
  }

  if (input.status !== 'visible') {
    return { ok: false, error: 'Feedback is unavailable' };
  }

  if (!input.authorId || input.authorId !== input.currentUserId) {
    return { ok: false, error: 'You can only delete your own feedback' };
  }

  return { ok: true };
}

export function getThreadDeleteMode(visibleReplyCount: number): 'hard-delete' | 'tombstone' {
  return visibleReplyCount > 0 ? 'tombstone' : 'hard-delete';
}

function validateFeedbackContent(
  content: string,
  postingKind: FeedbackPostingKind
): { ok: true } | { ok: false; error: string } {
  if (!content) {
    return {
      ok: false,
      error: postingKind === 'reply' ? 'Reply cannot be empty' : 'Feedback cannot be empty',
    };
  }

  if (content.length > 1000) {
    return {
      ok: false,
      error:
        postingKind === 'reply'
          ? 'Reply must be less than 1000 characters'
          : 'Feedback must be less than 1000 characters',
    };
  }

  return { ok: true };
}

function revalidateFeedbackPaths(threadId?: string) {
  revalidatePath('/feedback');
  revalidatePath('/dashboard');

  if (threadId) {
    revalidatePath(`/feedback/${threadId}`);
  }
}

function isAnonymousPosting(formData: FormData): boolean {
  return formData.get('postingIdentity') === 'anonymous';
}

export function getStoredFeedbackIdentity({
  authorId,
  authorDisplayNameSnapshot,
  isAnonymous,
}: StoredFeedbackIdentityInput): {
  authorId: string;
  authorDisplayNameSnapshot: string | null;
} {
  if (isAnonymous) {
    return {
      authorId,
      authorDisplayNameSnapshot: null,
    };
  }

  return {
    authorId,
    authorDisplayNameSnapshot,
  };
}

async function getAuthenticatedFeedbackUser(): Promise<
  | { userId: string; userRole: FeedbackUserRole; displayName: string }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile) return { error: 'Profile not found' };

  return {
    userId: user.id,
    userRole: profile.role,
    displayName: profile.display_name,
  };
}

export async function createFeedbackThreadAction(prevState: any, formData: FormData): Promise<FeedbackActionResult> {
  'use server';

  const auth = await getAuthenticatedFeedbackUser();
  if ('error' in auth) return { error: auth.error };

  const access = validateFeedbackPostingAccess(auth.userRole, 'thread');
  if (!access.ok) return { error: access.error };

  const content = (formData.get('content') as string | null)?.trim() || '';
  const contentValidation = validateFeedbackContent(content, 'thread');
  if (!contentValidation.ok) return { error: contentValidation.error };
  const postingIdentity = getStoredFeedbackIdentity({
    authorId: auth.userId,
    authorDisplayNameSnapshot: auth.displayName,
    isAnonymous: isAnonymousPosting(formData),
  });

  try {
    const thread = await createFeedbackThread({
      authorId: postingIdentity.authorId,
      authorDisplayNameSnapshot: postingIdentity.authorDisplayNameSnapshot,
      content,
      isAnonymous: postingIdentity.authorDisplayNameSnapshot === null,
    });

    revalidateFeedbackPaths(thread.id);

    return { success: true, threadId: thread.id };
  } catch (error) {
    console.error('Failed to create feedback thread:', error);
    return { error: 'Failed to post feedback' };
  }
}

export async function createFeedbackReplyAction(prevState: any, formData: FormData): Promise<FeedbackActionResult> {
  'use server';

  const auth = await getAuthenticatedFeedbackUser();
  if ('error' in auth) return { error: auth.error };

  const access = validateFeedbackPostingAccess(auth.userRole, 'reply');
  if (!access.ok) return { error: access.error };

  const threadId = (formData.get('threadId') as string | null)?.trim() || '';
  if (!threadId) return { error: 'Thread not found' };

  const thread = await getFeedbackThreadRecordById(threadId);
  const threadValidation = validateFeedbackReplyThread(thread);
  if (!threadValidation.ok) return { error: threadValidation.error };

  const content = (formData.get('content') as string | null)?.trim() || '';
  const contentValidation = validateFeedbackContent(content, 'reply');
  if (!contentValidation.ok) return { error: contentValidation.error };
  const postingIdentity = getStoredFeedbackIdentity({
    authorId: auth.userId,
    authorDisplayNameSnapshot: auth.displayName,
    isAnonymous: isAnonymousPosting(formData),
  });

  try {
    await createFeedbackReply({
      threadId,
      authorId: postingIdentity.authorId,
      authorDisplayNameSnapshot: postingIdentity.authorDisplayNameSnapshot,
      content,
      isAnonymous: postingIdentity.authorDisplayNameSnapshot === null,
    });

    revalidateFeedbackPaths(threadId);

    return { success: true };
  } catch (error) {
    console.error('Failed to create feedback reply:', error);
    return { error: 'Failed to post reply' };
  }
}

export async function updateFeedbackThreadAction(
  prevState: any,
  formData: FormData
): Promise<FeedbackActionResult> {
  'use server';

  const auth = await getAuthenticatedFeedbackUser();
  if ('error' in auth) return { error: auth.error };

  const threadId = (formData.get('threadId') as string | null)?.trim() || '';
  if (!threadId) return { error: 'Thread not found' };

  const thread = await getFeedbackThreadRecordById(threadId);
  if (!thread) return { error: 'Thread not found' };

  const access = validateFeedbackEditAccess({
    userRole: auth.userRole,
    currentUserId: auth.userId,
    authorId: thread.authorId,
    status: thread.status,
    deletedAt: thread.deletedAt,
  });
  if (!access.ok) return { error: access.error };

  const content = (formData.get('content') as string | null)?.trim() || '';
  const contentValidation = validateFeedbackContent(content, 'thread');
  if (!contentValidation.ok) return { error: contentValidation.error };

  try {
    await updateFeedbackThreadContent({
      id: threadId,
      content,
    });

    revalidateFeedbackPaths(threadId);
    return { success: true };
  } catch (error) {
    console.error('Failed to update feedback thread:', error);
    return { error: 'Failed to update feedback' };
  }
}

export async function updateFeedbackReplyAction(
  prevState: any,
  formData: FormData
): Promise<FeedbackActionResult> {
  'use server';

  const auth = await getAuthenticatedFeedbackUser();
  if ('error' in auth) return { error: auth.error };

  const replyId = (formData.get('replyId') as string | null)?.trim() || '';
  if (!replyId) return { error: 'Reply not found' };

  const reply = await getFeedbackReplyRecordById(replyId);
  if (!reply) return { error: 'Reply not found' };

  const thread = await getFeedbackThreadRecordById(reply.threadId);
  if (!thread || thread.status !== 'visible') return { error: 'Feedback is unavailable' };

  const access = validateFeedbackEditAccess({
    userRole: auth.userRole,
    currentUserId: auth.userId,
    authorId: reply.authorId,
    status: reply.status,
    deletedAt: null,
  });
  if (!access.ok) return { error: access.error };

  const content = (formData.get('content') as string | null)?.trim() || '';
  const contentValidation = validateFeedbackContent(content, 'reply');
  if (!contentValidation.ok) return { error: contentValidation.error };

  try {
    await updateFeedbackReplyContent({
      id: replyId,
      content,
    });

    revalidateFeedbackPaths(reply.threadId);
    return { success: true };
  } catch (error) {
    console.error('Failed to update feedback reply:', error);
    return { error: 'Failed to update reply' };
  }
}

export async function deleteFeedbackThreadAction(
  prevState: any,
  formData: FormData
): Promise<FeedbackActionResult> {
  'use server';

  const auth = await getAuthenticatedFeedbackUser();
  if ('error' in auth) return { error: auth.error };

  const threadId = (formData.get('threadId') as string | null)?.trim() || '';
  if (!threadId) return { error: 'Thread not found' };

  const thread = await getFeedbackThreadRecordById(threadId);
  if (!thread) return { error: 'Thread not found' };

  const access = validateFeedbackDeleteAccess({
    userRole: auth.userRole,
    currentUserId: auth.userId,
    authorId: thread.authorId,
    status: thread.status,
    deletedAt: thread.deletedAt,
  });
  if (!access.ok) return { error: access.error };

  try {
    const replyCount = await getFeedbackReplyCountForThread(threadId);
    const deleteMode = getThreadDeleteMode(replyCount);

    if (deleteMode === 'hard-delete') {
      await hardDeleteFeedbackThreadRecord(threadId);
    } else {
      await tombstoneFeedbackThreadRecord(threadId, {
        deletedByAuthor: thread.authorId === auth.userId,
      });
    }

    revalidateFeedbackPaths(threadId);

    const returnTo = (formData.get('returnTo') as string | null)?.trim() || '';
    return {
      success: true,
      redirectTo: deleteMode === 'hard-delete' && returnTo ? returnTo : undefined,
    };
  } catch (error) {
    console.error('Failed to delete feedback thread:', error);
    return { error: 'Failed to delete feedback' };
  }
}

export async function deleteFeedbackReplyAction(
  prevState: any,
  formData: FormData
): Promise<FeedbackActionResult> {
  'use server';

  const auth = await getAuthenticatedFeedbackUser();
  if ('error' in auth) return { error: auth.error };

  const replyId = (formData.get('replyId') as string | null)?.trim() || '';
  if (!replyId) return { error: 'Reply not found' };

  const reply = await getFeedbackReplyRecordById(replyId);
  if (!reply) return { error: 'Reply not found' };

  const thread = await getFeedbackThreadRecordById(reply.threadId);
  if (!thread || thread.deletedAt) return { error: 'Feedback is unavailable' };

  const access = validateFeedbackDeleteAccess({
    userRole: auth.userRole,
    currentUserId: auth.userId,
    authorId: reply.authorId,
    status: reply.status,
    deletedAt: null,
  });
  if (!access.ok) return { error: access.error };

  try {
    await deleteFeedbackReplyRecord(replyId);

    revalidateFeedbackPaths(reply.threadId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete feedback reply:', error);
    return { error: 'Failed to delete reply' };
  }
}
