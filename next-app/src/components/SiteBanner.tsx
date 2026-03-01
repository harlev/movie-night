import type { SiteBannerSettings } from '@/lib/queries/siteBanner';
import { buildSiteBannerPublicUrl } from '@/lib/utils/siteBanner';

interface SiteBannerProps {
  banner: SiteBannerSettings | null;
}

export default function SiteBanner({ banner }: SiteBannerProps) {
  if (!banner?.enabled || !banner.image_path) return null;

  const desktopBannerUrl = buildSiteBannerPublicUrl({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    objectPath: banner.image_path,
    updatedAt: banner.updated_at,
  });
  if (!desktopBannerUrl) return null;

  const mobileBannerUrl = buildSiteBannerPublicUrl({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    objectPath: banner.mobile_image_path,
    updatedAt: banner.updated_at,
  });

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-lg shadow-black/20">
      <picture className="block">
        {mobileBannerUrl ? <source media="(max-width: 639px)" srcSet={mobileBannerUrl} /> : null}
        <img
          src={desktopBannerUrl}
          alt="Site banner"
          className="aspect-[4/1] w-full object-cover object-center sm:aspect-[10/1]"
        />
      </picture>
    </div>
  );
}
