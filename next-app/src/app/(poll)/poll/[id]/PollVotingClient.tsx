'use client';

import { useState, useEffect, useActionState, useCallback } from 'react';
import { submitPollVoteAction } from '@/lib/actions/polls';
import type { Standing } from '@/lib/services/scoring';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface PollInfo {
  id: string;
  title: string;
  description: string | null;
  state: 'draft' | 'live' | 'closed';
  maxRankN: number;
}

interface PollMovie {
  id: string;
  title: string;
  metadata_snapshot: {
    posterPath: string | null;
    releaseDate: string | null;
  } | null;
}

interface ClientVote {
  voterName: string;
  ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
}

interface PollVotingClientProps {
  poll: PollInfo;
  movies: PollMovie[];
  voterRanks: Array<{ rank: number; movieId: string }> | null;
  voterName: string;
  allVotes: ClientVote[];
  standings: Standing[];
  pointsBreakdown: Array<{ rank: number; points: number; label: string }>;
  hasExistingVote: boolean;
}

function getRankBadgeClasses(rank: number): string {
  if (rank === 1) return 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30';
  if (rank === 2) return 'bg-gray-300/20 text-gray-300 ring-1 ring-gray-300/30';
  if (rank === 3) return 'bg-orange-400/20 text-orange-400 ring-1 ring-orange-400/30';
  return 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]';
}

function getStandingBorderColor(position: number): string {
  if (position === 1) return 'border-l-yellow-500';
  if (position === 2) return 'border-l-gray-300';
  if (position === 3) return 'border-l-orange-400';
  return 'border-l-transparent';
}

export default function PollVotingClient({
  poll,
  movies,
  voterRanks,
  voterName: initialVoterName,
  allVotes,
  standings,
  pointsBreakdown,
  hasExistingVote,
}: PollVotingClientProps) {
  const initialBallot = new Map<number, string>();
  if (voterRanks) {
    for (const { rank, movieId } of voterRanks) {
      initialBallot.set(rank, movieId);
    }
  }

  const [ballot, setBallot] = useState<Map<number, string>>(initialBallot);
  const [voterName, setVoterName] = useState(initialVoterName || '');
  const [lastChangedRank, setLastChangedRank] = useState<number | null>(null);
  const [liveStandings, setLiveStandings] = useState<Standing[]>(standings);
  const [liveVotes, setLiveVotes] = useState<ClientVote[]>(allVotes);
  const [mobileTab, setMobileTab] = useState<'vote' | 'results'>('vote');
  const isLive = poll.state === 'live';

  const refreshResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/poll/${poll.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setLiveStandings(data.standings);
      setLiveVotes(data.votes);
    } catch {
      // silently ignore fetch errors
    }
  }, [poll.id]);

  // Auto-refresh standings and votes every 10 seconds when poll is live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(refreshResults, 10000);
    return () => clearInterval(interval);
  }, [isLive, refreshResults]);

  const [formState, formAction, isSubmitting] = useActionState(submitPollVoteAction, null);

  // Refresh results immediately after a successful vote
  useEffect(() => {
    if (formState?.success) {
      refreshResults();
    }
  }, [formState, refreshResults]);

  const setRank = useCallback(
    (rank: number, movieId: string) => {
      setBallot((prev) => {
        const newBallot = new Map(prev);
        for (const [r, m] of newBallot) {
          if (m === movieId) {
            newBallot.delete(r);
          }
        }
        if (prev.get(rank) === movieId) {
          return newBallot;
        }
        newBallot.set(rank, movieId);
        return newBallot;
      });
      setLastChangedRank(rank);
      setTimeout(() => setLastChangedRank(null), 200);
    },
    []
  );

  const clearBallot = useCallback(() => {
    setBallot(new Map());
  }, []);

  const getMovieForRank = (rank: number): string | undefined => ballot.get(rank);

  const getMovieById = (id: string): PollMovie | undefined => movies.find((m) => m.id === id);

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
    for (let r = 1; r <= poll.maxRankN; r++) {
      if (!ballot.has(r)) {
        setRank(r, movieId);
        return;
      }
    }
    setRank(poll.maxRankN, movieId);
  };

  let firstEmptySlot: number | null = null;
  if (isLive) {
    for (let r = 1; r <= poll.maxRankN; r++) {
      if (!ballot.has(r)) {
        firstEmptySlot = r;
        break;
      }
    }
  }

  const isBallotComplete = ballot.size === poll.maxRankN;

  // ── Shared sub-components rendered inline ──

  const ballotSection = (
    <div className="bg-[var(--color-surface)] rounded-xl p-3 sm:p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-text)]">Your Ballot</h2>
        {isLive && ballot.size > 0 && (
          <button
            type="button"
            onClick={clearBallot}
            className="text-xs sm:text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Voter Name */}
      {isLive && (
        <div className="mb-3">
          <input
            type="text"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={50}
            className="w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
      )}

      {/* Points breakdown — compact on mobile */}
      <div className="mb-3 p-2.5 bg-[var(--color-surface-elevated)] rounded-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--color-text-muted)] mr-1">Points:</span>
          {pointsBreakdown.map(({ rank, points }) => (
            <span
              key={rank}
              className="text-[11px] px-1.5 py-0.5 bg-[var(--color-surface)] rounded"
            >
              #{rank}={points}
            </span>
          ))}
        </div>
      </div>

      {/* Rank slots */}
      <div className="space-y-1.5">
        {Array.from({ length: poll.maxRankN }, (_, i) => {
          const rank = i + 1;
          const movieId = getMovieForRank(rank);
          const movie = movieId ? getMovieById(movieId) : null;
          const isFirstEmpty = firstEmptySlot === rank;
          const justChanged = lastChangedRank === rank;

          return (
            <div
              key={rank}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                movie
                  ? 'border-[var(--color-primary)]/40 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent'
                  : isFirstEmpty
                    ? 'border-dashed border-[var(--color-border)] animate-slot-pulse'
                    : 'border-dashed border-[var(--color-border)]'
              } ${justChanged ? 'animate-ballot-pop' : ''}`}
            >
              <span className={`w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm ${getRankBadgeClasses(rank)}`}>
                {rank}
              </span>
              {movie ? (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {movie.metadata_snapshot?.posterPath && (
                      <img
                        src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                        alt={movie.title}
                        className="w-8 h-12 sm:w-10 sm:h-15 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <span className="font-medium text-sm sm:text-base text-[var(--color-text)] truncate">
                      {movie.title}
                    </span>
                  </div>
                  {isLive && movieId && (
                    <button
                      type="button"
                      onClick={() => setRank(rank, movieId)}
                      className="p-1 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                      aria-label={`Remove from rank ${rank}`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-[var(--color-text-muted)] italic text-xs sm:text-sm">
                  {isFirstEmpty ? 'Tap a movie below' : 'Empty'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isLive ? (
        <form action={formAction} className="mt-3">
          <input type="hidden" name="pollId" value={poll.id} />
          <input type="hidden" name="voterName" value={voterName} />
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
              : hasExistingVote
                ? 'Update Vote'
                : 'Submit Vote'}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
          This poll is closed for voting.
        </p>
      )}
    </div>
  );

  const moviesSection = (
    <div className="bg-[var(--color-surface)] rounded-xl p-3 sm:p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 overflow-hidden">
      <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-text)] mb-3">
        Movies ({movies.length})
      </h2>
      <div className="space-y-1.5 max-h-80 sm:max-h-96 overflow-y-auto">
        {movies.map((movie) => {
          const selectedRank = isMovieSelected(movie.id);

          return (
            <button
              key={movie.id}
              type="button"
              disabled={!isLive}
              onClick={() => handleMovieClick(movie.id)}
              className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl text-left transition-all duration-150 ${
                selectedRank !== null
                  ? 'bg-[var(--color-primary)]/10 border-l-4 border-l-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] border-l-4 border-l-transparent'
              } ${!isLive ? 'cursor-default' : 'active:scale-[0.98]'}`}
            >
              {movie.metadata_snapshot?.posterPath ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${movie.metadata_snapshot.posterPath}`}
                  alt={movie.title}
                  className="w-9 h-14 sm:w-12 sm:h-18 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-14 sm:w-12 sm:h-18 bg-[var(--color-border)] rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8h20M2 16h20" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-[var(--color-text)] truncate">
                  {movie.title}
                </p>
                {movie.metadata_snapshot?.releaseDate && (
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)]">
                    {movie.metadata_snapshot.releaseDate.slice(0, 4)}
                  </p>
                )}
              </div>
              {selectedRank !== null && (
                <span className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold ${getRankBadgeClasses(selectedRank)}`}>
                  {selectedRank}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const standingsSection = (
    <div className="bg-[var(--color-surface)] rounded-xl p-3 sm:p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 overflow-hidden">
      <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-text)] mb-3">
        Current Standings
      </h2>
      {liveStandings.length > 0 && liveVotes.length > 0 ? (
        <div className="space-y-1.5">
          {liveStandings.map((standing) => (
            <div
              key={standing.movieId}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[var(--color-surface-elevated)] rounded-lg sm:rounded-xl border-l-4 ${getStandingBorderColor(standing.position)}`}
            >
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm ${getRankBadgeClasses(standing.position)}`}
              >
                {standing.position}
              </span>
              {standing.posterPath && (
                <img
                  src={`${TMDB_IMAGE_BASE}${standing.posterPath}`}
                  alt={standing.title}
                  className="w-8 h-12 sm:w-10 sm:h-15 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-[var(--color-text)] truncate">
                  {standing.title}
                  {standing.tied && (
                    <span className="text-[11px] sm:text-xs text-[var(--color-text-muted)]"> (tied)</span>
                  )}
                </p>
              </div>
              <span className={`text-base sm:text-lg font-display font-bold flex-shrink-0 ${
                standing.position === 1 ? 'text-yellow-500' : 'text-[var(--color-primary)]'
              }`}>
                {standing.totalPoints}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--color-text-muted)] text-center py-4 text-sm">No votes yet.</p>
      )}
    </div>
  );

  const ballotsSection = (
    <div className="bg-[var(--color-surface)] rounded-xl p-3 sm:p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 overflow-hidden">
      <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-text)] mb-3">
        All Ballots ({liveVotes.length})
      </h2>
      {liveVotes.length > 0 ? (
        <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
          {liveVotes.map((v, i) => (
            <div
              key={i}
              className="p-2.5 sm:p-3 bg-[var(--color-surface-elevated)] rounded-lg sm:rounded-xl"
            >
              <p className="font-medium text-sm text-[var(--color-text)] mb-1.5">
                {v.voterName}
              </p>
              {v.ranks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {[...v.ranks]
                    .sort((a, b) => a.rank - b.rank)
                    .map(({ rank, movieTitle }) => (
                      <span
                        key={rank}
                        className="text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[var(--color-surface)] rounded"
                      >
                        #{rank}: {movieTitle}
                      </span>
                    ))}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--color-text-muted)] italic">Empty ballot</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--color-text-muted)] text-center py-4 text-sm">
          No votes submitted yet.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-full overflow-hidden">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--color-text)]">{poll.title}</h1>
          <span
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-full ${
              isLive
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20'
                : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20'
            }`}
          >
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1 animate-pulse" />}
            {poll.state}
          </span>
        </div>
        {poll.description && (
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-1">{poll.description}</p>
        )}
        {isLive && (
          <p className="text-xs text-[var(--color-text-muted)]/60 mt-1.5">
            Rank your top {poll.maxRankN} — tap a movie to fill the next slot
          </p>
        )}
      </div>

      {formState?.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm">
          {formState.error}
        </div>
      )}

      {formState?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/50 text-[var(--color-success)] rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm">
          {formState.message}
        </div>
      )}

      {/* Mobile tab switcher — hidden on lg+ */}
      <div className="flex lg:hidden bg-[var(--color-surface)] rounded-lg p-1 border border-[var(--color-border)]/50">
        <button
          type="button"
          onClick={() => setMobileTab('vote')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileTab === 'vote'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Vote
          {ballot.size > 0 && (
            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[11px] rounded-full ${
              mobileTab === 'vote' ? 'bg-white/20' : 'bg-[var(--color-surface-elevated)]'
            }`}>
              {ballot.size}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('results')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileTab === 'results'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Results
          {liveVotes.length > 0 && (
            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[11px] rounded-full ${
              mobileTab === 'results' ? 'bg-white/20' : 'bg-[var(--color-surface-elevated)]'
            }`}>
              {liveVotes.length}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: side-by-side. Mobile: tab-switched. */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Vote column — always visible on lg+, tab-controlled on mobile */}
        <div className={`space-y-4 min-w-0 ${mobileTab !== 'vote' ? 'hidden lg:block' : ''}`}>
          {ballotSection}
          {moviesSection}
        </div>

        {/* Results column */}
        <div className={`space-y-4 min-w-0 ${mobileTab !== 'results' ? 'hidden lg:block' : ''}`}>
          {standingsSection}
          {ballotsSection}
        </div>
      </div>

      {/* Footer branding */}
      <div className="text-center pt-3 sm:pt-4 border-t border-[var(--color-border)]/30">
        <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)]">
          Powered by Movie Night
        </p>
      </div>
    </div>
  );
}
