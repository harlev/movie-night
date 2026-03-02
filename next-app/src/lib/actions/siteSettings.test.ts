import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const SITE_SETTINGS_ACTION_PATH = path.join(process.cwd(), 'src/lib/actions/siteSettings.ts');

test('site settings actions include next movie selection updates', () => {
  const source = readFileSync(SITE_SETTINGS_ACTION_PATH, 'utf8');

  assert.equal(source.includes('export async function updateNextMovieSelectionAction'), true);
  assert.equal(source.includes("const movieIdRaw = (formData.get('movieId') as string | null)?.trim() ?? ''"), true);
  assert.equal(source.includes(".from('movies')"), true);
  assert.equal(source.includes('next_movie_id: mode === \'clear\' ? null : selectedMovie?.id ?? null'), true);
  assert.equal(source.includes('next_movie_source_survey_id: null'), true);
  assert.equal(source.includes('Clear Next Movie'), false);
});
