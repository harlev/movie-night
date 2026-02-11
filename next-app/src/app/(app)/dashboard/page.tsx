import { createClient } from '@/lib/supabase/server';
import { getLiveSurvey, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllMovies } from '@/lib/queries/movies';
import { getAllUsers } from '@/lib/queries/profiles';
import { getBallot } from '@/lib/queries/ballots';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Movie Night',
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch data in parallel
  const [liveSurvey, allMovies, allUsers, frozenSurveysRes] = await Promise.all([
    getLiveSurvey().catch(() => null),
    getAllMovies(),
    getAllUsers(),
    (async () => {
      const s = await createClient();
      const { count } = await s
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'frozen');
      return count || 0;
    })(),
  ]);

  // Get live survey extra data
  let surveyData: {
    id: string;
    title: string;
    description: string | null;
    maxRankN: number;
    movieCount: number;
    hasVoted: boolean;
  } | null = null;

  if (liveSurvey && user) {
    const [entries, userBallot] = await Promise.all([
      getSurveyEntries(liveSurvey.id),
      getBallot(liveSurvey.id, user.id),
    ]);

    surveyData = {
      id: liveSurvey.id,
      title: liveSurvey.title,
      description: liveSurvey.description,
      maxRankN: liveSurvey.max_rank_n,
      movieCount: entries.length,
      hasVoted: !!userBallot,
    };
  }

  const recentMovies = allMovies.slice(0, 5);
  const stats = {
    totalMovies: allMovies.length,
    totalUsers: allUsers.filter((u) => u.status === 'active').length,
    surveysCompleted: frozenSurveysRes,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Welcome back to Movie Night!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <p className="text-[var(--color-text-muted)] text-sm">Total Movies</p>
          <p className="text-3xl font-bold text-[var(--color-text)] mt-1">{stats.totalMovies}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <p className="text-[var(--color-text-muted)] text-sm">Community Members</p>
          <p className="text-3xl font-bold text-[var(--color-text)] mt-1">{stats.totalUsers}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <p className="text-[var(--color-text-muted)] text-sm">Surveys Completed</p>
          <p className="text-3xl font-bold text-[var(--color-text)] mt-1">{stats.surveysCompleted}</p>
        </div>
      </div>

      {/* Live Survey */}
      {surveyData ? (
        <div className="bg-[var(--color-surface)] rounded-lg p-6 border border-[var(--color-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)]">
                  Live
                </span>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                  {surveyData.title}
                </h2>
              </div>
              {surveyData.description && (
                <p className="text-[var(--color-text-muted)] mt-1">{surveyData.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[var(--color-text-muted)] text-sm">
                {surveyData.movieCount} movies
              </p>
              <p className="text-[var(--color-text-muted)] text-sm">
                Rank top {surveyData.maxRankN}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {surveyData.hasVoted ? (
              <span className="text-[var(--color-success)] text-sm">
                You&apos;ve submitted your ballot
              </span>
            ) : (
              <span className="text-[var(--color-warning)] text-sm">
                You haven&apos;t voted yet
              </span>
            )}
            <Link
              href={`/survey/${surveyData.id}`}
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors"
            >
              {surveyData.hasVoted ? 'Update Vote' : 'Vote Now'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-lg p-6 text-center">
          <p className="text-[var(--color-text-muted)]">
            No active survey right now. Check back later!
          </p>
        </div>
      )}

      {/* Recent Movies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Recent Suggestions</h2>
          <Link href="/movies" className="text-[var(--color-primary)] hover:underline text-sm">
            View all movies
          </Link>
        </div>

        {recentMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recentMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="bg-[var(--color-surface)] rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
              >
                {movie.metadata_snapshot?.posterPath ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center">
                    <span className="text-[var(--color-text-muted)] text-4xl">?</span>
                  </div>
                )}
                <div className="p-2">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {movie.title}
                  </p>
                  {movie.metadata_snapshot?.releaseDate && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {movie.metadata_snapshot.releaseDate.slice(0, 4)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-lg p-6 text-center">
            <p className="text-[var(--color-text-muted)]">No movies suggested yet.</p>
            <Link
              href="/movies/suggest"
              className="text-[var(--color-primary)] hover:underline text-sm"
            >
              Be the first to suggest a movie!
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
