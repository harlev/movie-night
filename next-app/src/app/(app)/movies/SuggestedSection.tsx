'use client';

import { useActionState, useTransition, useState } from 'react';
import Link from 'next/link';
import type { Movie } from '@/lib/types';
import type { SuggestionData } from '@/lib/queries/suggestions';
import {
  toggleSuggestionAction,
  adminRemoveMovieSuggestionAction,
  adminClearAllSuggestionsAction,
} from '@/lib/actions/suggestions';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

interface SuggestedSectionProps {
  suggestions: SuggestionData[];
  movies: (Movie & { suggestedByName: string })[];
  isAdmin: boolean;
  currentUserId?: string;
}

function AdminRemoveButton({ movieId, movieTitle }: { movieId: string; movieTitle: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const formData = new FormData();
    formData.set('movieId', movieId);
    formData.set('movieTitle', movieTitle);

    startTransition(() => {
      adminRemoveMovieSuggestionAction(null, formData);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="absolute top-1 right-1 p-1 bg-black/70 backdrop-blur-sm text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white rounded-full transition-all opacity-0 group-hover/card:opacity-100 z-10"
      title="Remove all nominations for this movie"
    >
      {pending ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}

function UnnominateButton({ movieId }: { movieId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const formData = new FormData();
    formData.set('movieId', movieId);
    formData.set('action', 'remove');

    startTransition(() => {
      toggleSuggestionAction(null, formData);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="absolute top-1 left-1 p-1 bg-black/70 backdrop-blur-sm text-white/70 hover:text-white rounded-full transition-all opacity-0 group-hover/card:opacity-100 z-10"
      title="Remove your nomination"
    >
      {pending ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}

export default function SuggestedSection({ suggestions, movies, isAdmin, currentUserId }: SuggestedSectionProps) {
  const [clearState, clearAction, clearPending] = useActionState(adminClearAllSuggestionsAction, null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (suggestions.length === 0) return null;

  // Build a map of movie_id -> movie for quick lookup
  const movieMap = new Map(movies.map((m) => [m.id, m]));

  // Sort by suggestion count descending
  const sorted = [...suggestions].sort((a, b) => b.suggestion_count - a.suggestion_count);

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Nominated for Next Week
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            ({suggestions.length} movie{suggestions.length !== 1 ? 's' : ''})
          </span>
        </div>
        {isAdmin && (
          <div>
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Clear all?</span>
                <form action={clearAction}>
                  <button
                    type="submit"
                    disabled={clearPending}
                    className="px-2 py-1 text-xs bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {clearPending ? 'Clearing...' : 'Confirm'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {clearState?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-2 mb-3 text-xs">
          {clearState.error}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {sorted.map((suggestion) => {
          const movie = movieMap.get(suggestion.movie_id);
          if (!movie) return null;

          const currentUserNominated = suggestion.current_user_suggested;

          return (
            <Link
              key={suggestion.movie_id}
              href={`/movies/${movie.id}`}
              className="group/card flex-shrink-0 w-28 relative"
            >
              {isAdmin && (
                <AdminRemoveButton movieId={movie.id} movieTitle={movie.title} />
              )}
              {!isAdmin && currentUserNominated && (
                <UnnominateButton movieId={movie.id} />
              )}
              <div className="relative rounded-lg overflow-hidden border border-[var(--color-border)]/30 bg-[var(--color-surface-elevated)]">
                {movie.metadata_snapshot?.posterPath ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 8h20M2 16h20" />
                    </svg>
                  </div>
                )}
                {/* Nomination count badge */}
                <div
                  className="absolute bottom-1.5 right-1.5 bg-[var(--color-primary)] text-white rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-md"
                  title={suggestion.suggesters.map((s) => s.display_name).join(', ')}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span className="text-[10px] font-bold">{suggestion.suggestion_count}</span>
                </div>
              </div>
              <p className="text-xs font-medium text-[var(--color-text)] truncate mt-1.5 group-hover/card:text-[var(--color-primary)] transition-colors">
                {movie.title}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                {suggestion.suggesters.map((s) => s.display_name).join(', ')}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
