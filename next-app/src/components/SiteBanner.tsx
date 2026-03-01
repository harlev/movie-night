import type { SiteBannerSettings } from '@/lib/queries/siteBanner';
import { buildSiteBannerPublicUrl } from '@/lib/utils/siteBanner';

interface SiteBannerProps {
  banner: SiteBannerSettings | null;
}

export default function SiteBanner({ banner }: SiteBannerProps) {
  if (!banner?.enabled || !banner.image_path) return null;

  const bannerUrl = buildSiteBannerPublicUrl({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    objectPath: banner.image_path,
    updatedAt: banner.updated_at,
  });
  if (!bannerUrl) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-lg shadow-black/20">
      <img
        src={bannerUrl}
        alt="Site banner"
        className="h-24 w-full object-cover object-center sm:h-28 lg:h-32"
      />
    </div>
  );
}
