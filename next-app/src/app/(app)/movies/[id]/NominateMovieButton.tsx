'use client';

import { useTransition } from 'react';
import { toggleSuggestionAction } from '@/lib/actions/suggestions';

interface NominateMovieButtonProps {
  movieId: string;
  nominated: boolean;
  nominationCount: number;
}

export default function NominateMovieButton({ movieId, nominated, nominationCount }: NominateMovieButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const formData = new FormData();
    formData.set('movieId', movieId);
    formData.set('action', nominated ? 'remove' : 'add');

    startTransition(() => {
      toggleSuggestionAction(null, formData);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.97] ${
        nominated
          ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
          : 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
      } disabled:opacity-50`}
    >
      {pending ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5"
          fill={nominated ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      )}
      {nominated ? 'Nominated' : 'Nominate'}
      {nominationCount > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          nominated
            ? 'bg-white/20'
            : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        }`}>
          {nominationCount}
        </span>
      )}
    </button>
  );
}
