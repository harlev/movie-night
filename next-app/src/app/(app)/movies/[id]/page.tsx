import { notFound } from 'next/navigation';
import { getMovieById, getMovieComments } from '@/lib/queries/movies';
import { getSuggestedMovies } from '@/lib/queries/suggestions';
import { getUserById } from '@/lib/queries/profiles';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import MovieCommentSection from './MovieCommentSection';
import ArchiveMovieButton from './ArchiveMovieButton';
import MovieDetailsCard from '@/components/movies/MovieDetailsCard';
import NominateMovieButton from '@/components/movies/NominateMovieButton';
import SuggestionAcceptedToast from './SuggestionAcceptedToast';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ suggested?: string }>;
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>): Promise<Metadata> {
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

export default async function MovieDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const showSuggestionToast = query.suggested === '1';
  const movie = await getMovieById(id);

  if (!movie || movie.hidden) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [suggester, comments, currentProfile, suggestions] = await Promise.all([
    getUserById(movie.suggested_by),
    getMovieComments(movie.id),
    user ? getUserById(user.id) : null,
    user ? getSuggestedMovies(user.id) : [],
  ]);

  const movieSuggestion = suggestions.find((s) => s.movie_id === movie.id);
  const isNominated = movieSuggestion?.current_user_suggested ?? false;
  const nominationCount = movieSuggestion?.suggestion_count ?? 0;

  const suggestedByName = suggester?.display_name || 'Unknown';
  const meta = movie.metadata_snapshot;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <SuggestionAcceptedToast show={showSuggestionToast} />

      <Link
        href="/movies"
        className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Movies
      </Link>

      <MovieDetailsCard
        title={movie.title}
        metadata={meta}
        primaryAction={
          currentProfile && currentProfile.role !== 'viewer' ? (
            <NominateMovieButton
              movieId={movie.id}
              nominated={isNominated}
              nominationCount={nominationCount}
            />
          ) : null
        }
        footer={
          <>
            <p className="text-sm text-[var(--color-text-muted)]">
              Suggested by{' '}
              <span className="text-[var(--color-text)]">{suggestedByName}</span> on{' '}
              {formatDate(movie.created_at)}
            </p>
            {currentProfile?.role === 'admin' && (
              <ArchiveMovieButton movieId={movie.id} />
            )}
          </>
        }
      />

      {/* Comments Section */}
      <MovieCommentSection movieId={movie.id} comments={comments} userRole={currentProfile?.role} />

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
