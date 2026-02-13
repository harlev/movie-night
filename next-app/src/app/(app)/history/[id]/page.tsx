import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getBallot, getAllBallots } from '@/lib/queries/ballots';
import { calculateStandings, getPointsBreakdown } from '@/lib/services/scoring';
import Link from 'next/link';
import type { Metadata } from 'next';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const survey = await getSurveyById(id);
  return {
    title: survey ? `${survey.title} - History - Movie Night` : 'Survey Not Found',
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRankBadgeClasses(position: number): string {
  if (position === 1) return 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30';
  if (position === 2) return 'bg-gray-300/20 text-gray-300 ring-1 ring-gray-300/30';
  if (position === 3) return 'bg-orange-400/20 text-orange-400 ring-1 ring-orange-400/30';
  return 'bg-[var(--color-surface)] text-[var(--color-text-muted)]';
}

function getStandingBorderColor(position: number): string {
  if (position === 1) return 'border-l-yellow-500';
  if (position === 2) return 'border-l-gray-300';
  if (position === 3) return 'border-l-orange-400';
  return 'border-l-transparent';
}

export default async function HistoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const survey = await getSurveyById(id);
  if (!survey || survey.state === 'draft') {
    notFound();
  }

  const [entries, userBallot, allBallots] = await Promise.all([
    getSurveyEntries(survey.id),
    getBallot(survey.id, user.id),
    getAllBallots(survey.id),
  ]);

  // Calculate final standings
  const standings = calculateStandings(
    allBallots.map((b) => ({
      ranks: b.ranks.map((r) => ({ rank: r.rank, movieId: r.movieId })),
    })),
    entries.map((e) => ({
      id: e.movie.id,
      title: e.movie.title,
      tmdbId: e.movie.tmdb_id,
      metadataSnapshot: e.movie.metadata_snapshot,
    })),
    survey.max_rank_n
  );

  const pointsBreakdown = getPointsBreakdown(survey.max_rank_n);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          href="/history"
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
          Back to History
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{survey.title}</h1>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20">
            {survey.state}
          </span>
        </div>
        {survey.description && (
          <p className="text-[var(--color-text-muted)] mt-1">{survey.description}</p>
        )}
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Frozen on {formatDate(survey.frozen_at)} | {allBallots.length} votes cast
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Final Standings */}
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">Final Standings</h2>

          {/* Points breakdown */}
          <div className="mb-4 p-3 bg-[var(--color-surface-elevated)] rounded-xl">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Points per position:</p>
            <div className="flex flex-wrap gap-2">
              {pointsBreakdown.map(({ rank, points }) => (
                <span
                  key={rank}
                  className="text-xs px-2 py-1 bg-[var(--color-surface)] rounded-lg"
                >
                  #{rank} = {points}pts
                </span>
              ))}
            </div>
          </div>

          {standings.length > 0 ? (
            <div className="space-y-2">
              {standings.map((standing, i) => (
                <div
                  key={standing.movieId}
                  className={`flex items-center gap-3 p-3 rounded-xl border-l-4 ${getStandingBorderColor(i + 1)} ${
                    i === 0
                      ? 'bg-yellow-500/5'
                      : i === 1
                        ? 'bg-gray-300/5'
                        : i === 2
                          ? 'bg-orange-400/5'
                          : 'bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${getRankBadgeClasses(i + 1)}`}
                  >
                    {standing.position}
                  </span>
                  {standing.posterPath && (
                    <img
                      src={`${TMDB_IMAGE_BASE}${standing.posterPath}`}
                      alt={standing.title}
                      className="w-12 h-18 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {standing.title}
                      {standing.tied && (
                        <span className="text-xs text-[var(--color-text-muted)]"> (tied)</span>
                      )}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {standing.rankCounts.map((count, idx) =>
                        count > 0 ? (
                          <span
                            key={idx}
                            className="text-xs text-[var(--color-text-muted)]"
                          >
                            #{idx + 1}: {count}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xl font-display font-bold ${
                      i === 0 ? 'text-yellow-500' : 'text-[var(--color-primary)]'
                    }`}
                  >
                    {standing.totalPoints}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-center py-4">
              No standings available.
            </p>
          )}
        </div>

        {/* Your Ballot & All Ballots */}
        <div className="space-y-6">
          {/* Your Ballot */}
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
            <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">Your Ballot</h2>
            {userBallot && userBallot.ranks.length > 0 ? (
              <div className="space-y-2">
                {[...userBallot.ranks]
                  .sort((a, b) => a.rank - b.rank)
                  .map(({ rank, movie }) => (
                    <div
                      key={rank}
                      className="flex items-center gap-3 p-2.5 bg-[var(--color-surface-elevated)] rounded-xl"
                    >
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${getRankBadgeClasses(rank)}`}>
                        {rank}
                      </span>
                      <span className="text-[var(--color-text)]">{movie.title}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-muted)] text-center py-4">
                You did not vote in this survey.
              </p>
            )}
          </div>

          {/* All Ballots */}
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
            <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">
              All Ballots ({allBallots.length})
            </h2>
            {allBallots.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allBallots.map((b) => (
                  <div
                    key={b.user.id}
                    className="p-3 bg-[var(--color-surface-elevated)] rounded-xl"
                  >
                    <p className="font-medium text-[var(--color-text)] mb-2">
                      {b.user.displayName}
                    </p>
                    {b.ranks.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {[...b.ranks]
                          .sort((a, b) => a.rank - b.rank)
                          .map(({ rank, movieTitle }) => (
                            <span
                              key={rank}
                              className="text-xs px-2 py-1 bg-[var(--color-surface)] rounded-lg"
                            >
                              #{rank}: {movieTitle}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-text-muted)] italic">Empty ballot</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-muted)] text-center py-4">
                No ballots submitted.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
