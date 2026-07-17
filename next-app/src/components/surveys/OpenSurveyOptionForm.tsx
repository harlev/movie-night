'use client';

import { useActionState } from 'react';
import { addOpenSurveyOptionAction, addResponderSurveyOptionAction } from '@/lib/actions/surveys';

interface OpenSurveyOptionFormProps {
  surveyId: string;
  responder?: boolean;
}

export function OpenSurveyOptionForm({ surveyId, responder = false }: OpenSurveyOptionFormProps) {
  const action = responder ? addResponderSurveyOptionAction : addOpenSurveyOptionAction;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="surveyId" value={surveyId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${responder ? 'responder-' : ''}option-title`} className="mb-1 block text-sm font-medium text-[var(--color-text)]">Option title</label>
          <input
            id={`${responder ? 'responder-' : ''}option-title`}
            name="optionTitle"
            required
            maxLength={100}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${responder ? 'responder-' : ''}option-description`} className="mb-1 block text-sm font-medium text-[var(--color-text)]">Description (optional)</label>
          <textarea
            id={`${responder ? 'responder-' : ''}option-description`}
            name="optionDescription"
            rows={2}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={`${responder ? 'responder-' : ''}option-link`} className="mb-1 block text-sm font-medium text-[var(--color-text)]">Link (optional)</label>
          <input
            id={`${responder ? 'responder-' : ''}option-link`}
            name="optionLink"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={`${responder ? 'responder-' : ''}option-image`} className="mb-1 block text-sm font-medium text-[var(--color-text)]">Small image (optional)</label>
          <input
            id={`${responder ? 'responder-' : ''}option-image`}
            name="optionImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-primary)]/15 file:px-3 file:py-2 file:text-[var(--color-primary)]"
          />
        </div>
      </div>
      {state?.error && <p role="alert" className="text-sm text-[var(--color-error)]">{state.error}</p>}
      {state?.success && <p role="status" className="text-sm text-[var(--color-success)]">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
      >
        {pending ? 'Adding…' : responder ? 'Suggest option' : 'Add option'}
      </button>
    </form>
  );
}
