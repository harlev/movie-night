'use client';

import { useState, useEffect, useRef, useActionState, useCallback, useMemo } from 'react';
import { submitPollVoteAction } from '@/lib/actions/polls';
import type { Standing } from '@/lib/services/scoring';
import PollAuthModal from './PollAuthModal';
import { useBallot } from '@/hooks/useBallot';
import { getRankBadgeClasses, getStandingBorderColor, shuffle } from '@/lib/utils/rankStyles';
import SortableBallotList from '@/components/SortableBallotList';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';
const TMDB_IMAGE_BASE_GRID = 'https://image.tmdb.org/t/p/w185';

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
  loggedInName: string;
  isLoggedIn: boolean;
  allVotes: ClientVote[];
  standings: Standing[];
  pointsBreakdown: Array<{ rank: number; points: number; label: string }>;
  hasExistingVote: boolean;
}

export default function PollVotingClient({
  poll,
  movies,
  voterRanks,
  voterName: initialVoterName,
  loggedInName,
  isLoggedIn,
  allVotes,
  standings,
  pointsBreakdown,
  hasExistingVote,
}: PollVotingClientProps) {
  const isLive = poll.state === 'live';

  const [shuffledMovies, setShuffledMovies] = useState(movies);
  const hasShuffled = useRef(false);
  useEffect(() => {
    if (!hasShuffled.current) {
      hasShuffled.current = true;
      setShuffledMovies(shuffle(movies));
    }
  }, [movies]);
  const [voterName, setVoterName] = useState(initialVoterName || '');
  const [liveStandings, setLiveStandings] = useState<Standing[]>(standings);
  const [liveVotes, setLiveVotes] = useState<ClientVote[]>(allVotes);
  const [mobileTab, setMobileTab] = useState<'vote' | 'results'>('vote');

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
    maxRankN: poll.maxRankN,
    initialRanks: voterRanks,
    isLive,
  });

  const getMovieById = useCallback(
    (id: string): PollMovie | undefined => movies.find((m) => m.id === id),
    [movies]
  );

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('poll-view-mode');
    if (saved === 'list' || saved === 'grid') {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('poll-view-mode', viewMode);
  }, [viewMode]);

  const filteredMovies = useMemo(() => {
    if (!filterQuery.trim()) return shuffledMovies;
    const query = filterQuery.toLowerCase().trim();
    return shuffledMovies.filter((movie) =>
      movie.title.toLowerCase().includes(query)
    );
  }, [shuffledMovies, filterQuery]);

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
            onChange={(e) => !loggedInName && setVoterName(e.target.value)}
            disabled={!!loggedInName}
            placeholder="Your name (optional)"
            maxLength={50}
            className={`w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] transition-colors ${loggedInName ? 'opacity-70 cursor-not-allowed' : ''}`}
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

      {/* Rank slots with drag-and-drop */}
      <SortableBallotList
        filledRankItems={filledRankItems}
        maxRankN={poll.maxRankN}
        isLive={isLive}
        firstEmptySlot={firstEmptySlot}
        lastChangedRank={lastChangedRank}
        getMovieById={getMovieById}
        onRemove={setRank}
        onReorder={reorderBallot}
        compact
        dndId="poll-ballot"
      />

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
      {/* Header row with title + view toggle */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-text)]">
          Movies{' '}
          <span className="text-xs sm:text-sm font-normal text-[var(--color-text-muted)]">
            {filterQuery.trim()
              ? `${filteredMovies.length} of ${shuffledMovies.length}`
              : `(${shuffledMovies.length})`}
          </span>
        </h2>
        <div className="flex items-center gap-1 bg-[var(--color-surface-elevated)] rounded-lg p-0.5 sm:p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1 sm:p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            title="List view"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1 sm:p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            title="Grid view"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter movies..."
          className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg sm:rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
        />
        {filterQuery && (
          <button
            type="button"
            onClick={() => setFilterQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Empty filter state */}
      {filteredMovies.length === 0 && filterQuery.trim() ? (
        <p className="text-[var(--color-text-muted)] text-center py-6 text-sm">
          No movies match &ldquo;{filterQuery.trim()}&rdquo;
        </p>
      ) : viewMode === 'list' ? (
        /* List view */
        <div className="space-y-1.5 max-h-80 sm:max-h-96 overflow-y-auto">
          {filteredMovies.map((movie) => {
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
      ) : (
        /* Grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-80 sm:max-h-96 overflow-y-auto">
          {filteredMovies.map((movie) => {
            const selectedRank = isMovieSelected(movie.id);

            return (
              <button
                key={movie.id}
                type="button"
                disabled={!isLive}
                onClick={() => handleMovieClick(movie.id)}
                className={`relative rounded-lg sm:rounded-xl overflow-hidden text-left transition-all duration-200 ${
                  selectedRank !== null
                    ? 'ring-2 ring-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20'
                    : 'border border-[var(--color-border)]/50 opacity-70 hover:opacity-100'
                } ${!isLive ? 'cursor-default' : 'active:scale-[0.97]'}`}
              >
                {movie.metadata_snapshot?.posterPath ? (
                  <img
                    src={`${TMDB_IMAGE_BASE_GRID}${movie.metadata_snapshot.posterPath}`}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 8h20M2 16h20" />
                    </svg>
                  </div>
                )}
                {selectedRank !== null && (
                  <span className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold shadow-md ${getRankBadgeClasses(selectedRank)}`}>
                    {selectedRank}
                  </span>
                )}
                <div className={`p-1.5 sm:p-2 ${selectedRank !== null ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface-elevated)]'}`}>
                  <p className="font-medium text-[var(--color-text)] text-xs sm:text-sm truncate">
                    {movie.title}
                  </p>
                  {movie.metadata_snapshot?.releaseDate && (
                    <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)]">
                      {movie.metadata_snapshot.releaseDate.slice(0, 4)}
                    </p>
                  )}
                </div>
                {selectedRank !== null && (
                  <div className="h-0.5 bg-[var(--color-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
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
        {isLoggedIn && (
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Movie Night
          </a>
        )}
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

      {!isLoggedIn && <PollAuthModal pollId={poll.id} />}
    </div>
  );
}
