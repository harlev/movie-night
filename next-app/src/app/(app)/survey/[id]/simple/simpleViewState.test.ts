import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSimpleSurveyView } from './simpleViewState';

test('resolveSimpleSurveyView defaults a live user without a ballot to the ballot view', () => {
  const resolved = resolveSimpleSurveyView({
    requestedView: null,
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: false,
    surveyState: 'live',
    userRole: 'member',
  });

  assert.equal(resolved.view, 'ballot');
  assert.equal(resolved.resultsPage, 1);
  assert.equal(resolved.canEditBallot, true);
  assert.equal(resolved.showSubmittedFlash, false);
  assert.equal(resolved.shouldRedirect, true);
  assert.equal(resolved.canonicalSearch, '?view=ballot');
});

test('resolveSimpleSurveyView blocks direct results access for a live user without a ballot', () => {
  const resolved = resolveSimpleSurveyView({
    requestedView: 'results',
    requestedPage: '2',
    requestedSubmitted: null,
    hasExistingBallot: false,
    surveyState: 'live',
    userRole: 'member',
  });

  assert.equal(resolved.view, 'ballot');
  assert.equal(resolved.shouldRedirect, true);
  assert.equal(resolved.canonicalSearch, '?view=ballot');
});

test('resolveSimpleSurveyView defaults a live user with a ballot to results page 1', () => {
  const resolved = resolveSimpleSurveyView({
    requestedView: null,
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: true,
    surveyState: 'live',
    userRole: 'member',
  });

  assert.equal(resolved.view, 'results');
  assert.equal(resolved.resultsPage, 1);
  assert.equal(resolved.canEditBallot, true);
  assert.equal(resolved.showSubmittedFlash, false);
  assert.equal(resolved.shouldRedirect, true);
  assert.equal(resolved.canonicalSearch, '?view=results');
});

test('resolveSimpleSurveyView allows a live user with a ballot to open the ballot editor', () => {
  const resolved = resolveSimpleSurveyView({
    requestedView: 'ballot',
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: true,
    surveyState: 'live',
    userRole: 'member',
  });

  assert.equal(resolved.view, 'ballot');
  assert.equal(resolved.resultsPage, 1);
  assert.equal(resolved.shouldRedirect, false);
  assert.equal(resolved.canonicalSearch, '?view=ballot');
});

test('resolveSimpleSurveyView defaults closed or viewer users to results page 1', () => {
  const closedSurvey = resolveSimpleSurveyView({
    requestedView: null,
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: true,
    surveyState: 'frozen',
    userRole: 'member',
  });
  const viewer = resolveSimpleSurveyView({
    requestedView: null,
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: false,
    surveyState: 'live',
    userRole: 'viewer',
  });

  assert.equal(closedSurvey.view, 'results');
  assert.equal(closedSurvey.resultsPage, 1);
  assert.equal(closedSurvey.canEditBallot, false);
  assert.equal(closedSurvey.shouldRedirect, true);
  assert.equal(closedSurvey.canonicalSearch, '?view=results');

  assert.equal(viewer.view, 'results');
  assert.equal(viewer.resultsPage, 1);
  assert.equal(viewer.canEditBallot, false);
  assert.equal(viewer.shouldRedirect, true);
  assert.equal(viewer.canonicalSearch, '?view=results');
});

test('resolveSimpleSurveyView redirects closed or viewer users away from the ballot editor', () => {
  const closedSurvey = resolveSimpleSurveyView({
    requestedView: 'ballot',
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: true,
    surveyState: 'frozen',
    userRole: 'member',
  });
  const viewer = resolveSimpleSurveyView({
    requestedView: 'ballot',
    requestedPage: null,
    requestedSubmitted: null,
    hasExistingBallot: false,
    surveyState: 'live',
    userRole: 'viewer',
  });

  assert.equal(closedSurvey.view, 'results');
  assert.equal(closedSurvey.shouldRedirect, true);
  assert.equal(closedSurvey.canonicalSearch, '?view=results');

  assert.equal(viewer.view, 'results');
  assert.equal(viewer.shouldRedirect, true);
  assert.equal(viewer.canonicalSearch, '?view=results');
});

test('resolveSimpleSurveyView normalizes invalid result pages to page 1', () => {
  const resolved = resolveSimpleSurveyView({
    requestedView: 'results',
    requestedPage: '99',
    requestedSubmitted: null,
    hasExistingBallot: true,
    surveyState: 'live',
    userRole: 'member',
  });

  assert.equal(resolved.view, 'results');
  assert.equal(resolved.resultsPage, 1);
  assert.equal(resolved.shouldRedirect, true);
  assert.equal(resolved.canonicalSearch, '?view=results');
});

test('resolveSimpleSurveyView preserves the one-time submitted flash state on the first results arrival', () => {
  const resolved = resolveSimpleSurveyView({
    requestedView: 'results',
    requestedPage: null,
    requestedSubmitted: '1',
    hasExistingBallot: true,
    surveyState: 'live',
    userRole: 'member',
  });

  assert.equal(resolved.view, 'results');
  assert.equal(resolved.resultsPage, 1);
  assert.equal(resolved.showSubmittedFlash, true);
  assert.equal(resolved.shouldRedirect, false);
  assert.equal(resolved.canonicalSearch, '?view=results&submitted=1');
});
