import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('survey routes receive a stable http-only voter cookie without middleware auth redirects', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/lib/supabase/middleware.ts'), 'utf8');

  assert.equal(source.includes("const appRoutes = ['/dashboard', '/movies', '/history', '/settings']"), true);
  assert.equal(source.includes("pathname.startsWith('/survey/')"), true);
  assert.equal(source.includes("'survey_voter_id'"), true);
  assert.equal(source.includes('httpOnly: true'), true);
});
