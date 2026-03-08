import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SimpleVotingClient keeps a simple movie list while restoring the desktop /simple shell', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('Back to Dashboard'), true);
  assert.equal(source.includes('Current Standings'), true);
  assert.equal(source.includes('All Ballots'), true);
  assert.equal(source.includes('variant="full"'), true);
  assert.equal(source.includes('variant="compact"'), true);
  assert.equal(source.includes('onClick={() => handleMovieClick(entry.movie.id)}'), true);
  assert.equal(source.includes('hidden md:block'), true);
  assert.equal(source.includes('md:hidden'), true);
  assert.equal(source.includes('Your Ballot'), false);
  assert.equal(source.includes('SortableBallotList'), false);
  assert.equal(source.includes('Grid view'), false);
  assert.equal(source.includes('List view'), false);
  assert.equal(source.includes('setViewMode('), false);
  assert.equal(source.includes('rounded-[1.5rem] px-4 py-3'), true);
  assert.equal(source.includes('h-16 w-12 rounded-xl'), true);
  assert.equal(source.includes('text-lg leading-tight'), true);
  assert.equal(source.includes("cursor-pointer active:scale-[0.98]'"), true);
  assert.equal(source.includes('aria-label={`Toggle rank for ${entry.movie.title}`}'), true);
  assert.equal(source.includes('sticky bottom-4 z-10 mt-5'), false);
  assert.equal(source.includes('lg:sticky lg:top-6 lg:self-start'), true);
  assert.equal(source.includes('lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col'), true);
  assert.equal(source.includes('lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1'), true);
  assert.equal(source.includes('lg:border-t lg:border-[var(--color-border)]/50 lg:pt-4'), true);
  assert.equal(source.includes('desktop'), true);
  assert.equal(source.includes('entries={shuffledEntries}'), true);
  assert.equal(source.includes('handleMovieClick={handleMovieClick}'), true);
  assert.equal(source.includes('isMovieSelected={isMovieSelected}'), true);
  assert.equal(source.includes('moveRank={moveRank}'), true);
  assert.equal(source.includes('showMoveControls'), true);
});

test('SimpleVotingClient keeps mobile-only accessibility affordances for the hidden heading and footer progress', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('<h1 className="sr-only">{survey.title}</h1>'), true);
  assert.equal(source.includes('aria-live="polite"'), true);
  assert.equal(source.includes('{ballot.size} of {survey.maxRankN} ranks selected.'), true);
  assert.equal(source.includes('aria-hidden="true"'), true);
  assert.equal(source.includes('aria-label={`Rank ${i + 1}`}'), false);
});
