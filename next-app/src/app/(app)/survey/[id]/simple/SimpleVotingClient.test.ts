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
});
