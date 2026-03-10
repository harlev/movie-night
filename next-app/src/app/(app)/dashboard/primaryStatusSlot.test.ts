import assert from 'node:assert/strict';
import test from 'node:test';

import { getPrimaryStatusSlot } from './primaryStatusSlot.ts';

test('primary status slot shows movie when active movie exists and no survey', () => {
  assert.equal(
    getPrimaryStatusSlot({ hasActiveMovie: true, hasActiveSurvey: false }),
    'movie'
  );
});

test('primary status slot shows survey when no movie and active survey exists', () => {
  assert.equal(
    getPrimaryStatusSlot({ hasActiveMovie: false, hasActiveSurvey: true }),
    'survey'
  );
});

test('primary status slot shows none when neither movie nor survey exists', () => {
  assert.equal(
    getPrimaryStatusSlot({ hasActiveMovie: false, hasActiveSurvey: false }),
    'none'
  );
});

test('primary status slot prefers movie when both movie and survey exist', () => {
  assert.equal(
    getPrimaryStatusSlot({ hasActiveMovie: true, hasActiveSurvey: true }),
    'movie'
  );
});
