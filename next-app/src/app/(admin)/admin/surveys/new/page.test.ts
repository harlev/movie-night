import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('new survey page chooses movie or open and reuses shared settings', () => {
  const page = readFileSync(path.join(process.cwd(), 'src/app/(admin)/admin/surveys/new/page.tsx'), 'utf8');
  const fields = readFileSync(path.join(process.cwd(), 'src/components/surveys/SurveySettingsFields.tsx'), 'utf8');

  assert.equal(page.includes('Movie survey'), true);
  assert.equal(page.includes('Open survey'), true);
  assert.equal(page.includes('name="surveyType"'), true);
  assert.equal(page.includes('<SurveySettingsFields'), true);
  assert.equal(fields.includes('SURVEY_SELECTION_SIZES.map'), true);
  assert.equal(fields.includes('Anonymous responses'), true);
  assert.equal(fields.includes('Members only'), true);
});
