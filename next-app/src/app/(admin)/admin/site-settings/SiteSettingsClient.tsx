'use client';

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  toggleSiteBannerAction,
  updateNextMovieNightOverrideAction,
  uploadSiteBannerAction,
} from '@/lib/actions/siteBanner';
import type { SiteBannerSettings } from '@/lib/queries/siteBanner';

interface SiteSettingsClientProps {
  banner: SiteBannerSettings | null;
}

export default function SiteSettingsClient({ banner }: SiteSettingsClientProps) {
  const router = useRouter();
  const [desktopUploadState, desktopUploadAction, desktopUploadPending] = useActionState(
    uploadSiteBannerAction,
    null
  );
  const [mobileUploadState, mobileUploadAction, mobileUploadPending] = useActionState(
    uploadSiteBannerAction,
    null
  );
  const [toggleState, toggleAction, togglePending] = useActionState(toggleSiteBannerAction, null);
  const [overrideState, overrideAction, overridePending] = useActionState(
    updateNextMovieNightOverrideAction,
    null
  );
  const [stagedDesktopBannerUrl, setStagedDesktopBannerUrl] = useState<string | null>(null);
  const [stagedDesktopBannerName, setStagedDesktopBannerName] = useState('');
  const [stagedMobileBannerUrl, setStagedMobileBannerUrl] = useState<string | null>(null);
  const [stagedMobileBannerName, setStagedMobileBannerName] = useState('');
  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const hasHandledDesktopUploadSuccessRef = useRef(false);
  const hasHandledMobileUploadSuccessRef = useRef(false);

  const bannerEnabled = banner?.enabled ?? false;
  const hasDesktopBannerImage = !!banner?.image_path;

  useEffect(() => {
    return () => {
      if (stagedDesktopBannerUrl) URL.revokeObjectURL(stagedDesktopBannerUrl);
      if (stagedMobileBannerUrl) URL.revokeObjectURL(stagedMobileBannerUrl);
    };
  }, [stagedDesktopBannerUrl, stagedMobileBannerUrl]);

  useEffect(() => {
    if (desktopUploadPending) {
      hasHandledDesktopUploadSuccessRef.current = false;
    }
  }, [desktopUploadPending]);

  useEffect(() => {
    if (mobileUploadPending) {
      hasHandledMobileUploadSuccessRef.current = false;
    }
  }, [mobileUploadPending]);

  useEffect(() => {
    if (
      !desktopUploadPending &&
      desktopUploadState?.success &&
      !hasHandledDesktopUploadSuccessRef.current
    ) {
      hasHandledDesktopUploadSuccessRef.current = true;
      setStagedDesktopBannerUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      setStagedDesktopBannerName('');
      if (desktopFileInputRef.current) {
        desktopFileInputRef.current.value = '';
      }
      router.refresh();
    }
  }, [desktopUploadPending, desktopUploadState, router]);

  useEffect(() => {
    if (
      !mobileUploadPending &&
      mobileUploadState?.success &&
      !hasHandledMobileUploadSuccessRef.current
    ) {
      hasHandledMobileUploadSuccessRef.current = true;
      setStagedMobileBannerUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      setStagedMobileBannerName('');
      if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = '';
      }
      router.refresh();
    }
  }, [mobileUploadPending, mobileUploadState, router]);

  function handleDesktopBannerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setStagedDesktopBannerName(file?.name || '');
    hasHandledDesktopUploadSuccessRef.current = false;

    setStagedDesktopBannerUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleMobileBannerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setStagedMobileBannerName(file?.name || '');
    hasHandledMobileUploadSuccessRef.current = false;

    setStagedMobileBannerUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Site Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Manage site-wide branding and scheduling controls.
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-lg p-6 space-y-4 border border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Scheduling</h2>
        <p className="text-sm font-medium text-[var(--color-text)]">Next Movie Night</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Set a manual next movie night date override. Leave it blank to use automatic Wednesday rules.
        </p>

        <form action={overrideAction} className="space-y-3">
          <input type="hidden" name="mode" value="set" />
          <div>
            <label htmlFor="overrideDate" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Override Date
            </label>
            <input
              id="overrideDate"
              type="date"
              name="overrideDate"
              defaultValue={banner?.next_movie_night_override_date || ''}
              className="w-full md:w-auto px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            />
          </div>
          <button
            type="submit"
            disabled={overridePending}
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {overridePending ? 'Saving...' : 'Save Override'}
          </button>
        </form>

        <form action={overrideAction}>
          <input type="hidden" name="mode" value="clear" />
          <button
            type="submit"
            disabled={overridePending || !banner?.next_movie_night_override_date}
            className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Clear Override
          </button>
        </form>

        {overrideState?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 text-sm">
            {overrideState.error}
          </div>
        )}
        {overrideState?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 text-sm">
            {overrideState.message}
          </div>
        )}
      </div>

      <div className="bg-[var(--color-surface)] rounded-lg p-6 space-y-4 border border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Branding</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Upload a wide banner image and toggle it on or off for the dashboard and movies pages.
        </p>

        <p className="text-sm font-medium text-[var(--color-text)]">Banner Visibility</p>

        <form action={toggleAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="enabled" value={bannerEnabled ? 'false' : 'true'} />
          <button
            type="submit"
            disabled={togglePending || (!bannerEnabled && !hasDesktopBannerImage)}
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
        action={desktopUploadAction}
        className="bg-[var(--color-surface)] rounded-lg p-6 space-y-4 border border-[var(--color-border)]"
      >
        <input type="hidden" name="variant" value="desktop" />
        {stagedDesktopBannerUrl && (
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">New Banner Preview</p>
            <div className="relative aspect-[10/1] overflow-hidden rounded-lg border border-[var(--color-primary)]/50">
              <img
                src={stagedDesktopBannerUrl}
                alt="New desktop banner preview"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)] truncate">
              Selected: {stagedDesktopBannerName}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="desktopBanner" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Upload Desktop Banner Image
          </label>
          <input
            ref={desktopFileInputRef}
            id="desktopBanner"
            type="file"
            name="banner"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={handleDesktopBannerFileChange}
            className="block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-dark)]"
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Recommended: wide image ratio (around 10:1). Max size: 4 MB. Allowed types: PNG, JPG, WEBP.
          </p>
        </div>

        <button
          type="submit"
          disabled={desktopUploadPending || !stagedDesktopBannerUrl}
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {desktopUploadPending ? 'Applying...' : 'Apply Desktop Banner'}
        </button>

        {desktopUploadState?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 text-sm">
            {desktopUploadState.error}
          </div>
        )}
        {desktopUploadState?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 text-sm">
            {desktopUploadState.message}
          </div>
        )}
      </form>

      <form
        action={mobileUploadAction}
        className="bg-[var(--color-surface)] rounded-lg p-6 space-y-4 border border-[var(--color-border)]"
      >
        <input type="hidden" name="variant" value="mobile" />
        {stagedMobileBannerUrl && (
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">New Mobile Banner Preview</p>
            <div className="relative aspect-[4/1] overflow-hidden rounded-lg border border-[var(--color-primary)]/50">
              <img
                src={stagedMobileBannerUrl}
                alt="New mobile banner preview"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)] truncate">
              Selected: {stagedMobileBannerName}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="mobileBanner" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Upload Mobile Banner Image
          </label>
          <input
            ref={mobileFileInputRef}
            id="mobileBanner"
            type="file"
            name="banner"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={handleMobileBannerFileChange}
            className="block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-dark)]"
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Recommended: mobile image ratio (around 4:1). Max size: 4 MB. Allowed types: PNG, JPG, WEBP.
          </p>
        </div>

        <button
          type="submit"
          disabled={mobileUploadPending || !stagedMobileBannerUrl}
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {mobileUploadPending ? 'Applying...' : 'Apply Mobile Banner'}
        </button>

        {mobileUploadState?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 text-sm">
            {mobileUploadState.error}
          </div>
        )}
        {mobileUploadState?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 text-sm">
            {mobileUploadState.message}
          </div>
        )}
      </form>
    </div>
  );
}
