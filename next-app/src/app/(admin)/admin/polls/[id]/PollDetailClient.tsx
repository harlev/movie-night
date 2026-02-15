'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  updatePollAction,
  changePollStateAction,
  addMovieToPollAction,
  removeMovieFromPollAction,
  deletePollAction,
  searchMoviesForPollAction,
  togglePollVoteDisabledAction,
  togglePollArchivedAction,
} from '@/lib/actions/polls';
import type { QuickPoll, QuickPollMovie } from '@/lib/types';
import type { Standing } from '@/lib/services/scoring';
import QRCodeDisplay from '@/components/QRCodeDisplay';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getStateColor(state: string): string {
  switch (state) {
    case 'live':
      return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
    case 'closed':
      return 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]';
    default:
      return 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]';
  }
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

interface VoteInfo {
  voteId: string;
  voterName: string;
  voterEmail: string | null;
  disabled: boolean;
  ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
}

interface PollDetailClientProps {
  poll: QuickPoll;
  movies: QuickPollMovie[];
  voteCount: number;
  votes: VoteInfo[];
  standings: Standing[];
}

function UpdateInfoForm({ poll }: { poll: QuickPoll }) {
  const [state, formAction, pending] = useActionState(updatePollAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="pollId" value={poll.id} />
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={poll.title}
            required
            className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={poll.description || ''}
            rows={2}
            className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
          />
        </div>
        <div>
          <label htmlFor="maxRankN" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Max Rank
          </label>
          <select
            id="maxRankN"
            name="maxRankN"
            defaultValue={poll.max_rank_n}
            className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
          >
            {[3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>Top {n}</option>
            ))}
          </select>
        </div>
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3">
            {state.message}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function StateControls({ poll, movieCount }: { poll: QuickPoll; movieCount: number }) {
  const [stateResult, changeStateAction, statePending] = useActionState(changePollStateAction, null);
  const [deleteResult, deleteAction, deletePending] = useActionState(deletePollAction, null);
  const [archiveResult, archiveAction, archivePending] = useActionState(togglePollArchivedAction, null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canGoLive = poll.state === 'draft' && movieCount > 0;
  const canClose = poll.state === 'live';

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {canGoLive && (
          <form action={changeStateAction}>
            <input type="hidden" name="pollId" value={poll.id} />
            <input type="hidden" name="state" value="live" />
            <button
              type="submit"
              disabled={statePending}
              className="px-4 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Go Live
            </button>
          </form>
        )}

        {canClose && (
          <form action={changeStateAction}>
            <input type="hidden" name="pollId" value={poll.id} />
            <input type="hidden" name="state" value="closed" />
            <button
              type="submit"
              disabled={statePending}
              className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Close Poll
            </button>
          </form>
        )}

        {poll.state === 'closed' && (
          <form action={archiveAction}>
            <input type="hidden" name="pollId" value={poll.id} />
            <input type="hidden" name="archived" value={poll.archived ? 'false' : 'true'} />
            <button
              type="submit"
              disabled={archivePending}
              className="px-4 py-2 bg-[var(--color-text-muted)]/20 hover:bg-[var(--color-text-muted)]/30 text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {archivePending ? (poll.archived ? 'Unarchiving...' : 'Archiving...') : (poll.archived ? 'Unarchive' : 'Archive')}
            </button>
          </form>
        )}

        {poll.state === 'draft' && (
          <>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">Are you sure?</span>
                <form action={deleteAction}>
                  <input type="hidden" name="pollId" value={poll.id} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="px-4 py-2 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletePending ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete Poll
              </button>
            )}
          </>
        )}
      </div>

      {stateResult?.error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mt-3">
          {stateResult.error}
        </div>
      )}

      {stateResult?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 mt-3">
          {stateResult.message}
        </div>
      )}

      {deleteResult?.error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mt-3">
          {deleteResult.error}
        </div>
      )}

      {archiveResult?.error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mt-3">
          {archiveResult.error}
        </div>
      )}

      {archiveResult?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 mt-3">
          {archiveResult.message}
        </div>
      )}

      {poll.state === 'draft' && movieCount === 0 && (
        <p className="text-sm text-[var(--color-warning)] mt-3">
          Add at least one movie before going live.
        </p>
      )}
    </div>
  );
}

function TMDbMovieSearch({ pollId, existingTmdbIds }: { pollId: string; existingTmdbIds: Set<number> }) {
  const [searchState, searchAction, searchPending] = useActionState(searchMoviesForPollAction, null);
  const [addState, addAction, addPending] = useActionState(addMovieToPollAction, null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const results = searchState?.searchResults?.filter(
    (m: any) => !existingTmdbIds.has(m.id)
  ) || [];

  return (
    <div>
      <form action={searchAction} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="query"
            defaultValue={searchState?.query || ''}
            placeholder="Search TMDb for movies..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={searchPending}
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {searchPending ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchState?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
          {searchState.error}
        </div>
      )}

      {addState?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
          {addState.error}
        </div>
      )}

      {addState?.success && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] rounded-lg p-3 mb-4 text-sm">
          {addState.message}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {results.map((movie: any) => {
            const isAdding = addPending && addingId === movie.id;
            return (
              <form key={movie.id} action={(formData) => { setAddingId(movie.id); addAction(formData); }}>
                <input type="hidden" name="pollId" value={pollId} />
                <input type="hidden" name="tmdbId" value={movie.id} />
                <button
                  type="submit"
                  disabled={addPending}
                  className="group w-full text-left relative rounded-lg overflow-hidden border border-transparent hover:border-[var(--color-primary)]/60 transition-all duration-200 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <div className="aspect-[2/3] bg-[var(--color-surface-elevated)] relative">
                    {movie.poster_path ? (
                      <img
                        src={`${TMDB_IMAGE_BASE}/w185${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--color-primary)] rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                    {isAdding && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[var(--color-warning)] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[var(--color-surface-elevated)]">
                    <p className="text-xs font-medium text-[var(--color-text)] truncate leading-tight">{movie.title}</p>
                    {movie.release_date && (
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{movie.release_date.slice(0, 4)}</p>
                    )}
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      )}

      {searchState?.searchResults && results.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
          No new movies found. Try a different search.
        </p>
      )}
    </div>
  );
}

function RemovePollMovieButton({ pollId, pollMovieId, movieId }: { pollId: string; pollMovieId: string; movieId: string }) {
  const [, formAction, pending] = useActionState(removeMovieFromPollAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="pollMovieId" value={pollMovieId} />
      <input type="hidden" name="movieId" value={movieId} />
      <button
        type="submit"
        disabled={pending}
        className="p-1.5 bg-black/70 backdrop-blur-sm text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white rounded-full transition-all disabled:opacity-50"
        title="Remove from poll"
      >
        {pending ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </form>
  );
}

function ToggleVoteButton({ pollId, voteId, disabled }: { pollId: string; voteId: string; disabled: boolean }) {
  const [, formAction, pending] = useActionState(togglePollVoteDisabledAction, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="voteId" value={voteId} />
      <input type="hidden" name="disabled" value={disabled ? 'false' : 'true'} />
      <button
        type="submit"
        disabled={pending}
        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
          disabled
            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20'
            : 'bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20'
        }`}
      >
        {pending ? '...' : disabled ? 'Enable' : 'Disable'}
      </button>
    </form>
  );
}

export default function PollDetailClient({
  poll,
  movies,
  voteCount,
  votes,
  standings,
}: PollDetailClientProps) {
  const [urlCopied, setUrlCopied] = useState(false);

  const pollUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/poll/${poll.id}`
    : `/poll/${poll.id}`;

  const existingTmdbIds = new Set(movies.map((m) => m.tmdb_id));

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/polls"
            className="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Polls
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">{poll.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded ${getStateColor(poll.state)}`}>
            {poll.state}
          </span>
          {poll.archived && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
              archived
            </span>
          )}
        </div>
      </div>

      {/* Poll Info */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Poll Details</h2>

        {poll.state === 'draft' ? (
          <UpdateInfoForm poll={poll} />
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Title:</span> {poll.title}
            </p>
            {poll.description && (
              <p className="text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text)]">Description:</span> {poll.description}
              </p>
            )}
            <p className="text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Max Rank:</span> Top {poll.max_rank_n}
            </p>
            <p className="text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Votes:</span> {voteCount}
            </p>
          </div>
        )}
      </div>

      {/* State Controls */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Poll State</h2>
        <StateControls poll={poll} movieCount={movies.length} />
      </div>

      {/* Share Section (only when live or closed) */}
      {poll.state !== 'draft' && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Share Poll</h2>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pollUrl}
                  className="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm"
                />
                <button
                  type="button"
                  onClick={copyUrl}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {urlCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Anyone with this link can vote — no login required.
              </p>
            </div>
            <QRCodeDisplay url={pollUrl} size={150} />
          </div>
        </div>
      )}

      {/* Movies in Poll */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Movies in Poll
          <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({movies.length})</span>
        </h2>

        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group relative rounded-lg overflow-hidden border border-[var(--color-border)]/30 bg-[var(--color-surface-elevated)]"
              >
                <div className="aspect-[2/3] relative">
                  {movie.metadata_snapshot?.posterPath ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}/w185${movie.metadata_snapshot.posterPath}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}
                  {poll.state !== 'closed' && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RemovePollMovieButton
                        pollId={poll.id}
                        pollMovieId={movie.id}
                        movieId={movie.id}
                      />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-[var(--color-text)] truncate leading-tight">{movie.title}</p>
                  {movie.metadata_snapshot?.releaseDate && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {movie.metadata_snapshot.releaseDate.slice(0, 4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] text-center py-8">No movies in this poll yet.</p>
        )}
      </div>

      {/* TMDb Search (add movies) */}
      {poll.state !== 'closed' && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Add Movies from TMDb</h2>
          <TMDbMovieSearch pollId={poll.id} existingTmdbIds={existingTmdbIds} />
        </div>
      )}

      {/* Standings */}
      {standings.length > 0 && voteCount > 0 && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Standings</h2>
          <div className="space-y-2">
            {standings.map((standing) => (
              <div
                key={standing.movieId}
                className={`flex items-center gap-3 p-3 bg-[var(--color-surface-elevated)] rounded-xl border-l-4 ${getStandingBorderColor(standing.position)}`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${getRankBadgeClasses(standing.position)}`}>
                  {standing.position}
                </span>
                {standing.posterPath && (
                  <img
                    src={`${TMDB_IMAGE_BASE}/w92${standing.posterPath}`}
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
        </div>
      )}

      {/* All Votes */}
      {votes.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            All Ballots ({votes.length})
          </h2>
          <div className="space-y-3">
            {votes.map((vote) => (
              <div
                key={vote.voteId}
                className={`p-3 bg-[var(--color-surface-elevated)] rounded-lg transition-opacity ${vote.disabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`font-medium text-[var(--color-text)] ${vote.disabled ? 'line-through' : ''}`}>
                      {vote.voterName}
                    </p>
                    {vote.voterEmail && (
                      <p className="text-xs text-[var(--color-text-muted)]">{vote.voterEmail}</p>
                    )}
                  </div>
                  <ToggleVoteButton pollId={poll.id} voteId={vote.voteId} disabled={vote.disabled} />
                </div>
                {vote.ranks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {[...vote.ranks].sort((a, b) => a.rank - b.rank).map((r) => (
                      <span
                        key={r.rank}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-surface)] rounded text-sm"
                      >
                        <span className="text-[var(--color-primary)] font-medium">#{r.rank}</span>
                        <span className="text-[var(--color-text-muted)]">{r.movieTitle}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">Empty ballot</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
