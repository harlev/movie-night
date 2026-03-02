'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createAdminLog } from '@/lib/queries/admin';
import { getUserById } from '@/lib/queries/profiles';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import {
  getSiteBannerValidationError,
  SITE_BANNER_BUCKET,
  SITE_BANNER_MOBILE_OBJECT_PATH,
  SITE_BANNER_OBJECT_PATH,
} from '@/lib/utils/siteBanner';

export async function uploadSiteBannerAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const bannerFile = formData.get('banner');
  if (!(bannerFile instanceof File)) return { error: 'Please choose an image file to upload' };

  const variant = formData.get('variant') === 'mobile' ? 'mobile' : 'desktop';
  const objectPath = variant === 'mobile' ? SITE_BANNER_MOBILE_OBJECT_PATH : SITE_BANNER_OBJECT_PATH;

  const validationError = getSiteBannerValidationError(bannerFile);
  if (validationError) return { error: validationError };

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(SITE_BANNER_BUCKET)
    .upload(objectPath, await bannerFile.arrayBuffer(), {
      upsert: true,
      contentType: bannerFile.type,
      cacheControl: '3600',
    });
  if (uploadError) {
    console.error('Failed to upload site banner:', uploadError);
    return { error: 'Failed to upload banner image' };
  }

  const currentBanner = await getSiteBanner();
  const now = new Date().toISOString();
  const desktopPath = variant === 'desktop' ? objectPath : currentBanner?.image_path ?? null;
  const mobilePath = variant === 'mobile' ? objectPath : currentBanner?.mobile_image_path ?? null;

  const { error: updateError } = await admin.from('site_banners').upsert(
    {
      id: 'main',
      image_path: desktopPath,
      mobile_image_path: mobilePath,
      next_movie_night_override_date: currentBanner?.next_movie_night_override_date ?? null,
      enabled: desktopPath ? true : (currentBanner?.enabled ?? false),
      updated_by: user.id,
      updated_at: now,
    },
    { onConflict: 'id' }
  );
  if (updateError) {
    console.error('Failed to save banner settings:', updateError);
    return { error: 'Banner uploaded but settings update failed' };
  }

  await createAdminLog({
    actorId: user.id,
    action: variant === 'mobile' ? 'site_banner_mobile_uploaded' : 'site_banner_uploaded',
    targetType: 'banner',
    targetId: 'main',
    details: {
      variant,
      fileName: bannerFile.name,
      fileSize: bannerFile.size,
      mimeType: bannerFile.type,
    },
  });

  revalidatePath('/admin/site-settings');
  revalidatePath('/dashboard');
  revalidatePath('/movies');
  if (variant === 'mobile') {
    return { success: true, message: 'Mobile banner uploaded' };
  }

  return { success: true, message: 'Desktop banner uploaded and enabled' };
}

export async function toggleSiteBannerAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const enabled = formData.get('enabled') === 'true';
  const currentBanner = await getSiteBanner();

  if (enabled && !currentBanner?.image_path) {
    return { error: 'Upload a banner image before turning the banner on' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: updateError } = await admin.from('site_banners').upsert(
    {
      id: 'main',
      image_path: currentBanner?.image_path ?? null,
      mobile_image_path: currentBanner?.mobile_image_path ?? null,
      next_movie_night_override_date: currentBanner?.next_movie_night_override_date ?? null,
      enabled,
      updated_by: user.id,
      updated_at: now,
    },
    { onConflict: 'id' }
  );
  if (updateError) {
    console.error('Failed to toggle site banner:', updateError);
    return { error: 'Failed to update banner visibility' };
  }

  await createAdminLog({
    actorId: user.id,
    action: enabled ? 'site_banner_enabled' : 'site_banner_disabled',
    targetType: 'banner',
    targetId: 'main',
    details: {},
  });

  revalidatePath('/admin/site-settings');
  revalidatePath('/dashboard');
  revalidatePath('/movies');
  return { success: true, message: enabled ? 'Banner is now visible' : 'Banner is now hidden' };
}

export async function updateNextMovieNightOverrideAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const mode = formData.get('mode') === 'clear' ? 'clear' : 'set';
  const overrideDateRaw = (formData.get('overrideDate') as string | null)?.trim() ?? '';
  const overrideDate =
    mode === 'clear'
      ? null
      : /^\d{4}-\d{2}-\d{2}$/.test(overrideDateRaw)
        ? overrideDateRaw
        : null;

  if (mode === 'set' && !overrideDate) {
    return { error: 'Please choose a valid override date' };
  }

  const currentBanner = await getSiteBanner();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: updateError } = await admin.from('site_banners').upsert(
    {
      id: 'main',
      image_path: currentBanner?.image_path ?? null,
      mobile_image_path: currentBanner?.mobile_image_path ?? null,
      next_movie_night_override_date: overrideDate,
      enabled: currentBanner?.enabled ?? false,
      updated_by: user.id,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (updateError) {
    console.error('Failed to update next movie night override:', updateError);
    return { error: 'Failed to update next movie night settings' };
  }

  await createAdminLog({
    actorId: user.id,
    action: mode === 'clear' ? 'next_movie_night_override_cleared' : 'next_movie_night_override_set',
    targetType: 'banner',
    targetId: 'main',
    details: {
      overrideDate,
    },
  });

  revalidatePath('/admin/site-settings');
  revalidatePath('/dashboard');

  return {
    success: true,
    message:
      mode === 'clear'
        ? 'Next movie night override cleared'
        : 'Next movie night override saved',
  };
}
