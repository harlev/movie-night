import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSurveyBallotOwnerBadge,
  getSurveyBallotOwnerLabel,
} from './surveyBallotOwner.ts';

test('getSurveyBallotOwnerLabel returns the guest display name when present', () => {
  assert.equal(
    getSurveyBallotOwnerLabel({
      ownerMode: 'guest',
      identifiedDisplayName: null,
      guestDisplayName: 'Chris',
    }),
    'Chris'
  );
});

test('getSurveyBallotOwnerLabel falls back to Anonymous for unnamed guests', () => {
  assert.equal(
    getSurveyBallotOwnerLabel({
      ownerMode: 'guest',
      identifiedDisplayName: null,
      guestDisplayName: null,
    }),
    'Anonymous'
  );
});

test('getSurveyBallotOwnerLabel prefers the identified display name for signed-in ballots', () => {
  assert.equal(
    getSurveyBallotOwnerLabel({
      ownerMode: 'identified',
      identifiedDisplayName: 'Dana',
      guestDisplayName: 'Ignored',
    }),
    'Dana'
  );
});

test('getSurveyBallotOwnerBadge labels guest ballots without badging identified users', () => {
  assert.equal(getSurveyBallotOwnerBadge('guest'), 'Guest');
  assert.equal(getSurveyBallotOwnerBadge('identified'), null);
});
