import type { Metadata } from 'next';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import SiteSettingsClient from './SiteSettingsClient';

export const metadata: Metadata = {
  title: 'Site Settings - Admin',
};

export default async function AdminSiteSettingsPage() {
  const banner = await getSiteBanner();
  return <SiteSettingsClient banner={banner} />;
}
