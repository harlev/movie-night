import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDirectedReplyPrefix,
  getFeedbackAuthorLabel,
  sortFeedbackThreads,
} from './feedback';

test('getFeedbackAuthorLabel renders anonymous posts as Anonymous', () => {
  assert.equal(
    getFeedbackAuthorLabel({
      isAnonymous: true,
      authorDisplayNameSnapshot: 'Yogev',
    }),
    'Anonymous'
  );

  assert.equal(
    getFeedbackAuthorLabel({
      isAnonymous: false,
      authorDisplayNameSnapshot: 'Yogev',
    }),
    'Yogev'
  );
});

test('sortFeedbackThreads bumps recently replied threads when using active sort', () => {
  const threads = sortFeedbackThreads(
    [
      {
        id: 'older-thread',
        created_at: '2026-03-01T10:00:00.000Z',
        replies: [
          {
            id: 'reply-1',
            created_at: '2026-03-05T12:00:00.000Z',
            status: 'visible',
          },
        ],
      },
      {
        id: 'newer-thread',
        created_at: '2026-03-04T09:00:00.000Z',
        replies: [],
      },
    ],
    'active'
  );

  assert.deepEqual(
    threads.map((thread) => thread.id),
    ['older-thread', 'newer-thread']
  );
});

test('sortFeedbackThreads keeps newest sort tied to thread creation time', () => {
  const threads = sortFeedbackThreads(
    [
      {
        id: 'older-thread',
        created_at: '2026-03-01T10:00:00.000Z',
        replies: [
          {
            id: 'reply-1',
            created_at: '2026-03-05T12:00:00.000Z',
            status: 'visible',
          },
        ],
      },
      {
        id: 'newer-thread',
        created_at: '2026-03-04T09:00:00.000Z',
        replies: [],
      },
    ],
    'new'
  );

  assert.deepEqual(
    threads.map((thread) => thread.id),
    ['newer-thread', 'older-thread']
  );
});

test('buildDirectedReplyPrefix trims labels and formats a mention-style prefix', () => {
  assert.equal(buildDirectedReplyPrefix('Yogev'), '@Yogev ');
  assert.equal(buildDirectedReplyPrefix('  Anonymous  '), '@Anonymous ');
});
