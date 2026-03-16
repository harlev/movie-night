import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('submitBallotAction supports validated simple-survey redirects after submission', () => {
  const filePath = path.join(process.cwd(), 'src/lib/actions/ballots.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import { redirect } from 'next/navigation';"), true);
  assert.equal(source.includes("const successRedirect = formData.get('successRedirect') as string | null;"), true);
  assert.equal(source.includes('const validatedSuccessRedirect = getSimpleSurveySuccessRedirect('), true);
  assert.equal(source.includes('revalidatePath(`/survey/${surveyId}/simple`);'), true);
  assert.equal(source.includes('redirect(validatedSuccessRedirect);'), true);
  assert.equal(source.includes('?view=results&submitted=1'), true);
});
