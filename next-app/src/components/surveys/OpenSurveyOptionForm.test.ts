import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('server-action option form lets React configure multipart submission', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/components/surveys/OpenSurveyOptionForm.tsx'), 'utf8');
  assert.equal(source.includes('encType='), false);
});

test('responder option entry is a compact inline disclosure with optional details', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/components/surveys/OpenSurveyOptionForm.tsx'), 'utf8');

  assert.equal(source.includes('<details'), true);
  assert.equal(source.includes('<summary'), true);
  assert.equal(source.includes('Add your own option'), true);
  assert.equal(source.includes('Have an idea? Add it to the vote.'), true);
  assert.equal(source.includes('Add details'), true);
  assert.equal(source.includes('Make it stand out'), true);
  assert.equal(source.includes('type="button"'), true);
  assert.equal(source.includes('formRef.current?.reset()'), true);
  assert.equal(source.includes('ref={titleInputRef}'), true);
  assert.equal(source.includes('titleInputRef.current?.focus()'), true);
  assert.equal(source.includes('responderSummaryRef.current?.focus()'), true);
});
