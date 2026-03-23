import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeedbackThreadViews } from './feedback';

test('buildFeedbackThreadViews sanitizes anonymous owner threads and reply capabilities', () => {
  const [thread] = buildFeedbackThreadViews(
    [
      {
        id: 'thread-1',
        author_id: 'user-1',
        author_display_name_snapshot: null,
        content: 'Anonymous thought',
        is_anonymous: true,
        status: 'visible',
        created_at: '2026-03-20T10:00:00.000Z',
        updated_at: '2026-03-20T10:00:00.000Z',
        edited_at: null,
        deleted_at: null,
        deleted_by_author: false,
      },
    ],
    [
      {
        id: 'reply-1',
        thread_id: 'thread-1',
        author_id: 'user-2',
        author_display_name_snapshot: 'Pat',
        content: 'Reply',
        is_anonymous: false,
        status: 'visible',
        created_at: '2026-03-21T10:00:00.000Z',
        updated_at: '2026-03-21T10:00:00.000Z',
        edited_at: null,
      },
    ],
    'active',
    {
      currentUserId: 'user-1',
      userRole: 'member',
    }
  );

  assert.equal(thread.publicAuthorLabel, 'Anonymous');
  assert.equal(thread.canEdit, true);
  assert.equal(thread.canDelete, true);
  assert.equal(thread.canReply, true);
  assert.equal(thread.replyCount, 1);
  assert.equal(thread.lastActivityAt, '2026-03-21T10:00:00.000Z');
  assert.equal('author_id' in thread, false);
  assert.equal(thread.replies[0].canEdit, false);
  assert.equal(thread.replies[0].canDelete, false);
  assert.equal('author_id' in thread.replies[0], false);
});

test('buildFeedbackThreadViews disables owner actions for legacy anonymous rows and tombstones deleted threads', () => {
  const [thread] = buildFeedbackThreadViews(
    [
      {
        id: 'thread-legacy',
        author_id: null,
        author_display_name_snapshot: null,
        content: 'Legacy anonymous thought',
        is_anonymous: true,
        status: 'visible',
        created_at: '2026-03-20T10:00:00.000Z',
        updated_at: '2026-03-20T10:00:00.000Z',
        edited_at: null,
        deleted_at: '2026-03-21T11:00:00.000Z',
        deleted_by_author: true,
      },
    ],
    [],
    'active',
    {
      currentUserId: 'user-1',
      userRole: 'member',
    }
  );

  assert.equal(thread.content, 'This feedback was deleted.');
  assert.equal(thread.canEdit, false);
  assert.equal(thread.canDelete, false);
  assert.equal(thread.canReply, false);
});

test('buildFeedbackThreadViews lets viewer owners delete but not edit their own content', () => {
  const [thread] = buildFeedbackThreadViews(
    [
      {
        id: 'thread-viewer',
        author_id: 'viewer-1',
        author_display_name_snapshot: 'Viewer',
        content: 'Named thought',
        is_anonymous: false,
        status: 'visible',
        created_at: '2026-03-20T10:00:00.000Z',
        updated_at: '2026-03-20T10:00:00.000Z',
        edited_at: '2026-03-20T11:00:00.000Z',
        deleted_at: null,
        deleted_by_author: false,
      },
    ],
    [
      {
        id: 'reply-viewer',
        thread_id: 'thread-viewer',
        author_id: 'viewer-1',
        author_display_name_snapshot: null,
        content: 'Anonymous reply',
        is_anonymous: true,
        status: 'visible',
        created_at: '2026-03-20T12:00:00.000Z',
        updated_at: '2026-03-20T12:00:00.000Z',
        edited_at: null,
      },
    ],
    'active',
    {
      currentUserId: 'viewer-1',
      userRole: 'viewer',
    }
  );

  assert.equal(thread.canEdit, false);
  assert.equal(thread.canDelete, true);
  assert.equal(thread.replies[0].publicAuthorLabel, 'Anonymous');
  assert.equal(thread.replies[0].canEdit, false);
  assert.equal(thread.replies[0].canDelete, true);
});

test('buildFeedbackThreadViews lets admins delete non-owned visible and hidden feedback without edit access', () => {
  const [thread] = buildFeedbackThreadViews(
    [
      {
        id: 'thread-admin',
        author_id: 'user-1',
        author_display_name_snapshot: 'Pat',
        content: 'Visible thread',
        is_anonymous: false,
        status: 'hidden',
        created_at: '2026-03-20T10:00:00.000Z',
        updated_at: '2026-03-20T10:00:00.000Z',
        edited_at: null,
        deleted_at: null,
        deleted_by_author: false,
      },
    ],
    [
      {
        id: 'reply-admin',
        thread_id: 'thread-admin',
        author_id: 'user-2',
        author_display_name_snapshot: 'Taylor',
        content: 'Hidden reply',
        is_anonymous: false,
        status: 'hidden',
        created_at: '2026-03-20T12:00:00.000Z',
        updated_at: '2026-03-20T12:00:00.000Z',
        edited_at: null,
      },
    ],
    'active',
    {
      currentUserId: 'admin-1',
      userRole: 'admin',
    }
  );

  assert.equal(thread.canEdit, false);
  assert.equal(thread.canDelete, true);
  assert.equal(thread.canReply, false);
  assert.equal(thread.replies[0].canEdit, false);
  assert.equal(thread.replies[0].canDelete, true);
});

test('buildFeedbackThreadViews uses generic tombstone copy for deleted threads', () => {
  const [thread] = buildFeedbackThreadViews(
    [
      {
        id: 'thread-deleted',
        author_id: 'user-1',
        author_display_name_snapshot: 'Pat',
        content: 'Original thought',
        is_anonymous: false,
        status: 'visible',
        created_at: '2026-03-20T10:00:00.000Z',
        updated_at: '2026-03-20T10:00:00.000Z',
        edited_at: null,
        deleted_at: '2026-03-21T11:00:00.000Z',
        deleted_by_author: false,
      },
    ],
    [],
    'active',
    {
      currentUserId: 'admin-1',
      userRole: 'admin',
    }
  );

  assert.equal(thread.content, 'This feedback was deleted.');
  assert.equal(thread.canDelete, false);
  assert.equal(thread.canReply, false);
});
