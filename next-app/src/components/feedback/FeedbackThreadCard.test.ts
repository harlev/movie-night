import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('FeedbackThreadCard supports owner menu actions, inline editing, and hides reply CTA for deleted threads', () => {
  const filePath = path.join(process.cwd(), 'src/components/feedback/FeedbackThreadCard.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import FeedbackInlineEditor from '@/components/feedback/FeedbackInlineEditor';"), true);
  assert.equal(source.includes("import FeedbackOwnerMenu from '@/components/feedback/FeedbackOwnerMenu';"), true);
  assert.equal(source.includes('thread.canEdit || thread.canDelete'), true);
  assert.equal(source.includes('<FeedbackOwnerMenu'), true);
  assert.equal(source.includes('<FeedbackInlineEditor'), true);
  assert.equal(source.includes("thread.editedAt ? 'Edited' : null"), true);
  assert.equal(source.includes('thread.canReply ? ('), true);
});
