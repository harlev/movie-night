import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('survey and poll voting pages keep countdown row wrap-safe on mobile', () => {
  const surveySource = readSource('src/app/(app)/survey/[id]/SurveyVotingClient.tsx');
  const pollSource = readSource('src/app/(poll)/poll/[id]/PollVotingClient.tsx');

  assert.equal(
    surveySource.includes('flex flex-wrap items-center justify-center gap-2 sm:gap-3'),
    true
  );
  assert.equal(
    pollSource.includes('flex flex-wrap items-center justify-center gap-2 sm:gap-3'),
    true
  );
  assert.equal(surveySource.includes('className="min-w-0 max-w-full"'), true);
  assert.equal(pollSource.includes('className="min-w-0 max-w-full"'), true);
});

test('app layout blocks accidental horizontal page scroll', () => {
  const appLayoutSource = readSource('src/app/(app)/layout.tsx');

  assert.equal(
    appLayoutSource.includes('min-h-screen bg-[var(--color-background)] overflow-x-hidden'),
    true
  );
});
