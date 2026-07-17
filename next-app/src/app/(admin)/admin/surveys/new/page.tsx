'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { SurveySettingsFields } from '@/components/surveys/SurveySettingsFields';
import { createSurveyAction } from '@/lib/actions/surveys';
import { getNextSunday6pmPacific } from '@/lib/utils/closesAt';

export default function NewSurveyPage() {
  const [state, formAction, pending] = useActionState(createSurveyAction, null);
  const [surveyType, setSurveyType] = useState<'movie' | 'open'>('movie');
  const [closesAt, setClosesAt] = useState('');

  useEffect(() => setClosesAt(getNextSunday6pmPacific()), []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/surveys" className="text-sm text-[var(--color-primary)] hover:underline">← Back to Surveys</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">Create Survey</h1>
      </div>

      <form action={formAction} className="space-y-6 rounded-xl bg-[var(--color-surface)] p-6">
        {state?.error && <div role="alert" className="rounded-lg border border-red-500 bg-red-500/10 p-3 text-red-400">{state.error}</div>}

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[var(--color-text)]">Survey type</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 ${surveyType === 'movie' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)]'}`}>
              <input
                type="radio"
                name="surveyType"
                value="movie"
                checked={surveyType === 'movie'}
                onChange={() => setSurveyType('movie')}
                className="sr-only"
              />
              <span className="block font-medium text-[var(--color-text)]">Movie survey</span>
              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">Choose from movies already in the catalog.</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-4 ${surveyType === 'open' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)]'}`}>
              <input
                type="radio"
                name="surveyType"
                value="open"
                checked={surveyType === 'open'}
                onChange={() => setSurveyType('open')}
                className="sr-only"
              />
              <span className="block font-medium text-[var(--color-text)]">Open survey</span>
              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">Create custom options for any question.</span>
            </label>
          </div>
        </fieldset>

        <SurveySettingsFields
          title={state?.title}
          description={state?.description}
          maxRankN={state?.maxRankN ? Number(state.maxRankN) : 3}
        />

        {surveyType === 'open' && (
          <p className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-3 text-sm text-[var(--color-text-muted)]">
            Responder-added options start enabled. You can turn them off after adding at least two admin options.
          </p>
        )}

        <div>
          <label htmlFor="closesAt" className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Closing time <span className="text-xs font-normal text-[var(--color-text-muted)]">Pacific Time</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="closesAt"
              type="datetime-local"
              name="closesAt"
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            {closesAt && <button type="button" onClick={() => setClosesAt('')} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Clear</button>}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/surveys" className="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Cancel</Link>
          <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-primary)] px-6 py-2 font-medium text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
            {pending ? 'Creating…' : 'Create Survey'}
          </button>
        </div>
      </form>
    </div>
  );
}
