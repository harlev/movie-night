import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SURVEY_SELECTION_SIZES,
  canDisableResponderOptions,
  getSurveyOptionValidationError,
  isSurveyClosed,
  normalizeSurveyLink,
  validateSurveySelectionSize,
} from './surveyConfig';

test('new surveys allow only one, three, or five selections', () => {
  assert.deepEqual(SURVEY_SELECTION_SIZES, [1, 3, 5]);
  assert.equal(validateSurveySelectionSize('1'), 1);
  assert.equal(validateSurveySelectionSize(3), 3);
  assert.equal(validateSurveySelectionSize(5), 5);
  assert.equal(validateSurveySelectionSize(7), null);
  assert.equal(validateSurveySelectionSize('not-a-number'), null);
});

test('responder options cannot be disabled below two admin-authored options', () => {
  assert.equal(canDisableResponderOptions(0), false);
  assert.equal(canDisableResponderOptions(1), false);
  assert.equal(canDisableResponderOptions(2), true);
});

test('a live survey closes at the exact configured instant', () => {
  const now = new Date('2026-07-17T01:00:00.000Z');
  assert.equal(
    isSurveyClosed({ state: 'live', closesAt: '2026-07-17T01:00:00.000Z' }, now),
    true
  );
  assert.equal(
    isSurveyClosed({ state: 'live', closesAt: '2026-07-17T01:00:00.001Z' }, now),
    false
  );
  assert.equal(isSurveyClosed({ state: 'frozen', closesAt: null }, now), true);
});

test('survey links accept only absolute http and https URLs', () => {
  assert.equal(normalizeSurveyLink(' https://example.com/path '), 'https://example.com/path');
  assert.equal(normalizeSurveyLink('http://example.com'), 'http://example.com/');
  assert.equal(normalizeSurveyLink('javascript:alert(1)'), null);
  assert.equal(normalizeSurveyLink('/relative'), null);
  assert.equal(normalizeSurveyLink(''), null);
});

test('survey options require a bounded title and supported optional image', () => {
  assert.equal(getSurveyOptionValidationError({ title: '' }), 'Option title is required');
  assert.equal(getSurveyOptionValidationError({ title: 'A'.repeat(101) }), 'Option title must be 100 characters or fewer');
  assert.equal(
    getSurveyOptionValidationError({ title: 'Lunch', image: { size: 1, type: 'image/gif' } }),
    'Option image must be a PNG, JPEG, or WebP file'
  );
  assert.equal(
    getSurveyOptionValidationError({ title: 'Lunch', image: { size: 2_000_001, type: 'image/png' } }),
    'Option image must be 2 MB or smaller'
  );
  assert.equal(getSurveyOptionValidationError({ title: 'Lunch' }), null);
});
