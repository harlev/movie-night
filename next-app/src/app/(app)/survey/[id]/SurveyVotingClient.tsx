'use client';

import { useState, useEffect, useRef, useActionState, useCallback } from 'react';
import Link from 'next/link';
import { submitBallotAction } from '@/lib/actions/ballots';
import type { Standing } from '@/lib/services/scoring';
import { useBallot } from '@/hooks/useBallot';
import { getRankBadgeClasses, getStandingBorderColor, shuffle } from '@/lib/utils/rankStyles';
import SortableBallotList from '@/components/SortableBallotList';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface SurveyInfo {
  id: string;
  title: string;
  description: string | null;
  state: 'draft' | 'live' | 'frozen';
  maxRankN: number;
}

interface EntryMovie {
  id: string;
  title: string;
  metadata_snapshot: {
    posterPath: string | null;
    releaseDate: string | null;
  } | null;
}

interface ClientEntry {
  movieId: string;
  movie: EntryMovie;
}

interface ClientBallot {
  user: { id: string; displayName: string };
  ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
}

interface SurveyVotingClientProps {
  survey: SurveyInfo;
  entries: ClientEntry[];
  userBallotRanks: Array<{ rank: number; movieId: string }> | null;
  allBallots: ClientBallot[];
  standings: Standing[];
  pointsBreakdown: Array<{ rank: number; points: number; label: string }>;
  hasExistingBallot: boolean;
}

export default function SurveyVotingClient({
  survey,
  entries,
  userBallotRanks,
  allBallots,
  standings,
  pointsBreakdown,
  hasExistingBallot,
}: SurveyVotingClientProps) {
  const isLive = survey.state === 'live';

  const [shuffledEntries, setShuffledEntries] = useState(entries);
  const hasShuffled = useRef(false);
  useEffect(() => {
    if (!hasShuffled.current) {
      hasShuffled.current = true;
      setShuffledEntries(shuffle(entries));
    }
  }, [entries]);
  const [formState, formAction, isSubmitting] = useActionState(submitBallotAction, null);

  const {
    ballot,
    lastChangedRank,
    setRank,
    clearBallot,
    handleMovieClick,
    getBallotAsArray,
    isMovieSelected,
    filledRankItems,
    firstEmptySlot,
    isBallotComplete,
    reorderBallot,
  } = useBallot({
    maxRankN: survey.maxRankN,
    initialRanks: userBallotRanks,
    isLive,
  });

  const getMovieById = useCallback(
    (id: string): EntryMovie | undefined => entries.find((e) => e.movie.id === id)?.movie,
    [entries]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
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
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{survey.title}</h1>
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              isLive
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20'
                : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20'
            }`}
          >
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5 animate-pulse" />}
            {survey.state}
          </span>
        </div>
        {survey.description && (
          <p className="text-[var(--color-text-muted)] mt-1">{survey.description}</p>
        )}
      </div>

      {formState?.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3">
          {formState.error}
        </div>
      )}

      {formState?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/50 text-[var(--color-success)] rounded-xl p-3">
          Your ballot has been submitted!
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ballot Section */}
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">Your Ballot</h2>
              {isLive && ballot.size > 0 && (
                <button
                  type="button"
                  onClick={clearBallot}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

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

            {/* Rank slots with drag-and-drop */}
            <div className="space-y-2">
              <SortableBallotList
                filledRankItems={filledRankItems}
                maxRankN={survey.maxRankN}
                isLive={isLive}
                firstEmptySlot={firstEmptySlot}
                lastChangedRank={lastChangedRank}
                getMovieById={getMovieById}
                onRemove={setRank}
                onReorder={reorderBallot}
              />
            </div>

            {isLive ? (
              <form action={formAction} className="mt-4">
                <input type="hidden" name="surveyId" value={survey.id} />
                <input
                  type="hidden"
                  name="ranks"
                  value={JSON.stringify(getBallotAsArray())}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || ballot.size === 0}
                  className={`w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${
                    isBallotComplete ? 'shadow-lg shadow-[var(--color-primary)]/30' : 'shadow-md shadow-[var(--color-primary)]/20'
                  }`}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : hasExistingBallot
                      ? 'Update Ballot'
                      : 'Submit Ballot'}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
                This survey is closed for voting.
              </p>
            )}
          </div>

          {/* Available Movies */}
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
            <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">
              Movies ({shuffledEntries.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shuffledEntries.map((entry) => {
                const selectedRank = isMovieSelected(entry.movie.id);

                return (
                  <button
                    key={entry.movie.id}
                    type="button"
                    disabled={!isLive}
                    onClick={() => handleMovieClick(entry.movie.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 ${
                      selectedRank !== null
                        ? 'bg-[var(--color-primary)]/10 border-l-4 border-l-[var(--color-primary)]'
                        : 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] border-l-4 border-l-transparent'
                    } ${!isLive ? 'cursor-default' : 'active:scale-[0.98]'}`}
                  >
                    {entry.movie.metadata_snapshot?.posterPath ? (
                      <img
                        src={`${TMDB_IMAGE_BASE}${entry.movie.metadata_snapshot.posterPath}`}
                        alt={entry.movie.title}
                        className="w-12 h-18 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-18 bg-[var(--color-border)] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M2 8h20M2 16h20" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text)] truncate">
                        {entry.movie.title}
                      </p>
                      {entry.movie.metadata_snapshot?.releaseDate && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {entry.movie.metadata_snapshot.releaseDate.slice(0, 4)}
                        </p>
                      )}
                    </div>
                    {selectedRank !== null && (
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${getRankBadgeClasses(selectedRank)}`}>
                        {selectedRank}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Standings & Ballots Section */}
        <div className="space-y-4">
          {/* Current Standings */}
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
            <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">
              Current Standings
            </h2>
            {standings.length > 0 && allBallots.length > 0 ? (
              <div className="space-y-2">
                {standings.map((standing) => (
                  <div
                    key={standing.movieId}
                    className={`flex items-center gap-3 p-3 bg-[var(--color-surface-elevated)] rounded-xl border-l-4 ${getStandingBorderColor(standing.position)}`}
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${getRankBadgeClasses(standing.position)}`}
                    >
                      {standing.position}
                    </span>
                    {standing.posterPath && (
                      <img
                        src={`${TMDB_IMAGE_BASE}${standing.posterPath}`}
                        alt={standing.title}
                        className="w-10 h-15 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text)] truncate">
                        {standing.title}
                        {standing.tied && (
                          <span className="text-xs text-[var(--color-text-muted)]"> (tied)</span>
                        )}
                      </p>
                    </div>
                    <span className={`text-lg font-display font-bold ${
                      standing.position === 1 ? 'text-yellow-500' : 'text-[var(--color-primary)]'
                    }`}>
                      {standing.totalPoints}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-muted)] text-center py-4">No votes yet.</p>
            )}
          </div>

          {/* All Ballots (Transparency) */}
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
                No ballots submitted yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
