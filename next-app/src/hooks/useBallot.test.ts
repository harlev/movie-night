import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMovieClick } from './useBallot';

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
