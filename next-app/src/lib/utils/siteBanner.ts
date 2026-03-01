export const SITE_BANNER_BUCKET = 'site-assets';
export const SITE_BANNER_OBJECT_PATH = 'banner/current';
export const SITE_BANNER_MOBILE_OBJECT_PATH = 'banner/current-mobile';
export const SITE_BANNER_MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_BANNER_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

interface BannerFileLike {
  size: number;
  type: string;
}

export function getSiteBannerValidationError(file: BannerFileLike | null | undefined): string | null {
  if (!file) return 'Please choose an image file to upload';
  if (!ALLOWED_BANNER_MIME_TYPES.has(file.type)) return 'Banner image must be PNG, JPG, or WEBP';
  if (file.size > SITE_BANNER_MAX_BYTES) return 'Banner image must be 4 MB or smaller';
  return null;
}

export function buildSiteBannerPublicUrl(input: {
  supabaseUrl: string | null | undefined;
  objectPath: string | null | undefined;
  updatedAt: string | null | undefined;
}): string | null {
  const baseUrl = input.supabaseUrl?.trim();
  const objectPath = input.objectPath?.trim();

  if (!baseUrl || !objectPath) return null;

  const version = input.updatedAt ? `?v=${encodeURIComponent(input.updatedAt)}` : '';
  return `${baseUrl}/storage/v1/object/public/${SITE_BANNER_BUCKET}/${objectPath}${version}`;
}
