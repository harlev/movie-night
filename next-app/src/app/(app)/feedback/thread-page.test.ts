import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Feedback thread page uses lighter conversation framing', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/feedback/[id]/page.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('Conversation'), true);
  assert.equal(source.includes('See the full conversation.'), true);
  assert.equal(source.includes('Continue the conversation with a one-level reply thread.'), false);
});

test('Feedback thread page wires thread and reply self-management actions', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/feedback/[id]/page.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('updateFeedbackThreadAction'), true);
  assert.equal(source.includes('deleteFeedbackThreadAction'), true);
  assert.equal(source.includes('updateFeedbackReplyAction'), true);
  assert.equal(source.includes('deleteFeedbackReplyAction'), true);
  assert.equal(source.includes('currentUserId: user?.id'), true);
  assert.equal(source.includes('userRole: profile?.role'), true);
  assert.equal(source.includes('editAction={updateFeedbackThreadAction}'), true);
  assert.equal(source.includes('deleteAction={deleteFeedbackThreadAction}'), true);
  assert.equal(source.includes('editReplyAction={updateFeedbackReplyAction}'), true);
  assert.equal(source.includes('deleteReplyAction={deleteFeedbackReplyAction}'), true);
});
