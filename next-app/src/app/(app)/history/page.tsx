import { createClient } from '@/lib/supabase/server';
import { getLiveSurvey } from '@/lib/queries/surveys';
import { getBallot } from '@/lib/queries/ballots';
import { getClosedPolls, getPollMovies, getPollVotes } from '@/lib/queries/polls';
import { calculateStandings } from '@/lib/services/scoring';
import Link from 'next/link';
import type { Metadata } from 'next';
import EmptyState from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'History - Movie Night',
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w154';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all frozen, non-archived surveys
  const { data: frozenSurveys } = await supabase
    .from('surveys')
    .select('*')
    .eq('state', 'frozen')
    .eq('archived', false)
    .order('frozen_at', { ascending: false });

  // Get live survey
  const liveSurvey = await getLiveSurvey().catch(() => null);

  // Get closed polls
  const closedPolls = await getClosedPolls();

  // Get stats for each frozen survey
  const surveysWithStats = await Promise.all(
    (frozenSurveys || []).map(async (survey) => {
      const { count: entryCount } = await supabase
        .from('survey_entries')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', survey.id)
        .is('removed_at', null);

      const { count: ballotCount } = await supabase
        .from('ballots')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', survey.id);

      let userParticipated = false;
      if (user) {
        const userBallot = await getBallot(survey.id, user.id);
        userParticipated = !!userBallot;
      }

      return {
        ...survey,
        movieCount: entryCount || 0,
        ballotCount: ballotCount || 0,
        userParticipated,
      };
    })
  );

  // Get stats for each closed poll (winner movie + vote count)
  const pollsWithStats = await Promise.all(
    closedPolls.map(async (poll) => {
      const [movies, votes] = await Promise.all([
        getPollMovies(poll.id),
        getPollVotes(poll.id),
      ]);

      let winnerTitle: string | null = null;
      let winnerPoster: string | null = null;

      if (movies.length > 0 && votes.length > 0) {
        const standings = calculateStandings(
          votes.map((v) => ({
            ranks: v.ranks as Array<{ rank: number; movieId: string }>,
          })),
          movies.map((m) => ({
            id: m.id,
            title: m.title,
            tmdbId: m.tmdb_id,
            metadataSnapshot: m.metadata_snapshot,
          })),
          poll.max_rank_n
        );
        if (standings.length > 0) {
          winnerTitle = standings[0].title;
          winnerPoster = standings[0].posterPath;
        }
      }

      return {
        ...poll,
        voteCount: votes.length,
        winnerTitle,
        winnerPoster,
      };
    })
  );

  const hasAnything = surveysWithStats.length > 0 || pollsWithStats.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">History</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Browse past surveys and polls
        </p>
      </div>

      {liveSurvey && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-success)]/40 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-full border border-[var(--color-success)]/20">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5 animate-pulse" />
                  Live
                </span>
                <span className="font-medium text-[var(--color-text)]">{liveSurvey.title}</span>
              </div>
            </div>
            <Link
              href={`/survey/${liveSurvey.id}`}
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm transition-colors"
            >
              Vote Now
            </Link>
          </div>
        </div>
      )}

      {hasAnything ? (
        <div className="space-y-8">
          {/* Surveys Section */}
          {surveysWithStats.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">Surveys</h2>
              {surveysWithStats.map((survey) => (
                <Link
                  key={survey.id}
                  href={`/history/${survey.id}`}
                  className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl hover:border-[var(--color-primary)]/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)]">{survey.title}</h3>
                      {survey.description && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {survey.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                        <span>{survey.movieCount} movies</span>
                        <span>{survey.ballotCount} votes</span>
                        <span>Closed {formatDate(survey.frozen_at)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {survey.userParticipated ? (
                        <span className="px-2.5 py-1 text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-full border border-[var(--color-success)]/20">
                          Voted
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] rounded-full">
                          Did not vote
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Polls Section */}
          {pollsWithStats.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">Quick Polls</h2>
              {pollsWithStats.map((poll) => (
                <Link
                  key={poll.id}
                  href={`/poll/${poll.id}`}
                  className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl hover:border-[var(--color-primary)]/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {poll.winnerPoster ? (
                      <img
                        src={`${TMDB_IMAGE_BASE}${poll.winnerPoster}`}
                        alt={poll.winnerTitle || ''}
                        className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-[var(--color-surface-elevated)] rounded-lg flex-shrink-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[var(--color-text-muted)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m1.5 3.75c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-text)]">{poll.title}</h3>
                      {poll.winnerTitle && (
                        <p className="text-sm text-[var(--color-primary)] mt-0.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 1l2.39 6.47H19l-5.3 3.85 2.02 6.21L10 13.68l-5.72 3.85 2.02-6.21L1 7.47h6.61z" />
                          </svg>
                          <span className="truncate">{poll.winnerTitle}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                        <span>{poll.voteCount} {poll.voteCount === 1 ? 'vote' : 'votes'}</span>
                        <span>Closed {formatDate(poll.closed_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <EmptyState
            icon="surveys"
            title="No completed surveys or polls"
            description="Completed surveys and polls will appear here."
          />
        </div>
      )}
    </div>
  );
}
