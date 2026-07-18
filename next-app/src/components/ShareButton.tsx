'use client';

import { useState } from 'react';

interface ShareNavigator {
  share?: (data: { title: string; url: string }) => Promise<void>;
  clipboard?: { writeText: (value: string) => Promise<void> };
}

export function getSurveyShareUrl(surveyId: string, currentUrl: string): string {
  const url = new URL(currentUrl);
  return `${url.origin}/survey/${encodeURIComponent(surveyId)}`;
}

export async function shareSurvey({
  title,
  url,
  navigatorLike,
}: {
  title: string;
  url: string;
  navigatorLike: ShareNavigator;
}): Promise<'shared' | 'copied'> {
  if (navigatorLike.share) {
    try {
      await navigatorLike.share({ title, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
    }
  }
  if (!navigatorLike.clipboard) throw new Error('Sharing is not supported by this browser');
  await navigatorLike.clipboard.writeText(url);
  return 'copied';
}

export default function ShareButton({ surveyId, title }: { surveyId: string; title: string }) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');

  async function handleShare() {
    try {
      const result = await shareSurvey({
        title,
        url: getSurveyShareUrl(surveyId, window.location.href),
        navigatorLike: navigator,
      });
      setStatus(result);
    } catch {
      setStatus('error');
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)]"
      aria-label={`Share ${title}`}
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.7 11.3 15.3 7.7M8.7 12.7l6.6 3.6M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </svg>
      {status === 'shared' ? 'Shared' : status === 'copied' ? 'Link copied' : status === 'error' ? 'Copy failed' : 'Share'}
    </button>
  );
}
