'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CountdownTimer from '@/components/CountdownTimer';
import ShareButton from '@/components/ShareButton';
import SortableBallotList from '@/components/SortableBallotList';
import { OpenSurveyOptionForm } from '@/components/surveys/OpenSurveyOptionForm';
import { submitBallotAction } from '@/lib/actions/ballots';
import type { Standing } from '@/lib/services/scoring';
import type { Profile, SurveyChoice } from '@/lib/types';
import { useBallot } from '@/hooks/useBallot';
import { getRankBadgeClasses, getRankRingClasses, getStandingBorderColor, shuffle } from '@/lib/utils/rankStyles';
import { reconcileSurveyEntries } from '@/lib/utils/surveyChoices';

interface SurveyInfo {
  id: string;
  title: string;
  description: string | null;
  state: 'draft' | 'live' | 'frozen';
  maxRankN: number;
  closesAt: string | null;
  surveyType: 'movie' | 'open';
  allowResponderOptions: boolean;
  isAnonymous: boolean;
  membersOnly: boolean;
}

interface ClientEntry {
  optionId: string;
  choice: SurveyChoice;
}

interface ClientBallot {
  user: { id: string; displayName: string };
  ranks: Array<{ rank: number; optionId: string; optionTitle: string }>;
}

interface SurveyVotingClientProps {
  survey: SurveyInfo;
  entries: ClientEntry[];
  userBallotRanks: Array<{ rank: number; optionId: string }> | null;
  allBallots: ClientBallot[];
  standings: Standing[];
  pointsBreakdown: Array<{ rank: number; points: number; label: string }>;
  hasExistingBallot: boolean;
  userRole: Profile['role'] | null;
  isAuthenticated: boolean;
  initialGuestName: string;
}

export default function SurveyVotingClient({
  survey,
  entries,
  userBallotRanks,
  allBallots,
  standings,
  pointsBreakdown,
  hasExistingBallot,
  userRole,
  isAuthenticated,
  initialGuestName,
}: SurveyVotingClientProps) {
  const isLive = survey.state === 'live';
  const canVote = isLive && userRole !== 'viewer' && (!survey.membersOnly || isAuthenticated);
  const canAddOptions = canVote && survey.surveyType === 'open' && survey.allowResponderOptions;
  const [formState, formAction, isSubmitting] = useActionState(submitBallotAction, null);
  const [guestName, setGuestName] = useState(initialGuestName);
  const [shuffledEntries, setShuffledEntries] = useState(entries);
  const hasShuffled = useRef(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (!hasShuffled.current) {
      hasShuffled.current = true;
      setShuffledEntries(shuffle(entries));
      return;
    }
    setShuffledEntries((current) => reconcileSurveyEntries(current, entries, shuffle));
  }, [entries]);

  useEffect(() => {
    const saved = localStorage.getItem('survey-view-mode');
    if (saved === 'list' || saved === 'grid') setViewMode(saved);
  }, []);

  useEffect(() => localStorage.setItem('survey-view-mode', viewMode), [viewMode]);

  const {
    ballot,
    lastChangedRank,
    setRank,
    clearBallot,
    handleOptionClick,
    getBallotAsOptionArray,
    isOptionSelected,
    filledRankItems,
    firstEmptySlot,
    isBallotComplete,
    reorderBallot,
  } = useBallot({ maxRankN: survey.maxRankN, initialRanks: userBallotRanks, isLive });

  const getChoiceById = useCallback(
    (id: string) => {
      const choice = entries.find((entry) => entry.optionId === id)?.choice;
      if (!choice) return undefined;
      return {
        id: choice.id,
        title: choice.title,
        imageUrl: choice.imageUrl,
        metadata_snapshot: choice.movie?.metadata_snapshot
          ? {
              posterPath: choice.movie.metadata_snapshot.posterPath,
              releaseDate: choice.movie.metadata_snapshot.releaseDate,
            }
          : null,
      };
    },
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return shuffledEntries;
    return shuffledEntries.filter((entry) =>
      `${entry.choice.title} ${entry.choice.description ?? ''}`.toLowerCase().includes(query)
    );
  }, [filterQuery, shuffledEntries]);

  const showGuestName = !survey.isAnonymous && !isAuthenticated;
  const optionLabel = survey.surveyType === 'movie' ? 'Movies' : 'Options';

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <Link href={isAuthenticated ? '/dashboard' : '/'} className="text-sm text-[var(--color-primary)] hover:underline">
          ← {isAuthenticated ? 'Back to Dashboard' : 'Movie Night'}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{survey.title}</h1>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isLive ? 'border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border-[var(--color-secondary)]/20 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'}`}>
            {survey.state}
          </span>
          {survey.isAnonymous && <span className="rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]">Anonymous</span>}
          <ShareButton surveyId={survey.id} title={survey.title} />
        </div>
        {survey.description && <p className="mt-1 text-[var(--color-text-muted)]">{survey.description}</p>}
      </header>

      {formState?.error && <div role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-red-400">{formState.error}</div>}
      {formState?.success && <div role="status" className="rounded-xl border border-[var(--color-success)]/50 bg-[var(--color-success)]/10 p-3 text-[var(--color-success)]">Your ballot has been submitted!</div>}

      {isLive && survey.closesAt && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-3 py-3 sm:px-4">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] sm:text-xs sm:tracking-widest">Voting closes in</span>
          <CountdownTimer closesAt={survey.closesAt} variant="full" className="min-w-0 max-w-full" onExpired={() => window.location.reload()} />
        </div>
      )}

      {canAddOptions && <OpenSurveyOptionForm surveyId={survey.id} responder />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">Your Ballot</h2>
              {canVote && ballot.size > 0 && <button type="button" onClick={clearBallot} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Clear</button>}
            </div>

            <div className="mb-4 rounded-xl bg-[var(--color-surface-elevated)] p-3">
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">Points per position:</p>
              <div className="flex flex-wrap gap-2">
                {pointsBreakdown.map(({ rank, points }) => <span key={rank} className="rounded-lg bg-[var(--color-surface)] px-2 py-1 text-xs">#{rank} = {points}pt{points === 1 ? '' : 's'}</span>)}
              </div>
            </div>

            <SortableBallotList
              filledRankItems={filledRankItems}
              maxRankN={survey.maxRankN}
              isLive={canVote}
              firstEmptySlot={firstEmptySlot}
              lastChangedRank={lastChangedRank}
              getMovieById={getChoiceById}
              onRemove={setRank}
              onReorder={reorderBallot}
              dndId="survey-ballot"
            />

            {canVote ? (
              <form action={formAction} className="mt-4 space-y-3">
                <input type="hidden" name="surveyId" value={survey.id} />
                <input type="hidden" name="ranks" value={JSON.stringify(getBallotAsOptionArray())} />
                {showGuestName && (
                  <div>
                    <label htmlFor="guestName" className="mb-1 block text-sm font-medium text-[var(--color-text)]">Your name</label>
                    <input
                      id="guestName"
                      name="guestName"
                      required
                      maxLength={80}
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                )}
                <button type="submit" disabled={isSubmitting || ballot.size === 0 || (showGuestName && !guestName.trim())} className={`w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50 ${isBallotComplete ? 'shadow-lg shadow-[var(--color-primary)]/30' : ''}`}>
                  {isSubmitting ? 'Submitting…' : hasExistingBallot ? 'Update Ballot' : 'Submit Ballot'}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">{userRole === 'viewer' ? 'Viewers cannot vote on surveys.' : 'This survey is closed for voting.'}</p>
            )}
          </section>

          <section className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">{optionLabel} <span className="text-sm font-normal text-[var(--color-text-muted)]">({filteredEntries.length})</span></h2>
              {survey.surveyType === 'movie' && (
                <div className="flex rounded-lg bg-[var(--color-surface-elevated)] p-1">
                  {(['list', 'grid'] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`rounded-md px-2 py-1 text-xs ${viewMode === mode ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>{mode}</button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="search"
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              placeholder={survey.surveyType === 'movie' ? 'Filter movies...' : 'Filter options...'}
              className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            />

            {filteredEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No {optionLabel.toLowerCase()} available yet.</p>
            ) : survey.surveyType === 'open' || viewMode === 'list' ? (
              <div className="max-h-[32rem] space-y-2 overflow-y-auto">
                {filteredEntries.map(({ optionId, choice }) => {
                  const selectedRank = isOptionSelected(optionId);
                  return (
                    <article key={optionId} className={`flex items-center gap-2 rounded-xl border-l-4 ${selectedRank !== null ? 'border-l-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-l-transparent bg-[var(--color-surface-elevated)]'}`}>
                      <button type="button" disabled={!canVote} onClick={() => handleOptionClick(optionId)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left disabled:cursor-default">
                        {choice.imageUrl ? <Image src={choice.imageUrl} alt="" width={48} height={48} unoptimized className="h-12 w-12 flex-none rounded-lg object-cover" /> : <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)]">?</div>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-[var(--color-text)]">{choice.title}</span>
                          {choice.description && <span className="line-clamp-2 block text-xs text-[var(--color-text-muted)]">{choice.description}</span>}
                        </span>
                        {selectedRank !== null && <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold ${getRankBadgeClasses(selectedRank)}`}>{selectedRank}</span>}
                      </button>
                      {choice.linkUrl && <a href={choice.linkUrl} target="_blank" rel="noreferrer noopener" className="mr-3 flex-none text-xs text-[var(--color-primary)] hover:underline">Open link</a>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="grid max-h-[32rem] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
                {filteredEntries.map(({ optionId, choice }) => {
                  const selectedRank = isOptionSelected(optionId);
                  return (
                    <button key={optionId} type="button" disabled={!canVote} onClick={() => handleOptionClick(optionId)} className={`overflow-hidden rounded-xl text-left transition-all ${selectedRank !== null ? getRankRingClasses(selectedRank) : 'border border-[var(--color-border)]/50 opacity-80 hover:opacity-100'}`}>
                      <div className="relative aspect-[2/3] bg-[var(--color-surface-elevated)]">
                        {choice.imageUrl && <Image src={choice.imageUrl} alt={choice.title} fill unoptimized className="object-cover" />}
                        {selectedRank !== null && <span className={`absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${getRankBadgeClasses(selectedRank)}`}>{selectedRank}</span>}
                      </div>
                      <div className="bg-[var(--color-surface-elevated)] p-2"><p className="truncate text-sm font-medium text-[var(--color-text)]">{choice.title}</p></div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
            <h2 className="mb-4 text-lg font-display font-semibold text-[var(--color-text)]">Current Standings</h2>
            {standings.length > 0 && allBallots.length > 0 ? (
              <div className="space-y-2">
                {standings.map((standing) => (
                  <div key={standing.optionId} className={`flex items-center gap-3 rounded-xl border-l-4 bg-[var(--color-surface-elevated)] p-3 ${getStandingBorderColor(standing.position)}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${getRankBadgeClasses(standing.position)}`}>{standing.position}</span>
                    {standing.posterPath && <Image src={standing.posterPath} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />}
                    <p className="min-w-0 flex-1 truncate font-medium text-[var(--color-text)]">{standing.title}{standing.tied && <span className="text-xs text-[var(--color-text-muted)]"> (tied)</span>}</p>
                    <span className={`text-lg font-display font-bold ${standing.position === 1 ? 'text-yellow-500' : 'text-[var(--color-primary)]'}`}>{standing.totalPoints}</span>
                  </div>
                ))}
              </div>
            ) : <p className="py-4 text-center text-[var(--color-text-muted)]">No votes yet.</p>}
          </section>

          <section className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
            <h2 className="mb-4 text-lg font-display font-semibold text-[var(--color-text)]">All Ballots ({allBallots.length})</h2>
            {allBallots.length > 0 ? (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {allBallots.map((submittedBallot) => (
                  <div key={submittedBallot.user.id} className="rounded-xl bg-[var(--color-surface-elevated)] p-3">
                    <p className="mb-2 font-medium text-[var(--color-text)]">{submittedBallot.user.displayName}</p>
                    <div className="flex flex-wrap gap-2">
                      {[...submittedBallot.ranks].sort((a, b) => a.rank - b.rank).map(({ rank, optionTitle }) => <span key={rank} className="rounded-lg bg-[var(--color-surface)] px-2 py-1 text-xs">#{rank}: {optionTitle}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="py-4 text-center text-[var(--color-text-muted)]">No ballots submitted yet.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
