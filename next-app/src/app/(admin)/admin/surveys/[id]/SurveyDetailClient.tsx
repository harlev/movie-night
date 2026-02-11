'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  updateSurveyAction,
  changeSurveyStateAction,
  addMovieToSurveyAction,
  removeMovieFromSurveyAction,
  deleteSurveyAction,
} from '@/lib/actions/surveys';
import type { Survey, Movie } from '@/lib/types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

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

interface SurveyDetailClientProps {
  survey: Survey;
  entries: SurveyEntry[];
  ballotCount: number;
  availableMovies: Array<{ id: string; title: string }>;
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

function StateControls({ survey, entryCount }: { survey: Survey; entryCount: number }) {
  const [stateResult, changeStateAction, statePending] = useActionState(changeSurveyStateAction, null);
  const [deleteResult, deleteAction, deletePending] = useActionState(deleteSurveyAction, null);
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

      {survey.state === 'draft' && entryCount === 0 && (
        <p className="text-sm text-[var(--color-warning)] mt-3">
          Add at least one movie before going live.
        </p>
      )}
    </div>
  );
}

function AddMovieForm({ surveyId, availableMovies }: { surveyId: string; availableMovies: Array<{ id: string; title: string }> }) {
  const [state, formAction, pending] = useActionState(addMovieToSurveyAction, null);
  const [selectedMovieId, setSelectedMovieId] = useState('');

  return (
    <div className="mb-6 p-4 bg-[var(--color-surface-elevated)] rounded-lg">
      <form action={formAction}>
        <input type="hidden" name="surveyId" value={surveyId} />
        <label htmlFor="movieId" className="block text-sm font-medium text-[var(--color-text)] mb-2">
          Select Movie
        </label>
        <div className="flex gap-3">
          <select
            id="movieId"
            name="movieId"
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
            className="flex-1 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
          >
            <option value="">Choose a movie...</option>
            {availableMovies.map((movie) => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedMovieId || pending}
            className="px-4 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {pending ? 'Adding...' : 'Add'}
          </button>
        </div>
        {state?.error && (
          <p className="text-sm text-[var(--color-error)] mt-2">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-[var(--color-success)] mt-2">{state.message}</p>
        )}
      </form>
    </div>
  );
}

function RemoveMovieButton({ surveyId, entryId, movieId }: { surveyId: string; entryId: string; movieId: string }) {
  const [state, formAction, pending] = useActionState(removeMovieFromSurveyAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="surveyId" value={surveyId} />
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="movieId" value={movieId} />
      <button
        type="submit"
        disabled={pending}
        className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors disabled:opacity-50"
        title="Remove movie"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
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
  const [showAddMovie, setShowAddMovie] = useState(false);

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
        <span className={`px-3 py-1 text-sm font-medium rounded ${getStateColor(survey.state)}`}>
          {survey.state}
        </span>
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

      {/* State Controls */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Survey State</h2>
        <StateControls survey={survey} entryCount={entries.length} />
      </div>

      {/* Movies */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Movies ({entries.length})
          </h2>
          {survey.state !== 'frozen' && availableMovies.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAddMovie(!showAddMovie)}
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
            >
              {showAddMovie ? 'Cancel' : 'Add Movie'}
            </button>
          )}
        </div>

        {showAddMovie && (
          <AddMovieForm surveyId={survey.id} availableMovies={availableMovies} />
        )}

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {entry.movie.metadata_snapshot?.posterPath ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}${entry.movie.metadata_snapshot.posterPath}`}
                      alt={entry.movie.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-18 bg-[var(--color-border)] rounded flex items-center justify-center">
                      <span className="text-xs text-[var(--color-text-muted)]">?</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{entry.movie.title}</p>
                    {entry.movie.metadata_snapshot?.releaseDate && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {entry.movie.metadata_snapshot.releaseDate.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </div>
                {survey.state !== 'frozen' && (
                  <RemoveMovieButton
                    surveyId={survey.id}
                    entryId={entry.id}
                    movieId={entry.movie_id}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] text-center py-8">No movies in this survey yet.</p>
        )}
      </div>

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
