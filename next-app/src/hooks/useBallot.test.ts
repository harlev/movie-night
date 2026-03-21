import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { applyMovieClick } from './useBallot.ts';

test('applyMovieClick removes an already-ranked movie and compacts later ranks', () => {
  const { ballot, assignedRank } = applyMovieClick(
    new Map([
      [1, 'movie-1'],
      [2, 'movie-2'],
      [3, 'movie-3'],
    ]),
    'movie-2',
    3
  );

  assert.deepEqual(Array.from(ballot.entries()), [
    [1, 'movie-1'],
    [2, 'movie-3'],
  ]);
  assert.equal(assignedRank, null);
});

test('applyMovieClick replaces the last rank when adding a new movie to a full ballot', () => {
  const { ballot, assignedRank } = applyMovieClick(
    new Map([
      [1, 'movie-1'],
      [2, 'movie-2'],
      [3, 'movie-3'],
    ]),
    'movie-4',
    3
  );

  assert.deepEqual(Array.from(ballot.entries()), [
    [1, 'movie-1'],
    [2, 'movie-2'],
    [3, 'movie-4'],
  ]);
  assert.equal(assignedRank, 3);
});

test('useBallot does not keep the legacy click updater side effect or unused toggle helpers', () => {
  const filePath = path.join(process.cwd(), 'src/hooks/useBallot.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('let assignedRank: number | null = null;'), false);
  assert.equal(source.includes('const toggleMovie = useCallback('), false);
  assert.equal(source.includes('const getMovieForRank = useCallback('), false);
});

test('useBallot can hydrate and persist a survey draft through localStorage', () => {
  const filePath = path.join(process.cwd(), 'src/hooks/useBallot.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('storageKey?: string | null;'), true);
  assert.equal(source.includes('localStorage.getItem(storageKey)'), true);
  assert.equal(source.includes('localStorage.setItem('), true);
});
