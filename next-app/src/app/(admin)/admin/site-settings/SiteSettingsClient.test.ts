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
  assert.equal(source.includes('Clear Override'), true);
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
