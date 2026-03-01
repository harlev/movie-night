import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('BannerSettingsClient upload form does not set encType for server action forms', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(admin)/admin/banner/BannerSettingsClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes('encType="multipart/form-data"'),
    false
  );
});

test('BannerSettingsClient includes a staged new-banner preview section', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(admin)/admin/banner/BannerSettingsClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('New Banner Preview'), true);
});

test('BannerSettingsClient shows updated desktop ratio guidance', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(admin)/admin/banner/BannerSettingsClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('around 10:1'), true);
});

test('BannerSettingsClient includes mobile banner upload controls', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(admin)/admin/banner/BannerSettingsClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('Upload Mobile Banner Image'), true);
  assert.equal(source.includes('New Mobile Banner Preview'), true);
});

test('BannerSettingsClient refreshes the route after successful apply', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(admin)/admin/banner/BannerSettingsClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('router.refresh()'), true);
});
