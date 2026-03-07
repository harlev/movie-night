'use client';

import { useActionState } from 'react';
import { toggleMovieWatchedAction } from '@/lib/actions/movies';

interface WatchedMovieButtonProps {
  movieId: string;
  watched: boolean;
}

export default function WatchedMovieButton({ movieId, watched }: WatchedMovieButtonProps) {
  const [state, formAction, isPending] = useActionState(toggleMovieWatchedAction, null);
  const isWatched = state?.success ? state.watched : watched;
  const label = isWatched ? 'Watched' : 'Mark Watched';

  return (
    <form action={formAction}>
      <input type="hidden" name="movieId" value={movieId} />
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 whitespace-nowrap ${
          isWatched
            ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/35 hover:bg-[var(--color-success)]/20'
            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-border)]/40 hover:border-[var(--color-success)]/40 hover:text-[var(--color-success)]'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {isWatched ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </>
          )}
        </svg>
        {isPending ? 'Saving...' : label}
      </button>
      {state?.error && (
        <p className="text-[var(--color-error)] text-xs mt-1">{state.error}</p>
      )}
    </form>
  );
}
