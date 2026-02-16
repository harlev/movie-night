import { createClient } from '@/lib/supabase/server';
import { getLiveSurvey, getSurveyEntries } from '@/lib/queries/surveys';
import { getLivePolls } from '@/lib/queries/polls';
import { getAllMovies } from '@/lib/queries/movies';
import { getAllUsers } from '@/lib/queries/profiles';
import { getBallot, getAllBallots } from '@/lib/queries/ballots';
import { calculateStandings, type Standing } from '@/lib/services/scoring';
import Link from 'next/link';
import type { Metadata } from 'next';
import EmptyState from '@/components/ui/EmptyState';
import CountdownTimer from '@/components/CountdownTimer';

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
  const [liveSurvey, livePolls, allMovies, allUsers, frozenSurveysRes] = await Promise.all([
    getLiveSurvey().catch(() => null),
    getLivePolls().catch(() => []),
    getAllMovies(),
    getAllUsers(),
    (async () => {
      const s = await createClient();
      const { count } = await s
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'frozen')
        .eq('archived', false);
      return count || 0;
    })(),
  ]);

  const currentUser = user ? allUsers.find((u) => u.id === user.id) : null;
  const isViewer = currentUser?.role === 'viewer';

  // Get live survey extra data
  let surveyData: {
    id: string;
    title: string;
    description: string | null;
    maxRankN: number;
    movieCount: number;
    hasVoted: boolean;
    topStandings: Standing[];
    ballotCount: number;
    closesAt: string | null;
  } | null = null;

  if (liveSurvey && user) {
    const [entries, userBallot, allBallotData] = await Promise.all([
      getSurveyEntries(liveSurvey.id),
      getBallot(liveSurvey.id, user.id),
      getAllBallots(liveSurvey.id),
    ]);

    const movies = entries.map((e) => ({
      id: e.movie.id,
      title: e.movie.title,
      tmdbId: e.movie.tmdb_id,
      metadataSnapshot: e.movie.metadata_snapshot
        ? { posterPath: e.movie.metadata_snapshot.posterPath }
        : null,
    }));

    const standings = calculateStandings(
      allBallotData.map((b) => ({ ranks: b.ranks.map((r) => ({ rank: r.rank, movieId: r.movieId })) })),
      movies,
      liveSurvey.max_rank_n
    );

    surveyData = {
      id: liveSurvey.id,
      title: liveSurvey.title,
      description: liveSurvey.description,
      maxRankN: liveSurvey.max_rank_n,
      movieCount: entries.length,
      hasVoted: !!userBallot,
      topStandings: standings.filter((s) => s.totalPoints > 0).slice(0, 3),
      ballotCount: allBallotData.length,
      closesAt: liveSurvey.closes_at,
    };
  }

  const recentMovies = allMovies.slice(0, 5);
  const stats = {
    totalMovies: allMovies.length,
    totalUsers: allUsers.filter((u) => u.status === 'active').length,
    surveysCompleted: frozenSurveysRes,
  };

  return (
    <div className="space-y-8 stagger-children">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-medium mb-1">Now Showing</p>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">
          Welcome back to Movie Night
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 8h20M2 16h20" />
                <path d="M6 4v4M6 16v4M18 4v4M18 16v4" />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">Total Movies</p>
          </div>
          <p className="text-3xl font-display font-bold text-[var(--color-text)]">{stats.totalMovies}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">Community Members</p>
          </div>
          <p className="text-3xl font-display font-bold text-[var(--color-text)]">{stats.totalUsers}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 16h6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">Surveys Completed</p>
          </div>
          <p className="text-3xl font-display font-bold text-[var(--color-text)]">{stats.surveysCompleted}</p>
        </div>
      </div>

      {/* Live Survey */}
      {surveyData ? (
        <div className="relative rounded-xl p-6 border border-[var(--color-primary)]/40 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent shadow-lg shadow-[var(--color-primary)]/5 animate-pulse-glow overflow-hidden">
          {/* Spotlight glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5 animate-pulse" />
                  Live
                </span>
                <h2 className="text-xl font-display font-semibold text-[var(--color-text)]">
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
              {surveyData.closesAt && (
                <div className="mt-1.5">
                  <CountdownTimer closesAt={surveyData.closesAt} variant="compact" refreshOnExpired />
                </div>
              )}
            </div>
          </div>

          {/* Top Standings */}
          {surveyData.topStandings.length > 0 && (
            <div className="relative mb-4">
              <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                Current Standings
                <span className="ml-2 normal-case tracking-normal text-[var(--color-text-muted)]/60">
                  ({surveyData.ballotCount} {surveyData.ballotCount === 1 ? 'vote' : 'votes'})
                </span>
              </p>
              <div className="flex gap-3">
                {surveyData.topStandings.map((standing) => {
                  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
                  const medalColor = medalColors[standing.position - 1] || 'text-[var(--color-text-muted)]';
                  return (
                    <div key={standing.movieId} className="flex items-center gap-2.5 bg-[var(--color-surface)]/60 rounded-lg px-3 py-2 border border-[var(--color-border)]/30 min-w-0 flex-1">
                      <span className={`text-sm font-bold ${medalColor} shrink-0`}>#{standing.position}</span>
                      {standing.posterPath ? (
                        <img
                          src={`${TMDB_IMAGE_BASE}${standing.posterPath}`}
                          alt={standing.title}
                          className="w-8 h-12 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-12 rounded bg-[var(--color-surface-elevated)] shrink-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">{standing.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{standing.totalPoints} pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-between">
            {isViewer ? (
              <span className="text-[var(--color-secondary)] text-sm">
                Viewing as read-only
              </span>
            ) : surveyData.hasVoted ? (
              <span className="text-[var(--color-success)] text-sm inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                You&apos;ve submitted your ballot
              </span>
            ) : (
              <span className="text-[var(--color-warning)] text-sm">
                You haven&apos;t voted yet
              </span>
            )}
            <Link
              href={`/survey/${surveyData.id}`}
              className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] shadow-md shadow-[var(--color-primary)]/20"
            >
              {isViewer ? 'View Survey' : surveyData.hasVoted ? 'Update Vote' : 'Vote Now'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <EmptyState
            icon="surveys"
            title="No active survey"
            description="Check back later for the next voting round!"
          />
        </div>
      )}

      {/* Active Polls (hidden for viewers) */}
      {!isViewer && livePolls.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-accent)] font-medium mb-3">Active Polls</p>
          <div className="space-y-4">
            {livePolls.map((poll) => (
              <div
                key={poll.id}
                className="relative rounded-xl p-5 border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent shadow-lg shadow-[var(--color-accent)]/5 overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--color-accent)]/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1 animate-pulse" />
                        Live
                      </span>
                      <h3 className="text-lg font-display font-semibold text-[var(--color-text)] truncate">
                        {poll.title}
                      </h3>
                    </div>
                    {poll.closes_at && (
                      <CountdownTimer closesAt={poll.closes_at} variant="compact" refreshOnExpired />
                    )}
                  </div>
                  {poll.description && (
                    <p className="text-sm text-[var(--color-text-muted)] mb-3">{poll.description}</p>
                  )}
                  <div className="flex justify-end">
                    <Link
                      href={`/poll/${poll.id}`}
                      className="px-5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80 text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] shadow-md shadow-[var(--color-accent)]/20 inline-flex items-center gap-1.5 text-sm"
                    >
                      Vote
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Movies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-[var(--color-text)]">Recent Suggestions</h2>
          <Link href="/movies" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm transition-colors">
            View all movies
          </Link>
        </div>

        {recentMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recentMovies.map((movie) => (
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
                </div>
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
    </div>
  );
}
