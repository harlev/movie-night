'use client';

import { useActionState } from 'react';
import { toggleMovieArchiveAction } from '@/lib/actions/movies';

export default function ArchiveMovieButton({ movieId }: { movieId: string }) {
  const [state, formAction, isPending] = useActionState(toggleMovieArchiveAction, null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('Are you sure you want to archive this movie? It will no longer appear in the movies list.')) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="movieId" value={movieId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]/30 hover:text-[var(--color-error)] hover:border-[var(--color-error)]/30 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        {isPending ? 'Archiving...' : 'Archive'}
      </button>
      {state?.error && (
        <p className="text-[var(--color-error)] text-xs mt-1">{state.error}</p>
      )}
    </form>
  );
}
