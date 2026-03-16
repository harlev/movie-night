'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitBallotAction } from '@/lib/actions/ballots';
import type { Standing } from '@/lib/services/scoring';
import { useBallot } from '@/hooks/useBallot';
import {
  getRankBadgeClasses,
  getStandingBorderColor,
  shuffle,
} from '@/lib/utils/rankStyles';
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
  view: 'ballot' | 'results';
  resultsPage: 1 | 2;
  allBallots?: ClientBallot[];
  standings?: Standing[];
  hasExistingBallot: boolean;
  showBackToBallot: boolean;
  showSubmittedFlash: boolean;
  userRole?: 'admin' | 'member' | 'viewer';
}

interface AlertState {
  error?: string;
  success?: boolean;
}

interface SimpleMovieListProps {
  ballotSize: number;
  canVote: boolean;
  desktop?: boolean;
  entries: ClientEntry[];
  handleMovieClick: (movieId: string) => void;
  isMovieSelected: (movieId: string) => number | null;
  moveRank: (movieId: string, direction: 'up' | 'down') => void;
  showMoveControls?: boolean;
}

function VotingAlerts({
  formState,
  mobile,
}: {
  formState: AlertState | null;
  mobile?: boolean;
}) {
  if (!formState?.error && !formState?.success) {
    return null;
  }

  const spacingClass = mobile ? 'mb-4 text-sm' : 'p-3';

  return (
    <>
      {formState?.error && (
        <div
          className={`bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl ${spacingClass}`}
        >
          {formState.error}
        </div>
      )}
      {formState?.success && (
        <div
          className={`bg-[var(--color-success)]/10 border border-[var(--color-success)]/50 text-[var(--color-success)] rounded-xl ${spacingClass}`}
        >
          Your ballot has been submitted!
        </div>
      )}
    </>
  );
}

function SimpleMovieList({
  ballotSize,
  canVote,
  desktop,
  entries,
  handleMovieClick,
  isMovieSelected,
  moveRank,
  showMoveControls,
}: SimpleMovieListProps) {
  return (
    <div className={desktop ? 'space-y-4' : 'space-y-2'}>
      {entries.map((entry) => {
        const selectedRank = isMovieSelected(entry.movie.id);
        const isSelected = selectedRank !== null;

        return (
          <div
            key={entry.movie.id}
            className={`flex items-center ${
              desktop ? 'gap-4 rounded-[1.5rem] px-4 py-3' : 'gap-3 rounded-xl p-3'
            } border transition-all duration-150 ${
              isSelected
                ? 'border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10'
                : 'border-[var(--color-border)]/50 bg-[var(--color-surface)]'
            }`}
          >
            <button
              type="button"
              disabled={!canVote}
              onClick={() => handleMovieClick(entry.movie.id)}
              className={`flex flex-1 min-w-0 items-center ${
                desktop ? 'gap-5 text-base' : 'gap-3 text-left'
              } text-left ${!canVote ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              {entry.movie.metadata_snapshot?.posterPath ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${entry.movie.metadata_snapshot.posterPath}`}
                  alt={entry.movie.title}
                  className={
                    desktop
                      ? 'h-16 w-12 rounded-xl object-cover shrink-0'
                      : 'w-10 h-15 rounded-lg object-cover shrink-0'
                  }
                />
              ) : (
                <div
                  className={
                    desktop
                      ? 'h-16 w-12 rounded-xl bg-[var(--color-border)] flex items-center justify-center shrink-0'
                      : 'w-10 h-15 rounded-lg bg-[var(--color-border)] flex items-center justify-center shrink-0'
                  }
                >
                  <svg
                    className={
                      desktop
                        ? 'h-6 w-6 text-[var(--color-text-muted)]/30'
                        : 'w-4 h-4 text-[var(--color-text-muted)]/30'
                    }
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8h20M2 16h20" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p
                  className={`font-medium text-[var(--color-text)] truncate ${
                    desktop ? 'text-lg leading-tight' : 'text-sm'
                  }`}
                >
                  {entry.movie.title}
                </p>
                {entry.movie.metadata_snapshot?.releaseDate && (
                  <p
                    className={`text-[var(--color-text-muted)] ${
                      desktop ? 'mt-0.5 text-sm' : 'text-xs'
                    }`}
                  >
                    {entry.movie.metadata_snapshot.releaseDate.slice(0, 4)}
                  </p>
                )}
              </div>
            </button>

            {showMoveControls && isSelected && canVote && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveRank(entry.movie.id, 'up')}
                  disabled={selectedRank === 1}
                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                  aria-label="Move up"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveRank(entry.movie.id, 'down')}
                  disabled={selectedRank === ballotSize}
                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                  aria-label="Move down"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {canVote ? (
              <button
                type="button"
                onClick={() => handleMovieClick(entry.movie.id)}
                aria-label={`Toggle rank for ${entry.movie.title}`}
                className={`${
                  desktop ? 'w-12 shrink-0 flex justify-center' : 'w-8 shrink-0 flex justify-center'
                } cursor-pointer`}
              >
                {isSelected ? (
                  <span
                    className={`flex items-center justify-center rounded-full font-bold animate-rank-in ${getRankBadgeClasses(
                      selectedRank!
                    )} ${desktop ? 'h-10 w-10 text-base' : 'w-7 h-7 text-sm'}`}
                  >
                    {selectedRank}
                  </span>
                ) : (
                  <span
                    className={
                      desktop
                        ? 'h-10 w-10 rounded-full border-[3px] border-dashed border-[var(--color-border)]'
                        : 'w-7 h-7 rounded-full border-2 border-[var(--color-border)] border-dashed'
                    }
                  />
                )}
              </button>
            ) : (
              <div
                className={
                  desktop ? 'w-12 shrink-0 flex justify-center' : 'w-8 shrink-0 flex justify-center'
                }
              >
                {isSelected ? (
                  <span
                    className={`flex items-center justify-center rounded-full font-bold animate-rank-in ${getRankBadgeClasses(
                      selectedRank!
                    )} ${desktop ? 'h-10 w-10 text-base' : 'w-7 h-7 text-sm'}`}
                  >
                    {selectedRank}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BallotStatusRow({
  closesAt,
  isLive,
  surveyState,
}: {
  closesAt: string | null;
  isLive: boolean;
  surveyState: SurveyInfo['state'];
}) {
  return (
    <div className="flex items-stretch gap-2">
      {isLive && closesAt && (
        <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-3">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Closes
          </span>
          <CountdownTimer
            closesAt={closesAt}
            variant="compact"
            onExpired={() => window.location.reload()}
          />
        </div>
      )}
      <span
        className={`ml-auto inline-flex min-h-9 items-center justify-center rounded-full px-3 text-xs font-medium ${
          isLive
            ? 'border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]'
            : 'border border-[var(--color-secondary)]/20 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'
        }`}
      >
        {isLive && (
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
        )}
        {isLive ? 'live' : surveyState}
      </span>
    </div>
  );
}

function CompactBallotHeader({
  survey,
  isLive,
  mobile,
}: {
  survey: SurveyInfo;
  isLive: boolean;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? 'mb-3 space-y-2' : 'mb-6 space-y-3'}>
      {mobile ? (
        <h1 className="sr-only">{survey.title}</h1>
      ) : (
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)] sm:text-3xl">
          {survey.title}
        </h1>
      )}

      {survey.description && (
        <p
          className={`leading-relaxed text-[var(--color-text-muted)] ${
            mobile ? 'text-sm' : 'max-w-2xl text-sm sm:text-base'
          }`}
        >
          {survey.description}
        </p>
      )}

      <BallotStatusRow
        closesAt={survey.closesAt}
        isLive={isLive}
        surveyState={survey.state}
      />
    </div>
  );
}

function CompactBallotActions({
  survey,
  ballotSize,
  canVote,
  clearBallot,
  formAction,
  getBallotAsArray,
  hasExistingBallot,
  isBallotComplete,
  isSubmitting,
  userRole,
}: {
  survey: SurveyInfo;
  ballotSize: number;
  canVote: boolean;
  clearBallot: () => void;
  formAction: (payload: FormData) => void;
  getBallotAsArray: () => Array<{ rank: number; movieId: string }>;
  hasExistingBallot: boolean;
  isBallotComplete: boolean;
  isSubmitting: boolean;
  userRole?: 'admin' | 'member' | 'viewer';
}) {
  const mobileActionBarClassName =
    'fixed bottom-0 inset-x-0 z-20 border-t border-[var(--color-border)]/50 bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]';

  if (!canVote) {
    if (userRole === 'viewer') {
      return null;
    }

    return (
      <div className={mobileActionBarClassName}>
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            This survey is closed for voting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={mobileActionBarClassName}>
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <p className="sr-only" aria-live="polite">
          {ballotSize} of {survey.maxRankN} ranks selected.
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: survey.maxRankN }, (_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border text-[11px] font-semibold flex items-center justify-center transition-all duration-200 ${
                i < ballotSize
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]'
                  : 'border-[var(--color-border)]/70 text-[var(--color-text-muted)]'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={clearBallot}
          disabled={ballotSize === 0}
          className="shrink-0 rounded-lg border border-[var(--color-border)]/70 px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
        >
          Clear
        </button>

        <form action={formAction} className="flex-1">
          <input type="hidden" name="surveyId" value={survey.id} />
          <input
            type="hidden"
            name="ranks"
            value={JSON.stringify(getBallotAsArray())}
          />
          <input
            type="hidden"
            name="successRedirect"
            value={`/survey/${survey.id}/simple?view=results&submitted=1`}
          />
          <button
            type="submit"
            disabled={isSubmitting || ballotSize === 0}
            className={`w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 text-sm ${
              isBallotComplete
                ? 'shadow-lg shadow-[var(--color-primary)]/30'
                : 'shadow-md shadow-[var(--color-primary)]/20'
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
  );
}

function CountdownBanner({
  closesAt,
}: {
  closesAt: string | null;
}) {
  if (!closesAt) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-3 sm:px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
      <span className="text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-widest text-[var(--color-text-muted)]">
        Voting closes in
      </span>
      <CountdownTimer
        closesAt={closesAt}
        variant="full"
        className="min-w-0 max-w-full"
        onExpired={() => window.location.reload()}
      />
    </div>
  );
}

function SimpleSurveyIntro({
  survey,
  isLive,
  viewLabel,
  viewLabelStyle,
  helperText,
  action,
  emphasizeHelper,
}: {
  survey: SurveyInfo;
  isLive: boolean;
  viewLabel: 'Ballot' | 'Results';
  viewLabelStyle?: 'pill' | 'eyebrow';
  helperText: string;
  action?: ReactNode;
  emphasizeHelper?: boolean;
}) {
  const statusLabel = isLive ? 'Live' : survey.state;

  return (
    <div className="space-y-4">
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

      <div className="rounded-[1.75rem] border border-[var(--color-border)]/50 bg-[linear-gradient(135deg,rgba(34,27,18,0.96),rgba(18,15,11,0.94))] p-5 shadow-xl shadow-black/25 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {viewLabelStyle === 'eyebrow' ? (
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {viewLabel}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-light)]">
                  {viewLabel}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isLive
                    ? 'border border-[var(--color-success)]/25 bg-[var(--color-success)]/10 text-[var(--color-success)]'
                    : 'border border-[var(--color-secondary)]/25 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold leading-tight text-[var(--color-text)] sm:text-3xl">
                {survey.title}
              </h1>
              {survey.description && (
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                  {survey.description}
                </p>
              )}
              <p
                className={`max-w-2xl text-sm leading-relaxed sm:text-base ${
                  emphasizeHelper
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                {helperText}
              </p>
            </div>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

function ResultsPager({ resultsPage }: { resultsPage: 1 | 2 }) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-1">
      <Link
        href="?view=results"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          resultsPage === 1
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        Standings
      </Link>
      <Link
        href="?view=results&page=2"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          resultsPage === 2
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        All Ballots
      </Link>
    </div>
  );
}

function StandingsCard({
  standings,
  ballotCount,
}: {
  standings: Standing[];
  ballotCount: number;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
      <h2 className="text-lg font-display font-semibold text-[var(--color-text)]">
        Current Standings
      </h2>
      <p className="mt-2 mb-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        Read-only standings. These rows are informational and do not change your ballot.
      </p>
      {standings.length > 0 && ballotCount > 0 ? (
        <div className="space-y-2">
          {standings.map((standing) => (
            <div
              key={standing.movieId}
              className={`cursor-default flex items-center gap-3 rounded-xl border-l-4 bg-[var(--color-surface-elevated)] p-3 ${getStandingBorderColor(
                standing.position
              )}`}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${getRankBadgeClasses(
                  standing.position
                )}`}
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
              <span
                className={`text-lg font-display font-bold ${
                  standing.position === 1
                    ? 'text-yellow-500'
                    : 'text-[var(--color-primary)]'
                }`}
              >
                {standing.totalPoints}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--color-text-muted)] text-center py-4">No votes yet.</p>
      )}
    </div>
  );
}

function AllBallotsCard({ allBallots }: { allBallots: ClientBallot[] }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
      <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">
        All Ballots ({allBallots.length})
      </h2>
      {allBallots.length > 0 ? (
        <div className="space-y-3">
          {allBallots.map((ballotEntry) => (
            <div
              key={ballotEntry.user.id}
              className="p-3 bg-[var(--color-surface-elevated)] rounded-xl"
            >
              <p className="font-medium text-[var(--color-text)] mb-2">
                {ballotEntry.user.displayName}
              </p>
              {ballotEntry.ranks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {[...ballotEntry.ranks]
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
                <p className="text-sm text-[var(--color-text-muted)] italic">Empty ballot</p>
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
  );
}

export default function SimpleVotingClient({
  survey,
  entries,
  userBallotRanks,
  view,
  resultsPage,
  allBallots,
  standings,
  hasExistingBallot,
  showBackToBallot,
  showSubmittedFlash,
  userRole,
}: SimpleVotingClientProps) {
  const router = useRouter();
  const isLive = survey.state === 'live';
  const canVote = isLive && userRole !== 'viewer';
  const resultsStandings = standings ?? [];
  const resultsAllBallots = allBallots ?? [];

  const [shuffledEntries, setShuffledEntries] = useState(entries);
  const hasShuffled = useRef(false);
  useEffect(() => {
    if (!hasShuffled.current) {
      hasShuffled.current = true;
      setShuffledEntries(shuffle(entries));
    }
  }, [entries]);

  useEffect(() => {
    if (view !== 'results' || !showSubmittedFlash) {
      return;
    }

    router.replace(
      `/survey/${survey.id}/simple${resultsPage === 2 ? '?view=results&page=2' : '?view=results'}`
    );
  }, [resultsPage, router, showSubmittedFlash, survey.id, view]);

  const [formState, formAction, isSubmitting] = useActionState(
    submitBallotAction,
    null
  );

  const {
    ballot,
    clearBallot,
    getBallotAsArray,
    isBallotComplete,
    isMovieSelected,
    moveRank,
    handleMovieClick,
  } = useBallot({
    maxRankN: survey.maxRankN,
    initialRanks: userBallotRanks,
    isLive,
  });

  const resultsIntroText = showSubmittedFlash
    ? 'Ballot submitted successfully. Current standings are now unlocked. You can still edit your ballot until voting closes.'
    : 'You already voted. Current standings are visible. You can still edit your ballot until voting closes.';

  if (view === 'ballot') {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="hidden md:block">
          <div className="max-w-5xl">
            <CompactBallotHeader survey={survey} isLive={isLive} />
            <VotingAlerts formState={formState} />
            <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 overflow-hidden lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col">
              <h2 className="text-lg font-display font-semibold text-[var(--color-text)] mb-4">
                Movies{' '}
                <span className="text-sm font-normal text-[var(--color-text-muted)]">
                  ({shuffledEntries.length})
                </span>
              </h2>
              <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                <SimpleMovieList
                  ballotSize={ballot.size}
                  canVote={canVote}
                  desktop
                  entries={shuffledEntries}
                  handleMovieClick={handleMovieClick}
                  isMovieSelected={isMovieSelected}
                  moveRank={moveRank}
                  showMoveControls
                />
              </div>

              {canVote ? (
                <div className="mt-5 lg:mt-4 lg:border-t lg:border-[var(--color-border)]/50 lg:pt-4">
                  <div className="rounded-2xl bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/95 to-transparent backdrop-blur-sm">
                    <form action={formAction}>
                      <input type="hidden" name="surveyId" value={survey.id} />
                      <input
                        type="hidden"
                        name="ranks"
                        value={JSON.stringify(getBallotAsArray())}
                      />
                      <input
                        type="hidden"
                        name="successRedirect"
                        value={`/survey/${survey.id}/simple?view=results&submitted=1`}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || ballot.size === 0}
                        className={`w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${
                          isBallotComplete
                            ? 'shadow-lg shadow-[var(--color-primary)]/30'
                            : 'shadow-md shadow-[var(--color-primary)]/20'
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
              ) : userRole === 'viewer' ? (
                <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
                  Viewers cannot vote on surveys.
                </p>
              ) : (
                <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
                  This survey is closed for voting.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden pb-24 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          <CompactBallotHeader mobile survey={survey} isLive={isLive} />
          <VotingAlerts formState={formState} mobile />
          <CompactBallotActions
            survey={survey}
            ballotSize={ballot.size}
            canVote={canVote}
            clearBallot={clearBallot}
            formAction={formAction}
            getBallotAsArray={getBallotAsArray}
            hasExistingBallot={hasExistingBallot}
            isBallotComplete={isBallotComplete}
            isSubmitting={isSubmitting}
            userRole={userRole}
          />
          <div className="mb-6">
            <SimpleMovieList
              ballotSize={ballot.size}
              canVote={canVote}
              entries={shuffledEntries}
              handleMovieClick={handleMovieClick}
              isMovieSelected={isMovieSelected}
              moveRank={moveRank}
              showMoveControls
            />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'results') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SimpleSurveyIntro
          survey={survey}
          isLive={isLive}
          viewLabel="Results"
          viewLabelStyle="eyebrow"
          helperText={resultsIntroText}
          emphasizeHelper={showSubmittedFlash}
          action={
            showBackToBallot ? (
              <Link
                href="?view=ballot"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/12 px-4 py-2 text-sm font-semibold text-[var(--color-primary-light)] transition-colors hover:bg-[var(--color-primary)]/20"
              >
                Edit My Ballot
              </Link>
            ) : null
          }
        />

        {isLive && <CountdownBanner closesAt={survey.closesAt} />}

        <div className="flex flex-wrap items-center gap-3">
          <ResultsPager resultsPage={resultsPage} />
        </div>

        {resultsPage === 1 ? (
          <StandingsCard
            standings={resultsStandings}
            ballotCount={resultsAllBallots.length}
          />
        ) : (
          <AllBallotsCard allBallots={resultsAllBallots} />
        )}
      </div>
    );
  }

  return null;
}
