import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterMoviesByWatched,
  getWatchedNomineeWarningToast,
  getSurveyWinnerWatchDeadlineUTC,
  isPastSurveyWinnerWatchDeadline,
} from './watchedMovies';

test('filterMoviesByWatched excludes watched movies when includeWatched is false', () => {
  const movies = [
    { id: 'm1', watched: false },
    { id: 'm2', watched: true },
    { id: 'm3', watched: false },
  ];

  assert.deepEqual(filterMoviesByWatched(movies, false), [
    { id: 'm1', watched: false },
    { id: 'm3', watched: false },
  ]);
});

test('filterMoviesByWatched includes watched movies when includeWatched is true', () => {
  const movies = [
    { id: 'm1', watched: false },
    { id: 'm2', watched: true },
  ];

  assert.deepEqual(filterMoviesByWatched(movies, true), movies);
});

test('getSurveyWinnerWatchDeadlineUTC returns Wednesday 11:00 PM Pacific after freeze', () => {
  // Sunday Jan 4, 2026 6:00 PM Pacific
  const frozenAt = '2026-01-05T02:00:00.000Z';

  assert.equal(
    getSurveyWinnerWatchDeadlineUTC(frozenAt),
    '2026-01-08T07:00:00.000Z'
  );
});

test('getSurveyWinnerWatchDeadlineUTC moves to next week when frozen after Wednesday 11 PM Pacific', () => {
  // Thursday Jan 8, 2026 1:00 AM Pacific
  const frozenAt = '2026-01-08T09:00:00.000Z';

  assert.equal(
    getSurveyWinnerWatchDeadlineUTC(frozenAt),
    '2026-01-15T07:00:00.000Z'
  );
});

test('isPastSurveyWinnerWatchDeadline returns true only after the Wednesday cutoff', () => {
  const frozenAt = '2026-01-05T02:00:00.000Z'; // Sunday 6 PM Pacific

  assert.equal(
    isPastSurveyWinnerWatchDeadline(frozenAt, new Date('2026-01-08T06:59:59.000Z')),
    false
  );

  assert.equal(
    isPastSurveyWinnerWatchDeadline(frozenAt, new Date('2026-01-08T07:00:00.000Z')),
    true
  );
});

test('getWatchedNomineeWarningToast includes movie title', () => {
  assert.equal(
    getWatchedNomineeWarningToast('Blade Runner 2049'),
    '"Blade Runner 2049" is marked as watched. It was added to nominees anyway.'
  );
});
