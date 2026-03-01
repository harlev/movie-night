import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSiteBannerPublicUrl,
  getSiteBannerValidationError,
  SITE_BANNER_MAX_BYTES,
} from './siteBanner';

test('getSiteBannerValidationError returns an error when no file is provided', () => {
  assert.equal(getSiteBannerValidationError(null), 'Please choose an image file to upload');
});

test('getSiteBannerValidationError rejects files larger than max size', () => {
  const file = {
    type: 'image/png',
    size: SITE_BANNER_MAX_BYTES + 1,
  };

  assert.equal(
    getSiteBannerValidationError(file),
    'Banner image must be 4 MB or smaller'
  );
});

test('getSiteBannerValidationError rejects unsupported mime types', () => {
  const file = {
    type: 'image/gif',
    size: 512_000,
  };

  assert.equal(
    getSiteBannerValidationError(file),
    'Banner image must be PNG, JPG, or WEBP'
  );
});

test('getSiteBannerValidationError accepts supported image types within size limit', () => {
  const file = {
    type: 'image/webp',
    size: 512_000,
  };

  assert.equal(getSiteBannerValidationError(file), null);
});

test('buildSiteBannerPublicUrl builds a versioned public storage URL', () => {
  assert.equal(
    buildSiteBannerPublicUrl({
      supabaseUrl: 'https://demo-project.supabase.co',
      objectPath: 'banner/current',
      updatedAt: '2026-02-28T12:00:00.000Z',
    }),
    'https://demo-project.supabase.co/storage/v1/object/public/site-assets/banner/current?v=2026-02-28T12%3A00%3A00.000Z'
  );
});

test('buildSiteBannerPublicUrl returns null when URL input is incomplete', () => {
  assert.equal(
    buildSiteBannerPublicUrl({
      supabaseUrl: '',
      objectPath: 'banner/current',
      updatedAt: null,
    }),
    null
  );
  assert.equal(
    buildSiteBannerPublicUrl({
      supabaseUrl: 'https://demo-project.supabase.co',
      objectPath: '',
      updatedAt: null,
    }),
    null
  );
});
