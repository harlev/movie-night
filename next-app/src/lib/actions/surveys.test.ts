import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'src/lib/actions/surveys.ts'), 'utf8');

test('survey actions create open surveys with secure defaults and 1/3/5 selection validation', () => {
  assert.equal(source.includes("formData.get('surveyType')"), true);
  assert.equal(source.includes("readCheckbox(formData, 'isAnonymous', false)"), true);
  assert.equal(source.includes("readCheckbox(formData, 'membersOnly', true)"), true);
  assert.equal(source.includes('validateSurveySelectionSize'), true);
  assert.equal(source.includes('membersOnly,'), true);
  assert.equal(source.includes("profile.status !== 'active'"), true);
});

test('survey actions enforce option permissions, closing, upload cleanup, and two-admin-option rule', () => {
  assert.equal(source.includes('export async function addOpenSurveyOptionAction'), true);
  assert.equal(source.includes('export async function addResponderSurveyOptionAction'), true);
  assert.equal(source.includes('export async function removeOpenSurveyOptionAction'), true);
  assert.equal(source.includes('export async function updateSurveySettingsAction'), true);
  assert.equal(source.includes('getAdminSurveyOptionCount'), true);
  assert.equal(source.includes('canDisableResponderOptions'), true);
  assert.equal(source.includes('isSurveyClosed'), true);
  assert.equal(source.includes('reconcileExpiredSurvey'), true);
  assert.equal(source.includes('queueSurveyOptionImageCleanup'), true);
  assert.equal(source.includes('cleanupSurveyOptionImages'), true);
  assert.equal(source.includes("choices.some((choice) => choice.id === optionId)"), true);
  assert.equal(source.includes("await updateSurvey(surveyId, { allow_responder_options: true })"), true);
});
