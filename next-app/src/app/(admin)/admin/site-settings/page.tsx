import type { Metadata } from 'next';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import { getSiteSettings } from '@/lib/queries/siteSettings';
import { getAllMovies } from '@/lib/queries/movies';
import SiteSettingsClient from './SiteSettingsClient';

export const metadata: Metadata = {
  title: 'Site Settings - Admin',
};

export default async function AdminSiteSettingsPage() {
  const [banner, siteSettings, movies] = await Promise.all([
    getSiteBanner(),
    getSiteSettings(),
    getAllMovies(),
  ]);

  return (
    <SiteSettingsClient
      banner={banner}
      siteSettings={siteSettings}
      movieOptions={movies.map((movie) => ({ id: movie.id, title: movie.title }))}
    />
  );
}
