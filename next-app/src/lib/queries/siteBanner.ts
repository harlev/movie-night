import { createClient } from '@/lib/supabase/server';

export interface SiteBannerSettings {
  id: 'main';
  image_path: string | null;
  mobile_image_path: string | null;
  enabled: boolean;
  updated_at: string;
}

export async function getSiteBanner(): Promise<SiteBannerSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_banners')
    .select('id, image_path, mobile_image_path, enabled, updated_at')
    .eq('id', 'main')
    .maybeSingle();

  if (error) {
    console.error('Failed to load site banner:', error);
    return null;
  }

  return data;
}
