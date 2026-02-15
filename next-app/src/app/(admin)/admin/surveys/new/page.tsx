'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { createSurveyAction } from '@/lib/actions/surveys';
import { getNextSunday6pmPacific } from '@/lib/utils/closesAt';

export default function NewSurveyPage() {
  const [state, formAction, pending] = useActionState(createSurveyAction, null);
  const [closesAt, setClosesAt] = useState('');

  useEffect(() => {
    setClosesAt(getNextSunday6pmPacific());
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
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
        <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">Create Survey</h1>
      </div>

      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={state?.title || ''}
                required
                maxLength={100}
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="e.g., Movie Night - Week 1"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={state?.description || ''}
                rows={3}
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                placeholder="Add any notes or context for this survey..."
              />
            </div>

            <div>
              <label htmlFor="maxRankN" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Maximum Ranking Positions
              </label>
              <select
                id="maxRankN"
                name="maxRankN"
                defaultValue={state?.maxRankN || '3'}
                className="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>
                    Top {n} movies
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Users will rank their top N choices. Rank 1 gets N points, rank 2 gets N-1 points, etc.
              </p>
            </div>

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
                {closesAt && (
                  <button type="button" onClick={() => setClosesAt('')}
                    className="px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Voting closes automatically at this time. Default: next Sunday 6pm PT.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Link
              href="/admin/surveys"
              className="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {pending ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
