import { notFound } from 'next/navigation';
import { getMovieById, getMovieComments } from '@/lib/queries/movies';
import { getUserById } from '@/lib/queries/profiles';
import Link from 'next/link';
import type { Metadata } from 'next';
import MovieDetailClient from './MovieDetailClient';
import MovieCommentSection from './MovieCommentSection';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieById(id);
  return {
    title: movie ? `${movie.title} - Movie Night` : 'Movie Not Found',
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovieById(id);

  if (!movie || movie.hidden) {
    notFound();
  }

  const [suggester, comments] = await Promise.all([
    getUserById(movie.suggested_by),
    getMovieComments(movie.id),
  ]);

  const suggestedByName = suggester?.display_name || 'Unknown';
  const meta = movie.metadata_snapshot;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link
        href="/movies"
        className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Movies
      </Link>

      {/* Movie Details */}
      <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
        <div className="md:flex">
          {meta?.posterPath && (
            <div className="md:w-1/3">
              <img
                src={`${TMDB_IMAGE_BASE}${meta.posterPath}`}
                alt={movie.title}
                className="w-full"
              />
            </div>
          )}
          <div className="p-6 md:flex-1">
            <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              {meta?.releaseDate && (
                <span className="text-[var(--color-text-muted)]">
                  {meta.releaseDate.slice(0, 4)}
                </span>
              )}
              {meta?.voteAverage ? (
                <span className="inline-flex items-center gap-1 text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2.5 py-0.5 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {meta.voteAverage.toFixed(1)}
                </span>
              ) : null}
            </div>

            {meta?.genres && meta.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {meta.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {meta?.overview && (
              <p className="text-[var(--color-text-muted)] mt-4 leading-relaxed">{meta.overview}</p>
            )}

            <MovieDetailClient
              trailerKey={meta?.trailerKey || null}
              movieTitle={movie.title}
            />

            <div className="mt-6 pt-4 border-t border-[var(--color-border)]/50">
              <p className="text-sm text-[var(--color-text-muted)]">
                Suggested by{' '}
                <span className="text-[var(--color-text)]">{suggestedByName}</span> on{' '}
                {formatDate(movie.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <MovieCommentSection movieId={movie.id} comments={comments} />

      {/* TMDb Attribution */}
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Movie data provided by{' '}
        <a
          href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`}
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
