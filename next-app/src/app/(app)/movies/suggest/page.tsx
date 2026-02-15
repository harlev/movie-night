'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { suggestMovieAction } from '@/lib/actions/movies';

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [suggestState, suggestAction, isSuggesting] = useActionState(suggestMovieAction, null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) {
          setSearchError('Failed to search movies');
          setResults([]);
        } else {
          const data = await res.json();
          setResults(data);
          setSearchError(null);
          setShowDropdown(true);
        }
      } catch {
        setSearchError('Failed to search movies');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(movie: SearchResult) {
    setSelectedMovie(movie);
    setShowDropdown(false);
    setSearchQuery('');
    setResults([]);
  }

  const error = suggestState?.error || searchError;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Link
          href="/movies"
          className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm inline-flex items-center gap-1 transition-colors"
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
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)] mt-2">Suggest a Movie</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Search for a movie to add to the collection
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Search Input with Autocomplete */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
        <div ref={containerRef} className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedMovie(null);
              }}
              onFocus={() => {
                if (results.length > 0) setShowDropdown(true);
              }}
              placeholder="Search movies on TMDb..."
              className="w-full px-4 py-2.5 pr-10 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              autoComplete="off"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-[var(--color-text-muted)] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl shadow-black/30 max-h-80 overflow-y-auto">
              {results.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => handleSelect(movie)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-border)]/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-[var(--color-border)] rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 8h20M2 16h20" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">{movie.title}</p>
                    {movie.release_date && (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {movie.release_date.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showDropdown && searchQuery.length >= 2 && !isSearching && results.length === 0 && !searchError && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl shadow-black/30 px-4 py-6 text-center">
              <p className="text-[var(--color-text-muted)] text-sm">No movies found for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Movie Confirmation */}
      {selectedMovie && (
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 animate-fade-in-up">
          <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">
            Confirm Selection
          </h2>
          <div className="flex gap-6">
            {selectedMovie.poster_path ? (
              <img
                src={`${TMDB_IMAGE_BASE}${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="w-32 h-48 object-cover rounded-xl"
              />
            ) : (
              <div className="w-32 h-48 bg-[var(--color-surface-elevated)] rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 8h20M2 16h20" />
                  <path d="M6 4v4M6 16v4M18 4v4M18 16v4" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-display font-semibold text-[var(--color-text)]">
                {selectedMovie.title}
              </h3>
              {selectedMovie.release_date && (
                <p className="text-[var(--color-text-muted)]">
                  {selectedMovie.release_date.slice(0, 4)}
                </p>
              )}
              {selectedMovie.overview && (
                <p className="text-[var(--color-text-muted)] mt-2 text-sm leading-relaxed">
                  {selectedMovie.overview}
                </p>
              )}
              <form action={suggestAction} className="mt-4">
                <input type="hidden" name="tmdbId" value={selectedMovie.id} />
                <button
                  type="submit"
                  disabled={isSuggesting}
                  className="px-6 py-2.5 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
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
          className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
        >
          TMDb
        </a>
      </p>
    </div>
  );
}
