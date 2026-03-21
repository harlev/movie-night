import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('FeedbackComposer clears reply state without manually refreshing the route', () => {
  const filePath = path.join(process.cwd(), 'src/components/feedback/FeedbackComposer.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import { useRouter } from 'next/navigation';"), false);
  assert.equal(source.includes('useEffectEvent'), true);
  assert.equal(source.includes('const clearReplyTarget = useEffectEvent(() => {'), true);
  assert.equal(source.includes('clearReplyTarget();'), true);
  assert.equal(source.includes('router.refresh();'), false);
  assert.equal(source.includes('}, [state?.success]);'), true);
});

test('FeedbackComposer uses an inline switch for anonymous posting', () => {
  const filePath = path.join(process.cwd(), 'src/components/feedback/FeedbackComposer.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes("const heading = mode === 'reply' ? 'Add a reply' : 'Share a thought';"),
    true
  );
  assert.equal(
    source.includes("mode === 'reply'"),
    true
  );
  assert.equal(
    source.includes("? 'Add to the conversation...'"),
    true
  );
  assert.equal(
    source.includes(": 'What would make movie night better?'"),
    true
  );
  assert.equal(
    source.includes(": 'Share an idea, suggestion, or note about movie night...'"),
    false
  );
  assert.equal(
    source.includes("aria-label={mode === 'reply' ? 'Reply' : 'Share a thought'}"),
    true
  );
  assert.equal(source.includes('Post anonymously'), true);
  assert.equal(source.includes('type="checkbox"'), true);
  assert.equal(source.includes('inline-flex w-fit cursor-pointer items-center gap-3'), true);
  assert.equal(
    source.includes('relative inline-flex h-5 w-10 items-center rounded-full transition-colors'),
    true
  );
  assert.equal(source.includes('className="sr-only"'), true);
  assert.equal(
    source.includes('Anonymous posts appear as Anonymous but remain attributable to admins.'),
    false
  );
  assert.equal(
    source.includes('Your identity will remain private - including from site admins.'),
    true
  );
  assert.equal(source.includes('Shown as Anonymous.'), false);
  assert.equal(source.includes('max-w-sm space-y-1.5'), true);
  assert.equal(source.includes('Plain text only.'), false);
  assert.equal(
    source.includes("mode === 'reply'\n              ? 'Replies stay in this thread and are visible to everyone here.'"),
    false
  );
  assert.equal(
    source.includes(": 'Posts are visible to the whole movie night group.'"),
    false
  );
  assert.equal(source.includes('My name'), false);
  assert.equal(source.includes('Publicly shows your saved display name snapshot.'), false);
});
