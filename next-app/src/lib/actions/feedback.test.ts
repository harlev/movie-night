import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getStoredFeedbackIdentity,
  getThreadDeleteMode,
  validateFeedbackDeleteAccess,
  validateFeedbackEditAccess,
  validateFeedbackPostingAccess,
  validateFeedbackReplyThread,
} from './feedback';

test('validateFeedbackPostingAccess blocks viewers from posting threads and replies', () => {
  assert.deepEqual(validateFeedbackPostingAccess('viewer', 'thread'), {
    ok: false,
    error: 'Viewers cannot post feedback',
  });

  assert.deepEqual(validateFeedbackPostingAccess('viewer', 'reply'), {
    ok: false,
    error: 'Viewers cannot post replies',
  });

  assert.deepEqual(validateFeedbackPostingAccess('member', 'thread'), {
    ok: true,
  });
});

test('validateFeedbackReplyThread rejects replies for missing threads', () => {
  assert.deepEqual(validateFeedbackReplyThread(null), {
    ok: false,
    error: 'Thread not found',
  });
});

test('validateFeedbackReplyThread rejects replies for hidden threads', () => {
  assert.deepEqual(
    validateFeedbackReplyThread({
      id: 'thread-1',
      status: 'hidden',
    }),
    {
      ok: false,
      error: 'Thread is unavailable',
    }
  );
});

test('validateFeedbackReplyThread rejects replies for author-deleted threads', () => {
  assert.deepEqual(
    validateFeedbackReplyThread({
      id: 'thread-1',
      status: 'visible',
      deletedAt: '2026-03-21T12:00:00.000Z',
    }),
    {
      ok: false,
      error: 'You can’t reply to a deleted thread.',
    }
  );
});

test('validateFeedbackEditAccess blocks viewers from editing their own feedback', () => {
  assert.deepEqual(
    validateFeedbackEditAccess({
      userRole: 'viewer',
      currentUserId: 'user-1',
      authorId: 'user-1',
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: false,
      error: 'Viewers cannot edit feedback',
    }
  );
});

test('validateFeedbackEditAccess rejects non-owner and deleted feedback edits', () => {
  assert.deepEqual(
    validateFeedbackEditAccess({
      userRole: 'member',
      currentUserId: 'user-2',
      authorId: 'user-1',
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: false,
      error: 'You can only edit your own feedback',
    }
  );

  assert.deepEqual(
    validateFeedbackEditAccess({
      userRole: 'member',
      currentUserId: 'user-1',
      authorId: 'user-1',
      status: 'visible',
      deletedAt: '2026-03-21T12:00:00.000Z',
    }),
    {
      ok: false,
      error: 'Feedback is unavailable',
    }
  );
});

test('validateFeedbackDeleteAccess allows viewer owners but rejects non-owner, legacy anonymous, and hidden feedback', () => {
  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'viewer',
      currentUserId: 'user-1',
      authorId: 'user-1',
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: true,
    }
  );

  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'member',
      currentUserId: 'user-2',
      authorId: 'user-1',
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: false,
      error: 'You can only delete your own feedback',
    }
  );

  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'member',
      currentUserId: 'user-1',
      authorId: null,
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: false,
      error: 'You can only delete your own feedback',
    }
  );

  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'member',
      currentUserId: 'user-1',
      authorId: 'user-1',
      status: 'hidden',
      deletedAt: null,
    }),
    {
      ok: false,
      error: 'Feedback is unavailable',
    }
  );
});

test('validateFeedbackDeleteAccess allows admins to delete non-owned and hidden feedback', () => {
  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'admin',
      currentUserId: 'admin-1',
      authorId: 'user-1',
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: true,
    }
  );

  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'admin',
      currentUserId: 'admin-1',
      authorId: null,
      status: 'visible',
      deletedAt: null,
    }),
    {
      ok: true,
    }
  );

  assert.deepEqual(
    validateFeedbackDeleteAccess({
      userRole: 'admin',
      currentUserId: 'admin-1',
      authorId: 'user-1',
      status: 'hidden',
      deletedAt: null,
    }),
    {
      ok: true,
    }
  );
});

test('getThreadDeleteMode hard-deletes empty threads and tombstones threads with replies', () => {
  assert.equal(getThreadDeleteMode(0), 'hard-delete');
  assert.equal(getThreadDeleteMode(2), 'tombstone');
});

test('getStoredFeedbackIdentity keeps author ownership for anonymous feedback while clearing the public name snapshot', () => {
  assert.deepEqual(
    getStoredFeedbackIdentity({
      authorId: 'user-1',
      authorDisplayNameSnapshot: 'Yogev',
      isAnonymous: true,
    }),
    {
      authorId: 'user-1',
      authorDisplayNameSnapshot: null,
    }
  );

  assert.deepEqual(
    getStoredFeedbackIdentity({
      authorId: 'user-1',
      authorDisplayNameSnapshot: 'Yogev',
      isAnonymous: false,
    }),
    {
      authorId: 'user-1',
      authorDisplayNameSnapshot: 'Yogev',
    }
  );
});
