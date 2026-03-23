import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('FeedbackOwnerMenu uses a pointer cursor on the trigger button', () => {
  const filePath = path.join(process.cwd(), 'src/components/feedback/FeedbackOwnerMenu.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('aria-label="Open feedback actions"'), true);
  assert.equal(source.includes('cursor-pointer'), true);
});
