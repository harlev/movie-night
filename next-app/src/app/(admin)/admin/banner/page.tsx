import type { Metadata } from 'next';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import { buildSiteBannerPublicUrl } from '@/lib/utils/siteBanner';
import BannerSettingsClient from './BannerSettingsClient';

export const metadata: Metadata = {
  title: 'Banner Settings - Admin',
};

export default async function AdminBannerPage() {
  const banner = await getSiteBanner();
  const desktopBannerUrl = buildSiteBannerPublicUrl({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    objectPath: banner?.image_path,
    updatedAt: banner?.updated_at,
  });
  const mobileBannerUrl = buildSiteBannerPublicUrl({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    objectPath: banner?.mobile_image_path,
    updatedAt: banner?.updated_at,
  });

  return (
    <BannerSettingsClient
      banner={banner}
      desktopBannerUrl={desktopBannerUrl}
      mobileBannerUrl={mobileBannerUrl}
    />
  );
}
