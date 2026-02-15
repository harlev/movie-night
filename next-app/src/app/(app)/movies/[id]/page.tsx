import { notFound } from 'next/navigation';
import { getMovieById, getMovieComments } from '@/lib/queries/movies';
import { getUserById } from '@/lib/queries/profiles';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import MovieDetailClient from './MovieDetailClient';
import MovieCommentSection from './MovieCommentSection';
import ArchiveMovieButton from './ArchiveMovieButton';

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [suggester, comments, currentProfile] = await Promise.all([
    getUserById(movie.suggested_by),
    getMovieComments(movie.id),
    user ? getUserById(user.id) : null,
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
              {meta?.runtime ? (
                <span className="text-[var(--color-text-muted)]">
                  {Math.floor(meta.runtime / 60)}h {meta.runtime % 60}m
                </span>
              ) : null}
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <MovieDetailClient
                trailerKey={meta?.trailerKey || null}
                movieTitle={movie.title}
              />
              {meta?.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${meta.imdbId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C518] hover:bg-[#E0B000] text-black text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.97]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.31 9.588v.005c-.077-.048-.227-.07-.42-.07v4.815c.27 0 .44-.06.5-.165.062-.105.093-.39.093-.855v-2.98c0-.345-.013-.575-.04-.69a.534.534 0 0 0-.133-.26zM22.416 0H1.584C.708 0 0 .708 0 1.584v20.832C0 23.292.708 24 1.584 24h20.832c.876 0 1.584-.708 1.584-1.584V1.584C24 .708 23.292 0 22.416 0zM4.8 18.372H2.4V5.676h2.4v12.696zm6.6 0H9.6l-.024-7.164-.936 7.164H7.32l-.984-6.984-.024 6.984H4.92V5.676h2.52c.104.56.204 1.164.312 1.824l.348 2.016.6-3.84h2.7v12.696zm5.52-3.96c0 .636-.024 1.104-.06 1.404-.04.296-.144.564-.312.804a1.63 1.63 0 0 1-.744.588c-.312.12-.744.18-1.308.18H12.6V5.676h2.04c.496 0 .876.036 1.14.12.264.08.48.216.648.408.168.188.28.396.324.624.048.228.072.612.072 1.152v5.028l-.004.004zm4.68.48c0 .636-.06 1.08-.18 1.332a1.601 1.601 0 0 1-.828.756c-.132.06-.42.096-.54.096-.18 0-.36-.036-.54-.108-.18-.076-.312-.18-.396-.312l-.024.348H18V5.676h1.92v4.356c.168-.22.38-.384.636-.492.252-.108.384-.108.636-.108.3 0 .564.06.792.18.228.12.396.288.504.504.108.22.172.44.2.664.024.22.036.564.036 1.032v3.6l-.004.004z" />
                  </svg>
                  IMDb
                </a>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border)]/50 flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                Suggested by{' '}
                <span className="text-[var(--color-text)]">{suggestedByName}</span> on{' '}
                {formatDate(movie.created_at)}
              </p>
              {currentProfile?.role === 'admin' && (
                <ArchiveMovieButton movieId={movie.id} />
              )}
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
