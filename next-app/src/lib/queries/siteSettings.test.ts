import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const SITE_SETTINGS_QUERY_PATH = path.join(process.cwd(), 'src/lib/queries/siteSettings.ts');

test('site settings query includes next movie night number field', () => {
  const source = readFileSync(SITE_SETTINGS_QUERY_PATH, 'utf8');

  assert.equal(source.includes('next_movie_night_number: number | null;'), true);
  assert.equal(source.includes('next_movie_night_number,'), true);
});
