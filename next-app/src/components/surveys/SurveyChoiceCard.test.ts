import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SurveyChoiceCard renders compact images and safe external links', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/components/surveys/SurveyChoiceCard.tsx'), 'utf8');

  assert.equal(source.includes('width={64}'), true);
  assert.equal(source.includes('height={64}'), true);
  assert.equal(source.includes('target="_blank"'), true);
  assert.equal(source.includes('rel="noreferrer noopener"'), true);
});
