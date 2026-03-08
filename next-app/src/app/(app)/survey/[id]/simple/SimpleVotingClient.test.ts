import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SimpleVotingClient keeps the mobile survey screen compressed and uses always-vote row taps', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('href="/dashboard"'), false);
  assert.equal(source.includes('Points per position'), false);
  assert.equal(source.includes('toggleMovie('), false);
  assert.equal(source.includes('onClick={() => handleMovieClick(entry.movie.id)}'), true);
  assert.equal(source.includes('survey.description && ('), true);
  assert.equal(source.includes('Filter movies...'), false);
  assert.equal(
    source.includes(
      'inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-3'
    ),
    true
  );
  assert.equal(
    source.includes(
      'ml-auto inline-flex min-h-9 items-center justify-center rounded-full'
    ),
    true
  );
  assert.equal(source.includes('aria-label={`Rank ${i + 1}`}'), true);
  assert.equal(source.includes('onClick={clearBallot}'), true);
  assert.equal(source.includes('Clear all'), false);
});
