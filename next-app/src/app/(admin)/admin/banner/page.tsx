import type { Metadata } from 'next';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import BannerSettingsClient from './BannerSettingsClient';

export const metadata: Metadata = {
  title: 'Banner Settings - Admin',
};

export default async function AdminBannerPage() {
  const banner = await getSiteBanner();
  return <BannerSettingsClient banner={banner} />;
}
