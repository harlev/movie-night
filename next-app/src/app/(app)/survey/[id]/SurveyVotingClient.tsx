'use client';

import { useState, useActionState, useCallback } from 'react';
import Link from 'next/link';
import { submitBallotAction } from '@/lib/actions/ballots';
import type { Standing } from '@/lib/services/scoring';

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
  // Initialize ballot from existing ranks
  const initialBallot = new Map<number, string>();
  if (userBallotRanks) {
    for (const { rank, movieId } of userBallotRanks) {
      initialBallot.set(rank, movieId);
    }
  }

  const [ballot, setBallot] = useState<Map<number, string>>(initialBallot);
  const isLive = survey.state === 'live';

  const [formState, formAction, isSubmitting] = useActionState(submitBallotAction, null);

  const setRank = useCallback(
    (rank: number, movieId: string) => {
      setBallot((prev) => {
        const newBallot = new Map(prev);

        // Remove movie from any existing rank
        for (const [r, m] of newBallot) {
          if (m === movieId) {
            newBallot.delete(r);
          }
        }

        // If clicking on already-selected rank, just remove it
        if (prev.get(rank) === movieId) {
          return newBallot;
        }

        // Set new rank
        newBallot.set(rank, movieId);
        return newBallot;
      });
    },
    []
  );

  const clearBallot = useCallback(() => {
    setBallot(new Map());
  }, []);

  const getMovieForRank = (rank: number): string | undefined => {
    return ballot.get(rank);
  };

  const getMovieById = (id: string): EntryMovie | undefined => {
    return entries.find((e) => e.movie.id === id)?.movie;
  };

  const isMovieSelected = (movieId: string): number | null => {
    for (const [rank, mid] of ballot) {
      if (mid === movieId) return rank;
    }
    return null;
  };

  const getBallotAsArray = (): Array<{ rank: number; movieId: string }> => {
    return Array.from(ballot.entries()).map(([rank, movieId]) => ({ rank, movieId }));
  };

  const handleMovieClick = (movieId: string) => {
    if (!isLive) return;
    // Find first empty slot
    for (let r = 1; r <= survey.maxRankN; r++) {
      if (!ballot.has(r)) {
        setRank(r, movieId);
        return;
      }
    }
    // All slots full, replace last
    setRank(survey.maxRankN, movieId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{survey.title}</h1>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              isLive
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'
            }`}
          >
            {survey.state}
          </span>
        </div>
        {survey.description && (
          <p className="text-[var(--color-text-muted)] mt-1">{survey.description}</p>
        )}
      </div>

      {formState?.error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3">
          {formState.error}
        </div>
      )}

      {formState?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3">
          Your ballot has been submitted!
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ballot Section */}
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Your Ballot</h2>
              {isLive && ballot.size > 0 && (
                <button
                  type="button"
                  onClick={clearBallot}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Points breakdown */}
            <div className="mb-4 p-3 bg-[var(--color-surface-elevated)] rounded-lg">
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Points per position:</p>
              <div className="flex flex-wrap gap-2">
                {pointsBreakdown.map(({ rank, points }) => (
                  <span
                    key={rank}
                    className="text-xs px-2 py-1 bg-[var(--color-surface)] rounded"
                  >
                    #{rank} = {points}pts
                  </span>
                ))}
              </div>
            </div>

            {/* Rank slots */}
            <div className="space-y-2">
              {Array.from({ length: survey.maxRankN }, (_, i) => {
                const rank = i + 1;
                const movieId = getMovieForRank(rank);
                const movie = movieId ? getMovieById(movieId) : null;

                return (
                  <div
                    key={rank}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed ${
                      movie
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface-elevated)] font-bold text-[var(--color-text)]">
                      {rank}
                    </span>
                    {movie ? (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          {movie.metadata_snapshot?.posterPath && (
                            <img
                              src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                              alt={movie.title}
                              className="w-10 h-15 object-cover rounded"
                            />
                          )}
                          <span className="font-medium text-[var(--color-text)]">
                            {movie.title}
                          </span>
                        </div>
                        {isLive && movieId && (
                          <button
                            type="button"
                            onClick={() => setRank(rank, movieId)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                            aria-label={`Remove from rank ${rank}`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[var(--color-text-muted)] italic">Select a movie</span>
                    )}
                  </div>
                );
              })}
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
                  className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
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
          <div className="bg-[var(--color-surface)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Movies ({entries.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry) => {
                const selectedRank = isMovieSelected(entry.movie.id);

                return (
                  <button
                    key={entry.movie.id}
                    type="button"
                    disabled={!isLive}
                    onClick={() => handleMovieClick(entry.movie.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedRank !== null
                        ? 'bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]'
                        : 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)]'
                    } ${!isLive ? 'cursor-default' : ''}`}
                  >
                    {entry.movie.metadata_snapshot?.posterPath ? (
                      <img
                        src={`${TMDB_IMAGE_BASE}${entry.movie.metadata_snapshot.posterPath}`}
                        alt={entry.movie.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-18 bg-[var(--color-border)] rounded flex items-center justify-center">
                        <span className="text-[var(--color-text-muted)]">?</span>
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
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-sm font-bold">
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
          <div className="bg-[var(--color-surface)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Current Standings
            </h2>
            {standings.length > 0 && allBallots.length > 0 ? (
              <div className="space-y-2">
                {standings.map((standing) => (
                  <div
                    key={standing.movieId}
                    className="flex items-center gap-3 p-3 bg-[var(--color-surface-elevated)] rounded-lg"
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                        standing.position === 1
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : standing.position === 2
                            ? 'bg-gray-300/20 text-gray-300'
                            : standing.position === 3
                              ? 'bg-orange-400/20 text-orange-400'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {standing.position}
                    </span>
                    {standing.posterPath && (
                      <img
                        src={`${TMDB_IMAGE_BASE}${standing.posterPath}`}
                        alt={standing.title}
                        className="w-10 h-15 object-cover rounded"
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
                    <span className="text-lg font-bold text-[var(--color-primary)]">
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
          <div className="bg-[var(--color-surface)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              All Ballots ({allBallots.length})
            </h2>
            {allBallots.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allBallots.map((b) => (
                  <div
                    key={b.user.id}
                    className="p-3 bg-[var(--color-surface-elevated)] rounded-lg"
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
                              className="text-xs px-2 py-1 bg-[var(--color-surface)] rounded"
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
