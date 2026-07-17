import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('finalize endpoint requires the Vercel cron secret and refreshes affected pages', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/app/api/surveys/finalize/route.ts'), 'utf8');

  assert.equal(source.includes('process.env.CRON_SECRET'), true);
  assert.equal(source.includes("request.headers.get('authorization')"), true);
  assert.equal(source.includes('Bearer ${secret}'), true);
  assert.equal(source.includes('finalizeExpiredSurveys()'), true);
  assert.equal(source.includes("revalidatePath('/dashboard')"), true);
  assert.equal(source.includes('revalidatePath(`/survey/${surveyId}`)'), true);
});

test('deployment schedules survey finalization', () => {
  const config = JSON.parse(readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'));
  assert.deepEqual(config.crons, [{ path: '/api/surveys/finalize', schedule: '0 * * * *' }]);
});
