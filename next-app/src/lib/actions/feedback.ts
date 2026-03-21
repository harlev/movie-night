import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import {
  createFeedbackReply,
  createFeedbackThread,
  getFeedbackThreadRecordById,
} from '@/lib/queries/feedback';

type FeedbackPostingKind = 'thread' | 'reply';
type FeedbackUserRole = 'admin' | 'member' | 'viewer' | undefined;

interface FeedbackThreadTarget {
  id: string;
  status: 'visible' | 'hidden';
}

interface StoredFeedbackIdentityInput {
  authorId: string;
  authorDisplayNameSnapshot: string;
  isAnonymous: boolean;
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

  return { ok: true };
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

function isAnonymousPosting(formData: FormData): boolean {
  return formData.get('postingIdentity') === 'anonymous';
}

export function getStoredFeedbackIdentity({
  authorId,
  authorDisplayNameSnapshot,
  isAnonymous,
}: StoredFeedbackIdentityInput): {
  authorId: string | null;
  authorDisplayNameSnapshot: string | null;
} {
  if (isAnonymous) {
    return {
      authorId: null,
      authorDisplayNameSnapshot: null,
    };
  }

  return {
    authorId,
    authorDisplayNameSnapshot,
  };
}

export async function createFeedbackThreadAction(prevState: any, formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  const access = validateFeedbackPostingAccess(profile?.role, 'thread');
  if (!access.ok) return { error: access.error };
  if (!profile) return { error: 'Profile not found' };

  const content = (formData.get('content') as string | null)?.trim() || '';
  const contentValidation = validateFeedbackContent(content, 'thread');
  if (!contentValidation.ok) return { error: contentValidation.error };
  const postingIdentity = getStoredFeedbackIdentity({
    authorId: user.id,
    authorDisplayNameSnapshot: profile.display_name,
    isAnonymous: isAnonymousPosting(formData),
  });

  try {
    const thread = await createFeedbackThread({
      authorId: postingIdentity.authorId,
      authorDisplayNameSnapshot: postingIdentity.authorDisplayNameSnapshot,
      content,
      isAnonymous: postingIdentity.authorId === null,
    });

    revalidatePath('/feedback');
    revalidatePath('/dashboard');

    return { success: true, threadId: thread.id };
  } catch (error) {
    console.error('Failed to create feedback thread:', error);
    return { error: 'Failed to post feedback' };
  }
}

export async function createFeedbackReplyAction(prevState: any, formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  const access = validateFeedbackPostingAccess(profile?.role, 'reply');
  if (!access.ok) return { error: access.error };
  if (!profile) return { error: 'Profile not found' };

  const threadId = (formData.get('threadId') as string | null)?.trim() || '';
  if (!threadId) return { error: 'Thread not found' };

  const thread = await getFeedbackThreadRecordById(threadId);
  const threadValidation = validateFeedbackReplyThread(thread);
  if (!threadValidation.ok) return { error: threadValidation.error };

  const content = (formData.get('content') as string | null)?.trim() || '';
  const contentValidation = validateFeedbackContent(content, 'reply');
  if (!contentValidation.ok) return { error: contentValidation.error };
  const postingIdentity = getStoredFeedbackIdentity({
    authorId: user.id,
    authorDisplayNameSnapshot: profile.display_name,
    isAnonymous: isAnonymousPosting(formData),
  });

  try {
    await createFeedbackReply({
      threadId,
      authorId: postingIdentity.authorId,
      authorDisplayNameSnapshot: postingIdentity.authorDisplayNameSnapshot,
      content,
      isAnonymous: postingIdentity.authorId === null,
    });

    revalidatePath('/feedback');
    revalidatePath(`/feedback/${threadId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Failed to create feedback reply:', error);
    return { error: 'Failed to post reply' };
  }
}
