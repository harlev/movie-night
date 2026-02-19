'use client';

import { useTransition } from 'react';
import { toggleSuggestionAction } from '@/lib/actions/suggestions';

interface SuggestButtonProps {
  movieId: string;
  nominated: boolean;
}

export default function SuggestButton({ movieId, nominated }: SuggestButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

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
      className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 ${
        nominated
          ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30'
          : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
      } disabled:opacity-50`}
      title={nominated ? 'Remove nomination' : 'Nominate for next week'}
    >
      {pending ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-4 h-4"
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
    </button>
  );
}
