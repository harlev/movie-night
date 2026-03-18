import assert from 'node:assert/strict';
import test from 'node:test';
import {
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
