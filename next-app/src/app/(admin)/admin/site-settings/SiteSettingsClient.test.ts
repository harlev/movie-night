import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const SITE_SETTINGS_CLIENT_PATH = path.join(
  process.cwd(),
  'src/app/(admin)/admin/site-settings/SiteSettingsClient.tsx'
);

test('SiteSettingsClient includes scheduling controls for next movie night', () => {
  const source = readFileSync(SITE_SETTINGS_CLIENT_PATH, 'utf8');

  assert.equal(source.includes('Next Movie Night'), true);
  assert.equal(source.includes('Override Date'), true);
  assert.equal(source.includes('siteSettings?.next_movie_night_override_date'), true);
  assert.equal(source.includes('banner?.next_movie_night_override_date'), false);
  assert.equal(source.includes('Clear Override'), true);
  assert.equal(source.includes('updateNextMovieSelectionAction'), true);
  assert.equal(source.includes('Next Movie Selection'), true);
  assert.equal(source.includes('name="movieId"'), true);
  assert.equal(source.includes('siteSettings?.next_movie_id'), true);
  assert.equal(source.includes('Save Next Movie'), true);
  assert.equal(source.includes('Clear Next Movie'), true);
});

test('SiteSettingsClient keeps banner branding controls', () => {
  const source = readFileSync(SITE_SETTINGS_CLIENT_PATH, 'utf8');

  assert.equal(source.includes('encType="multipart/form-data"'), false);
  assert.equal(source.includes('router.refresh()'), true);
  assert.equal(source.includes('New Banner Preview'), true);
  assert.equal(source.includes('New Mobile Banner Preview'), true);
  assert.equal(source.includes('Upload Desktop Banner Image'), true);
  assert.equal(source.includes('Upload Mobile Banner Image'), true);
});
