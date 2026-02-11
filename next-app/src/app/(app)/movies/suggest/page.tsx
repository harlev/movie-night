'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { searchMoviesAction, suggestMovieAction } from '@/lib/actions/movies';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
}

export default function SuggestMoviePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);

  const [searchState, searchAction, isSearching] = useActionState(
    async (prevState: any, formData: FormData) => {
      setSelectedMovie(null);
      const result = await searchMoviesAction(prevState, formData);
      return result;
    },
    null
  );

  const [suggestState, suggestAction, isSuggesting] = useActionState(suggestMovieAction, null);

  // Combine errors from both actions
  const error = suggestState?.error || searchState?.error;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/movies"
          className="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Movies
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">Suggest a Movie</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Search for a movie to add to the collection
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Search Form */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <form action={searchAction}>
          <div className="flex gap-3">
            <input
              type="text"
              name="query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies on TMDb..."
              className="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              required
              minLength={2}
            />
            <button
              type="submit"
              disabled={isSearching || searchQuery.length < 2}
              className="px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchState?.searchResults && searchState.searchResults.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Search Results</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchState.searchResults.map((movie: SearchResult) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => setSelectedMovie(movie)}
                className={`w-full flex items-start gap-4 p-3 rounded-lg transition-colors text-left ${
                  selectedMovie?.id === movie.id
                    ? 'bg-[var(--color-primary)]/20 ring-2 ring-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-elevated)]/80'
                }`}
              >
                {movie.poster_path ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-[var(--color-border)] rounded flex items-center justify-center">
                    <span className="text-[var(--color-text-muted)]">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text)]">{movie.title}</p>
                  {movie.release_date && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {movie.release_date.slice(0, 4)}
                    </p>
                  )}
                  {movie.overview && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                      {movie.overview}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {searchState?.searchResults && searchState.searchResults.length === 0 && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6 text-center">
          <p className="text-[var(--color-text-muted)]">
            No movies found for &quot;{searchState.query}&quot;
          </p>
        </div>
      )}

      {/* Selected Movie Confirmation */}
      {selectedMovie && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Confirm Selection
          </h2>
          <div className="flex gap-6">
            {selectedMovie.poster_path ? (
              <img
                src={`${TMDB_IMAGE_BASE}${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="w-32 h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-32 h-48 bg-[var(--color-surface-elevated)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--color-text-muted)] text-4xl">?</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[var(--color-text)]">
                {selectedMovie.title}
              </h3>
              {selectedMovie.release_date && (
                <p className="text-[var(--color-text-muted)]">
                  {selectedMovie.release_date.slice(0, 4)}
                </p>
              )}
              {selectedMovie.overview && (
                <p className="text-[var(--color-text-muted)] mt-2 text-sm">
                  {selectedMovie.overview}
                </p>
              )}
              <form action={suggestAction} className="mt-4">
                <input type="hidden" name="tmdbId" value={selectedMovie.id} />
                <button
                  type="submit"
                  disabled={isSuggesting}
                  className="px-6 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSuggesting ? 'Adding...' : 'Add This Movie'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TMDb Attribution */}
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Movie data provided by{' '}
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-primary)] hover:underline"
        >
          TMDb
        </a>
      </p>
    </div>
  );
}
