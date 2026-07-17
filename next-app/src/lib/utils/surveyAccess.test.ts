import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSurveyBallotOwner, resolveSurveyOptionCreator } from './surveyAccess';

test('members-only surveys reject guests and viewers', () => {
  assert.deepEqual(
    resolveSurveyBallotOwner({ membersOnly: true, isAnonymous: false, userId: null, userRole: null, voterId: 'browser', guestName: 'Pat' }),
    { error: 'This survey is limited to members' }
  );
  assert.deepEqual(
    resolveSurveyBallotOwner({ membersOnly: true, isAnonymous: false, userId: 'viewer', userRole: 'viewer', voterId: 'browser', guestName: null }),
    { error: 'Viewers cannot submit ballots' }
  );
});

test('anonymous surveys retain only a browser voter identifier', () => {
  assert.deepEqual(
    resolveSurveyBallotOwner({ membersOnly: true, isAnonymous: true, userId: 'member', userRole: 'member', voterId: 'browser', guestName: 'Ignored' }),
    {
      authenticatedUserId: 'member',
      ownerMode: 'anonymous',
      voterId: 'browser',
      guestDisplayName: null,
    }
  );
});

test('public named surveys use a profile or require a guest display name', () => {
  assert.deepEqual(
    resolveSurveyBallotOwner({ membersOnly: false, isAnonymous: false, userId: 'member', userRole: 'member', voterId: 'browser', guestName: null }),
    {
      authenticatedUserId: 'member',
      ownerMode: 'user',
      voterId: null,
      guestDisplayName: null,
    }
  );
  assert.deepEqual(
    resolveSurveyBallotOwner({ membersOnly: false, isAnonymous: false, userId: null, userRole: null, voterId: 'browser', guestName: '  Pat  ' }),
    {
      authenticatedUserId: null,
      ownerMode: 'guest',
      voterId: 'browser',
      guestDisplayName: 'Pat',
    }
  );
  assert.deepEqual(
    resolveSurveyBallotOwner({ membersOnly: false, isAnonymous: false, userId: null, userRole: null, voterId: 'browser', guestName: ' ' }),
    { error: 'Your name is required' }
  );
});

test('anonymous option creators do not store their profile id', () => {
  assert.deepEqual(
    resolveSurveyOptionCreator({ isAnonymous: true, userId: 'member', voterId: 'browser' }),
    { addedBy: null, voterId: 'browser' }
  );
  assert.deepEqual(
    resolveSurveyOptionCreator({ isAnonymous: false, userId: 'member', voterId: 'browser' }),
    { addedBy: 'member', voterId: null }
  );
});
