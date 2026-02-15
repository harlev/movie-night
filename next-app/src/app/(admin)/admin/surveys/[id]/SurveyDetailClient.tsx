'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  updateSurveyAction,
  changeSurveyStateAction,
  addMovieToSurveyAction,
  removeMovieFromSurveyAction,
  deleteSurveyAction,
  toggleSurveyArchivedAction,
  updateSurveyClosesAtAction,
} from '@/lib/actions/surveys';
import type { Survey, Movie } from '@/lib/types';
import { utcToPacificLocal } from '@/lib/utils/closesAt';
import CountdownTimer from '@/components/CountdownTimer';

function getStateColor(state: string): string {
  switch (state) {
    case 'live':
      return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
    case 'frozen':
      return 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]';
    default:
      return 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]';
  }
}

interface SurveyEntry {
  id: string;
  survey_id: string;
  movie_id: string;
  movie: {
    id: string;
    title: string;
    tmdb_id: number;
    metadata_snapshot: Movie['metadata_snapshot'];
  };
}

interface BallotInfo {
  user: { id: string; displayName: string };
  ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
}

interface AvailableMovie {
  id: string;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

interface SurveyDetailClientProps {
  survey: Survey;
  entries: SurveyEntry[];
  ballotCount: number;
  availableMovies: AvailableMovie[];
  ballots: BallotInfo[];
}

function UpdateInfoForm({ survey }: { survey: Survey }) {
  const [state, formAction, pending] = useActionState(updateSurveyAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="surveyId" value={survey.id} />
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={survey.title}
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
            defaultValue={survey.description || ''}
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
            defaultValue={survey.max_rank_n}
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

function ClosesAtForm({ survey }: { survey: Survey }) {
  const [state, formAction, pending] = useActionState(updateSurveyClosesAtAction, null);
  const [closesAt, setClosesAt] = useState(
    survey.closes_at ? utcToPacificLocal(survey.closes_at) : ''
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="surveyId" value={survey.id} />
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Closing Time
            <span className="ml-1.5 text-xs font-normal text-[var(--color-text-muted)]">Pacific Time</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              name="closesAt"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {pending ? 'Saving...' : 'Save'}
            </button>
            {closesAt && (
              <button
                type="button"
                onClick={() => {
                  setClosesAt('');
                  // Submit the form with empty closesAt to clear
                  const form = document.createElement('form');
                  form.style.display = 'none';
                  const input1 = document.createElement('input');
                  input1.name = 'surveyId';
                  input1.value = survey.id;
                  const input2 = document.createElement('input');
                  input2.name = 'closesAt';
                  input2.value = '';
                  form.appendChild(input1);
                  form.appendChild(input2);
                  document.body.appendChild(form);
                  formAction(new FormData(form));
                  document.body.removeChild(form);
                }}
                className="px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {survey.state === 'live' && survey.closes_at && (
          <CountdownTimer closesAt={survey.closes_at} variant="compact" />
        )}

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
      </div>
    </form>
  );
}

function StateControls({ survey, entryCount }: { survey: Survey; entryCount: number }) {
  const [stateResult, changeStateAction, statePending] = useActionState(changeSurveyStateAction, null);
  const [deleteResult, deleteAction, deletePending] = useActionState(deleteSurveyAction, null);
  const [archiveResult, archiveAction, archivePending] = useActionState(toggleSurveyArchivedAction, null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canGoLive = survey.state === 'draft' && entryCount > 0;
  const canFreeze = survey.state === 'live';

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {canGoLive && (
          <form action={changeStateAction}>
            <input type="hidden" name="surveyId" value={survey.id} />
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

        {canFreeze && (
          <form action={changeStateAction}>
            <input type="hidden" name="surveyId" value={survey.id} />
            <input type="hidden" name="state" value="frozen" />
            <button
              type="submit"
              disabled={statePending}
              className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Freeze Survey
            </button>
          </form>
        )}

        {survey.state === 'frozen' && (
          <form action={archiveAction}>
            <input type="hidden" name="surveyId" value={survey.id} />
            <input type="hidden" name="archived" value={survey.archived ? 'false' : 'true'} />
            <button
              type="submit"
              disabled={archivePending}
              className="px-4 py-2 bg-[var(--color-text-muted)]/20 hover:bg-[var(--color-text-muted)]/30 text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {archivePending ? (survey.archived ? 'Unarchiving...' : 'Archiving...') : (survey.archived ? 'Unarchive' : 'Archive')}
            </button>
          </form>
        )}

        {survey.state === 'draft' && (
          <>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">Are you sure?</span>
                <form action={deleteAction}>
                  <input type="hidden" name="surveyId" value={survey.id} />
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
                Delete Survey
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

      {survey.state === 'draft' && entryCount === 0 && (
        <p className="text-sm text-[var(--color-warning)] mt-3">
          Add at least one movie before going live.
        </p>
      )}
    </div>
  );
}

function MoviePicker({ surveyId, availableMovies }: { surveyId: string; availableMovies: AvailableMovie[] }) {
  const [state, formAction, pending] = useActionState(addMovieToSurveyAction, null);
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const filtered = search.trim()
    ? availableMovies.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      )
    : availableMovies;

  return (
    <div className="mb-6">
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search available movies..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
          {state.error}
        </div>
      )}

      {/* Movie Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((movie) => {
            const isAdding = pending && addingId === movie.id;
            return (
              <form key={movie.id} action={(formData) => { setAddingId(movie.id); formAction(formData); }}>
                <input type="hidden" name="surveyId" value={surveyId} />
                <input type="hidden" name="movieId" value={movie.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="group w-full text-left relative rounded-lg overflow-hidden border border-transparent hover:border-[var(--color-primary)]/60 transition-all duration-200 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] bg-[var(--color-surface-elevated)] relative">
                    {movie.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${movie.posterPath}`}
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

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--color-primary)] rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>

                    {/* Loading overlay */}
                    {isAdding && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Rating badge */}
                    {movie.voteAverage && movie.voteAverage > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[var(--color-warning)] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {movie.voteAverage.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="p-2 bg-[var(--color-surface-elevated)]">
                    <p className="text-xs font-medium text-[var(--color-text)] truncate leading-tight">{movie.title}</p>
                    {movie.releaseDate && (
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{movie.releaseDate.slice(0, 4)}</p>
                    )}
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
          {search ? 'No movies match your search.' : 'No available movies to add.'}
        </p>
      )}
    </div>
  );
}

function RemoveMovieButton({ surveyId, entryId, movieId }: { surveyId: string; entryId: string; movieId: string }) {
  const [, formAction, pending] = useActionState(removeMovieFromSurveyAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="surveyId" value={surveyId} />
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="movieId" value={movieId} />
      <button
        type="submit"
        disabled={pending}
        className="p-1.5 bg-black/70 backdrop-blur-sm text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white rounded-full transition-all disabled:opacity-50"
        title="Remove from survey"
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

export default function SurveyDetailClient({
  survey,
  entries,
  ballotCount,
  availableMovies,
  ballots,
}: SurveyDetailClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/surveys"
            className="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Surveys
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">{survey.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded ${getStateColor(survey.state)}`}>
            {survey.state}
          </span>
          {survey.archived && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
              archived
            </span>
          )}
        </div>
      </div>

      {/* Survey Info */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Survey Details</h2>

        {survey.state === 'draft' ? (
          <UpdateInfoForm survey={survey} />
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Title:</span> {survey.title}
            </p>
            {survey.description && (
              <p className="text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text)]">Description:</span> {survey.description}
              </p>
            )}
            <p className="text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Max Rank:</span> Top {survey.max_rank_n}
            </p>
            <p className="text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Ballots:</span> {ballotCount}
            </p>
          </div>
        )}
      </div>

      {/* Closing Time */}
      {survey.state !== 'frozen' && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Closing Time</h2>
          <ClosesAtForm survey={survey} />
        </div>
      )}

      {/* State Controls */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Survey State</h2>
        <StateControls survey={survey} entryCount={entries.length} />
      </div>

      {/* In Survey */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          In Survey
          <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({entries.length})</span>
        </h2>

        {entries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group relative rounded-lg overflow-hidden border border-[var(--color-border)]/30 bg-[var(--color-surface-elevated)]"
              >
                <div className="aspect-[2/3] relative">
                  {entry.movie.metadata_snapshot?.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${entry.movie.metadata_snapshot.posterPath}`}
                      alt={entry.movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}
                  {survey.state !== 'frozen' && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RemoveMovieButton
                        surveyId={survey.id}
                        entryId={entry.id}
                        movieId={entry.movie_id}
                      />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-[var(--color-text)] truncate leading-tight">{entry.movie.title}</p>
                  {entry.movie.metadata_snapshot?.releaseDate && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {entry.movie.metadata_snapshot.releaseDate.slice(0, 4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] text-center py-8">No movies in this survey yet.</p>
        )}
      </div>

      {/* Available Movies */}
      {survey.state !== 'frozen' && availableMovies.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Available Movies
            <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({availableMovies.length})</span>
          </h2>
          <MoviePicker surveyId={survey.id} availableMovies={availableMovies} />
        </div>
      )}

      {/* Ballots */}
      {ballots.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Ballots ({ballots.length})
          </h2>
          <div className="space-y-3">
            {ballots.map((ballot) => (
              <div
                key={ballot.user.id}
                className="p-3 bg-[var(--color-surface-elevated)] rounded-lg"
              >
                <p className="font-medium text-[var(--color-text)] mb-2">{ballot.user.displayName}</p>
                {ballot.ranks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ballot.ranks.map((r) => (
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
