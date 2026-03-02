import type { Metadata } from 'next';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import { getSiteSettings } from '@/lib/queries/siteSettings';
import SiteSettingsClient from './SiteSettingsClient';

export const metadata: Metadata = {
  title: 'Site Settings - Admin',
};

export default async function AdminSiteSettingsPage() {
  const [banner, siteSettings] = await Promise.all([getSiteBanner(), getSiteSettings()]);
  return <SiteSettingsClient banner={banner} siteSettings={siteSettings} />;
}
