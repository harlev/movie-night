import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getNextMovieNightDateLabel,
  getNextMovieNightLabel,
  getNextWednesdayIsoDate,
} from './nextMovieNight';

test('getNextWednesdayIsoDate returns the upcoming Wednesday in Pacific Time', () => {
  assert.equal(
    getNextWednesdayIsoDate(new Date('2026-03-01T12:00:00.000Z')),
    '2026-03-04'
  );
});

test('getNextWednesdayIsoDate skips to the following week when today is Wednesday', () => {
  assert.equal(
    getNextWednesdayIsoDate(new Date('2026-03-04T18:30:00.000Z')),
    '2026-03-11'
  );
});

test('getNextWednesdayIsoDate honors timezone-specific day boundaries', () => {
  const now = new Date('2026-03-04T01:00:00.000Z');

  assert.equal(getNextWednesdayIsoDate(now, 'America/Los_Angeles'), '2026-03-04');
  assert.equal(getNextWednesdayIsoDate(now, 'UTC'), '2026-03-11');
});

test('getNextMovieNightDateLabel formats the computed date for dashboard display', () => {
  assert.equal(
    getNextMovieNightDateLabel(new Date('2026-03-01T12:00:00.000Z')),
    'Wed, Mar 4'
  );
});

test('getNextMovieNightLabel shows Today! on Wednesday before 8pm Pacific', () => {
  assert.equal(
    getNextMovieNightLabel({
      now: new Date('2026-03-04T21:00:00.000Z'),
      timeZone: 'America/Los_Angeles',
    }),
    'Today!'
  );
});

test('getNextMovieNightLabel rolls to next Wednesday at or after 8pm Pacific', () => {
  assert.equal(
    getNextMovieNightLabel({
      now: new Date('2026-03-05T04:00:00.000Z'),
      timeZone: 'America/Los_Angeles',
    }),
    'Wed, Mar 11'
  );
});

test('getNextMovieNightLabel uses manual override date when set', () => {
  assert.equal(
    getNextMovieNightLabel({
      now: new Date('2026-03-04T21:00:00.000Z'),
      overrideDate: '2026-03-18',
      timeZone: 'America/Los_Angeles',
    }),
    'Wed, Mar 18'
  );
});
