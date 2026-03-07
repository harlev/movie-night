'use client';

import { useState, useEffect, useRef, useActionState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { submitBallotAction } from '@/lib/actions/ballots';
import type { Standing } from '@/lib/services/scoring';
import { useBallot } from '@/hooks/useBallot';
import { getRankBadgeClasses, getStandingBorderColor, shuffle } from '@/lib/utils/rankStyles';
import CountdownTimer from '@/components/CountdownTimer';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface SurveyInfo {
  id: string;
  title: string;
  description: string | null;
  state: 'draft' | 'live' | 'frozen';
  maxRankN: number;
  closesAt: string | null;
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

interface SimpleVotingClientProps {
  survey: SurveyInfo;
  entries: ClientEntry[];
  userBallotRanks: Array<{ rank: number; movieId: string }> | null;
  allBallots: ClientBallot[];
  standings: Standing[];
  pointsBreakdown: Array<{ rank: number; points: number; label: string }>;
  hasExistingBallot: boolean;
  userRole?: 'admin' | 'member' | 'viewer';
}

export default function SimpleVotingClient({
  survey,
  entries,
  userBallotRanks,
  allBallots,
  standings,
  pointsBreakdown,
  hasExistingBallot,
  userRole,
}: SimpleVotingClientProps) {
  const isLive = survey.state === 'live';
  const canVote = isLive && userRole !== 'viewer';

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
    clearBallot,
    getBallotAsArray,
    isMovieSelected,
    isBallotComplete,
    toggleMovie,
    moveRank,
  } = useBallot({
    maxRankN: survey.maxRankN,
    initialRanks: userBallotRanks,
    isLive,
  });

  const [filterQuery, setFilterQuery] = useState('');

  const filteredEntries = useMemo(() => {
    if (!filterQuery.trim()) return shuffledEntries;
    const query = filterQuery.toLowerCase().trim();
    return shuffledEntries.filter((entry) =>
      entry.movie.title.toLowerCase().includes(query)
    );
  }, [shuffledEntries, filterQuery]);

  return (
    <div className="animate-fade-in pb-24 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm inline-flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-display font-bold text-[var(--color-text)]">{survey.title}</h1>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              isLive
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20'
                : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20'
            }`}
          >
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1 animate-pulse" />}
            {survey.state}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {formState?.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 mb-4 text-sm">
          {formState.error}
        </div>
      )}
      {formState?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/50 text-[var(--color-success)] rounded-xl p-3 mb-4 text-sm">
          Your ballot has been submitted!
        </div>
      )}

      {/* Countdown — compact, sticky */}
      {isLive && survey.closesAt && (
        <div className="sticky top-0 z-10 py-2 px-3 mb-4 rounded-xl bg-[var(--color-surface)]/95 backdrop-blur border border-[var(--color-border)]/50 flex items-center justify-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Closes in</span>
          <CountdownTimer
            closesAt={survey.closesAt}
            variant="compact"
            onExpired={() => window.location.reload()}
          />
        </div>
      )}

      {/* Points breakdown — collapsible */}
      <details className="mb-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50">
        <summary className="px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] cursor-pointer select-none">
          Points per position
        </summary>
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {pointsBreakdown.map(({ rank, points }) => (
            <span key={rank} className="text-xs px-2 py-1 bg-[var(--color-surface-elevated)] rounded-lg">
              #{rank} = {points}pts
            </span>
          ))}
        </div>
      </details>

      {/* Filter bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter movies..."
          className="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
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

      {/* Ballot summary */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">{ballot.size}</span> of {survey.maxRankN} ranked
        </span>
        {canVote && ballot.size > 0 && (
          <button
            type="button"
            onClick={clearBallot}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Movie list */}
      <div className="space-y-2 mb-6">
        {filteredEntries.length === 0 && filterQuery.trim() ? (
          <p className="text-[var(--color-text-muted)] text-center py-6 text-sm">
            No movies match &ldquo;{filterQuery.trim()}&rdquo;
          </p>
        ) : (
          filteredEntries.map((entry) => {
            const selectedRank = isMovieSelected(entry.movie.id);
            const isSelected = selectedRank !== null;

            return (
              <div
                key={entry.movie.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ${
                  isSelected
                    ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)]/50'
                }`}
              >
                {/* Tappable area: poster + title */}
                <button
                  type="button"
                  disabled={!canVote}
                  onClick={() => toggleMovie(entry.movie.id)}
                  className={`flex items-center gap-3 flex-1 min-w-0 text-left ${!canVote ? 'cursor-default' : 'active:scale-[0.98]'}`}
                >
                  {entry.movie.metadata_snapshot?.posterPath ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}${entry.movie.metadata_snapshot.posterPath}`}
                      alt={entry.movie.title}
                      className="w-10 h-15 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-15 bg-[var(--color-border)] rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[var(--color-text-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 8h20M2 16h20" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate text-sm">
                      {entry.movie.title}
                    </p>
                    {entry.movie.metadata_snapshot?.releaseDate && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {entry.movie.metadata_snapshot.releaseDate.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </button>

                {/* Up/down arrows for selected movies */}
                {isSelected && canVote && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveRank(entry.movie.id, 'up')}
                      disabled={selectedRank === 1}
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                      aria-label="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRank(entry.movie.id, 'down')}
                      disabled={selectedRank === ballot.size}
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                      aria-label="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Rank badge or empty circle */}
                <div className="shrink-0 w-8 flex justify-center">
                  {isSelected ? (
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold animate-rank-in ${getRankBadgeClasses(selectedRank!)}`}
                    >
                      {selectedRank}
                    </span>
                  ) : canVote ? (
                    <span className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] border-dashed" />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Standings — collapsible, default open */}
      <details open className="mb-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50">
        <summary className="px-4 py-3 text-sm font-display font-semibold text-[var(--color-text)] cursor-pointer select-none">
          Current Standings
        </summary>
        <div className="px-4 pb-4">
          {standings.length > 0 && allBallots.length > 0 ? (
            <div className="space-y-2">
              {standings.map((standing) => (
                <div
                  key={standing.movieId}
                  className={`flex items-center gap-3 p-3 bg-[var(--color-surface-elevated)] rounded-xl border-l-4 ${getStandingBorderColor(standing.position)}`}
                >
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs ${getRankBadgeClasses(standing.position)}`}>
                    {standing.position}
                  </span>
                  {standing.posterPath && (
                    <img
                      src={`${TMDB_IMAGE_BASE}${standing.posterPath}`}
                      alt={standing.title}
                      className="w-8 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate text-sm">
                      {standing.title}
                      {standing.tied && (
                        <span className="text-xs text-[var(--color-text-muted)]"> (tied)</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-base font-display font-bold ${
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
      </details>

      {/* All Ballots — collapsible, default closed */}
      <details className="mb-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50">
        <summary className="px-4 py-3 text-sm font-display font-semibold text-[var(--color-text)] cursor-pointer select-none">
          All Ballots ({allBallots.length})
        </summary>
        <div className="px-4 pb-4">
          {allBallots.length > 0 ? (
            <div className="space-y-3">
              {allBallots.map((b) => (
                <div key={b.user.id} className="p-3 bg-[var(--color-surface-elevated)] rounded-xl">
                  <p className="font-medium text-[var(--color-text)] text-sm mb-2">{b.user.displayName}</p>
                  {b.ranks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {[...b.ranks]
                        .sort((a, b) => a.rank - b.rank)
                        .map(({ rank, movieTitle }) => (
                          <span key={rank} className="text-xs px-2 py-1 bg-[var(--color-surface)] rounded-lg">
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
            <p className="text-[var(--color-text-muted)] text-center py-4 text-sm">No ballots submitted yet.</p>
          )}
        </div>
      </details>

      {/* Sticky submit bar */}
      {canVote && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--color-surface)]/95 backdrop-blur border-t border-[var(--color-border)]/50 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: survey.maxRankN }, (_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    i < ballot.size
                      ? 'bg-[var(--color-primary)] scale-100'
                      : 'bg-[var(--color-border)] scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Submit button */}
            <form action={formAction} className="flex-1">
              <input type="hidden" name="surveyId" value={survey.id} />
              <input type="hidden" name="ranks" value={JSON.stringify(getBallotAsArray())} />
              <button
                type="submit"
                disabled={isSubmitting || ballot.size === 0}
                className={`w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 text-sm ${
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
          </div>
        </div>
      )}

      {/* Frozen state message */}
      {!canVote && userRole !== 'viewer' && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--color-surface)]/95 backdrop-blur border-t border-[var(--color-border)]/50 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <p className="text-center text-sm text-[var(--color-text-muted)]">This survey is closed for voting.</p>
        </div>
      )}
    </div>
  );
}
