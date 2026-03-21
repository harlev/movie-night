import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('survey guest hashing only uses server-side secrets', () => {
  const filePath = path.join(process.cwd(), 'src/lib/utils/surveyGuest.server.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('process.env.SURVEY_GUEST_HASH_SECRET ||'), true);
  assert.equal(source.includes('process.env.SUPABASE_SERVICE_ROLE_KEY;'), true);
  assert.equal(source.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), false);
  assert.equal(source.includes('movie-night-survey-guest'), false);
});
