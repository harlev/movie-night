'use client';

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadSiteBannerAction, toggleSiteBannerAction } from '@/lib/actions/siteBanner';
import type { SiteBannerSettings } from '@/lib/queries/siteBanner';

interface BannerSettingsClientProps {
  banner: SiteBannerSettings | null;
  bannerUrl: string | null;
}

export default function BannerSettingsClient({ banner, bannerUrl }: BannerSettingsClientProps) {
  const router = useRouter();
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadSiteBannerAction, null);
  const [toggleState, toggleAction, togglePending] = useActionState(toggleSiteBannerAction, null);
  const [stagedBannerUrl, setStagedBannerUrl] = useState<string | null>(null);
  const [stagedBannerName, setStagedBannerName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHandledUploadSuccessRef = useRef(false);

  const bannerEnabled = banner?.enabled ?? false;
  const hasBannerImage = !!banner?.image_path;

  useEffect(() => {
    return () => {
      if (stagedBannerUrl) URL.revokeObjectURL(stagedBannerUrl);
    };
  }, [stagedBannerUrl]);

  useEffect(() => {
    if (uploadPending) {
      hasHandledUploadSuccessRef.current = false;
    }
  }, [uploadPending]);

  useEffect(() => {
    if (!uploadPending && uploadState?.success && !hasHandledUploadSuccessRef.current) {
      hasHandledUploadSuccessRef.current = true;
      setStagedBannerUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      setStagedBannerName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      router.refresh();
    }
  }, [uploadPending, uploadState, router]);

  function handleBannerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setStagedBannerName(file?.name || '');
    hasHandledUploadSuccessRef.current = false;

    setStagedBannerUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Site Banner</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Upload a wide banner image and toggle it on or off for the dashboard and movies pages.
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-lg p-6 space-y-4 border border-[var(--color-border)]">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-2">Current Banner Preview</p>
          {bannerUrl ? (
            <div className="overflow-hidden rounded-lg border border-[var(--color-border)]/70">
              <img
                src={bannerUrl}
                alt="Current site banner"
                className="h-24 w-full object-cover object-center sm:h-28 lg:h-32"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
              No banner image uploaded yet.
            </div>
          )}
        </div>

        <form action={toggleAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="enabled" value={bannerEnabled ? 'false' : 'true'} />
          <button
            type="submit"
            disabled={togglePending || (!bannerEnabled && !hasBannerImage)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              bannerEnabled
                ? 'bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-white'
                : 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white'
            }`}
          >
            {togglePending ? 'Saving...' : bannerEnabled ? 'Turn Banner Off' : 'Turn Banner On'}
          </button>
          <span className="text-sm text-[var(--color-text-muted)]">
            Status: {bannerEnabled ? 'Visible' : 'Hidden'}
          </span>
        </form>

        {toggleState?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 text-sm">
            {toggleState.error}
          </div>
        )}
        {toggleState?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 text-sm">
            {toggleState.message}
          </div>
        )}
      </div>

      <form
        action={uploadAction}
        className="bg-[var(--color-surface)] rounded-lg p-6 space-y-4 border border-[var(--color-border)]"
      >
        {stagedBannerUrl && (
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">New Banner Preview</p>
            <div className="overflow-hidden rounded-lg border border-[var(--color-primary)]/50">
              <img
                src={stagedBannerUrl}
                alt="New banner preview"
                className="h-24 w-full object-cover object-center sm:h-28 lg:h-32"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)] truncate">
              Selected: {stagedBannerName}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="banner" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Upload Banner Image
          </label>
          <input
            ref={fileInputRef}
            id="banner"
            type="file"
            name="banner"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={handleBannerFileChange}
            className="block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-dark)]"
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Recommended: wide image ratio (around 8:1). Max size: 4 MB. Allowed types: PNG, JPG, WEBP.
          </p>
        </div>

        <button
          type="submit"
          disabled={uploadPending || !stagedBannerUrl}
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {uploadPending ? 'Applying...' : 'Apply Banner'}
        </button>

        {uploadState?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 text-sm">
            {uploadState.error}
          </div>
        )}
        {uploadState?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 text-sm">
            {uploadState.message}
          </div>
        )}
      </form>
    </div>
  );
}
