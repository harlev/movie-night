'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Movie } from '@/lib/types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

type SortOption = 'newest' | 'title' | 'rating';

interface MoviesGridProps {
  movies: (Movie & { suggestedByName: string })[];
}

export default function MoviesGrid({ movies }: MoviesGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Movies</h1>
          <p className="text-[var(--color-text-muted)] mt-1">{movies.length} movies suggested</p>
        </div>
        <Link
          href="/movies/suggest"
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors"
        >
          Suggest Movie
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="newest">Newest First</option>
          <option value="title">Alphabetical</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Movie Grid */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMovies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="bg-[var(--color-surface)] rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--color-primary)] transition-all group"
            >
              {movie.metadata_snapshot?.posterPath ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center">
                  <span className="text-[var(--color-text-muted)] text-4xl">?</span>
                </div>
              )}
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
                  {movie.metadata_snapshot?.voteAverage ? (
                    <p className="text-xs text-[var(--color-warning)]">
                      {movie.metadata_snapshot.voteAverage.toFixed(1)}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                  by {movie.suggestedByName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No movies match your search.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No movies suggested yet.</p>
          <Link href="/movies/suggest" className="text-[var(--color-primary)] hover:underline">
            Be the first to suggest a movie!
          </Link>
        </div>
      )}
    </div>
  );
}
