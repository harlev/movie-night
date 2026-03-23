import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('FeedbackThreadConversation supports reply owner actions and blocks replying to deleted threads', () => {
  const filePath = path.join(process.cwd(), 'src/components/feedback/FeedbackThreadConversation.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import FeedbackInlineEditor from '@/components/feedback/FeedbackInlineEditor';"), true);
  assert.equal(source.includes("import FeedbackOwnerMenu from '@/components/feedback/FeedbackOwnerMenu';"), true);
  assert.equal(source.includes('reply.canEdit || reply.canDelete'), true);
  assert.equal(source.includes('<FeedbackOwnerMenu'), true);
  assert.equal(source.includes('<FeedbackInlineEditor'), true);
  assert.equal(source.includes('self-start shrink-0'), true);
  assert.equal(source.includes('mt-3 flex justify-end'), true);
  assert.equal(
    source.includes('className="inline-flex items-center text-sm font-medium text-[var(--color-primary)]'),
    true
  );
  assert.equal(source.includes('You can’t reply to a deleted thread.'), true);
  assert.equal(source.includes('thread.canReply ? ('), true);
});
