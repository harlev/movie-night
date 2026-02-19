'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Movie } from '@/lib/types';
import type { SuggestionData } from '@/lib/queries/suggestions';
import EmptyState from '@/components/ui/EmptyState';
import SuggestedSection from './SuggestedSection';
import SuggestButton from './SuggestButton';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

type SortOption = 'newest' | 'title' | 'rating';

interface MoviesGridProps {
  movies: (Movie & { suggestedByName: string })[];
  userRole?: 'admin' | 'member' | 'viewer';
  suggestions: SuggestionData[];
  currentUserId?: string;
}

export default function MoviesGrid({ movies, userRole, suggestions, currentUserId }: MoviesGridProps) {
  const isViewer = userRole === 'viewer';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Build suggestion lookup map
  const suggestionMap = useMemo(() => {
    const map = new Map<string, SuggestionData>();
    for (const s of suggestions) {
      map.set(s.movie_id, s);
    }
    return map;
  }, [suggestions]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(query));
    }

    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        result.sort(
          (a, b) =>
            (b.metadata_snapshot?.voteAverage || 0) - (a.metadata_snapshot?.voteAverage || 0)
        );
        break;
      case 'newest':
      default:
        // Already sorted by newest from server
        break;
    }

    return result;
  }, [movies, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Movies</h1>
          <p className="text-[var(--color-text-muted)] mt-1">{movies.length} movies suggested</p>
        </div>
        {isViewer ? (
          <span
            className="px-4 py-2 bg-[var(--color-primary)]/50 text-white/60 font-medium rounded-xl cursor-not-allowed"
            title="Viewers cannot suggest movies"
          >
            Suggest Movie
          </span>
        ) : (
          <Link
            href="/movies/suggest"
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] shadow-md shadow-[var(--color-primary)]/20"
          >
            Suggest Movie
          </Link>
        )}
      </div>

      {/* Nominated for Next Week */}
      {suggestions.length > 0 && (
        <SuggestedSection
          suggestions={suggestions}
          movies={movies}
          isAdmin={userRole === 'admin'}
          currentUserId={currentUserId}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
        >
          <option value="newest">Newest First</option>
          <option value="title">Alphabetical</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Movie Grid */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMovies.map((movie) => {
            const suggestion = suggestionMap.get(movie.id);
            return (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="group bg-[var(--color-surface)] rounded-xl overflow-hidden border border-[var(--color-border)]/50 shadow-lg shadow-black/20 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 transition-all duration-300"
              >
                <div className="relative overflow-hidden">
                  {movie.metadata_snapshot?.posterPath ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center">
                      <svg className="w-10 h-10 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 8h20M2 16h20" />
                        <path d="M6 4v4M6 16v4M18 4v4M18 16v4" />
                      </svg>
                    </div>
                  )}
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Rating badge */}
                  {movie.metadata_snapshot?.voteAverage ? (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-1.5 py-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3 text-[var(--color-warning)]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-medium text-[var(--color-text)]">
                        {movie.metadata_snapshot.voteAverage.toFixed(1)}
                      </span>
                    </div>
                  ) : null}
                  {/* Nominate button - shown on hover for non-viewers */}
                  {!isViewer && currentUserId && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <SuggestButton
                        movieId={movie.id}
                        nominated={suggestion?.current_user_suggested ?? false}
                      />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {movie.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    {movie.metadata_snapshot?.releaseDate ? (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {movie.metadata_snapshot.releaseDate.slice(0, 4)}
                      </p>
                    ) : (
                      <span />
                    )}
                    {suggestion && suggestion.suggestion_count > 0 && (
                      <div className="flex items-center gap-0.5 text-[var(--color-primary)]" title={`${suggestion.suggestion_count} nomination(s)`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="text-[10px] font-bold">{suggestion.suggestion_count}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                    by {movie.suggestedByName}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : searchQuery ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <EmptyState
            icon="search"
            title="No matches"
            description="No movies match your search. Try a different term."
          />
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <EmptyState
            icon="movies"
            title="No movies yet"
            description={isViewer ? 'No movies have been suggested yet.' : 'Be the first to suggest a movie for the group!'}
            actionLabel={isViewer ? undefined : 'Suggest a Movie'}
            actionHref={isViewer ? undefined : '/movies/suggest'}
          />
        </div>
      )}
    </div>
  );
}
