import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('server-action option form lets React configure multipart submission', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/components/surveys/OpenSurveyOptionForm.tsx'), 'utf8');
  assert.equal(source.includes('encType='), false);
});
