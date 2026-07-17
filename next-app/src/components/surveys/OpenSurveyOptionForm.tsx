'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { addOpenSurveyOptionAction, addResponderSurveyOptionAction } from '@/lib/actions/surveys';

interface OpenSurveyOptionFormProps {
  surveyId: string;
  responder?: boolean;
}

export function OpenSurveyOptionForm({ surveyId, responder = false }: OpenSurveyOptionFormProps) {
  const action = responder ? addResponderSurveyOptionAction : addOpenSurveyOptionAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [dismissedState, setDismissedState] = useState<typeof state>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const responderDetailsRef = useRef<HTMLDetailsElement>(null);
  const responderSummaryRef = useRef<HTMLElement>(null);
  const visibleState = state === dismissedState ? null : state;

  const closeResponderDisclosure = useCallback(() => {
    responderSummaryRef.current?.focus();
    if (responderDetailsRef.current) responderDetailsRef.current.open = false;
  }, []);

  function closeResponderForm() {
    formRef.current?.reset();
    setDismissedState(state);
    closeResponderDisclosure();
  }

  useEffect(() => {
    if (!responder || !state?.success) return;
    formRef.current?.reset();
    setDismissedState(state);
    closeResponderDisclosure();
  }, [closeResponderDisclosure, responder, state]);

  const optionalFields = (
    <div className="grid gap-3 sm:grid-cols-2">
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
  );

  const form = (
    <form
      ref={formRef}
      action={formAction}
      className={responder
        ? 'mt-3 space-y-3 rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-4'
        : 'space-y-3'}
    >
      <input type="hidden" name="surveyId" value={surveyId} />
      <div>
        <label
          htmlFor={`${responder ? 'responder-' : ''}option-title`}
          className={responder ? 'sr-only' : 'mb-1 block text-sm font-medium text-[var(--color-text)]'}
        >
          Option title
        </label>
        <input
          ref={titleInputRef}
          id={`${responder ? 'responder-' : ''}option-title`}
          name="optionTitle"
          required
          maxLength={100}
          placeholder={responder ? 'Option title' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      {optionalFields}

      {visibleState?.error && <p role="alert" className="text-sm text-[var(--color-error)]">{visibleState.error}</p>}
      {visibleState?.success && !responder && <p role="status" className="text-sm text-[var(--color-success)]">{visibleState.message}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
        >
          {pending ? 'Adding…' : responder ? 'Add' : 'Add option'}
        </button>
        {responder && (
          <button
            type="button"
            onClick={closeResponderForm}
            disabled={pending}
            className="rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  if (!responder) return form;

  return (
    <details
      ref={responderDetailsRef}
      className="group"
      onToggle={(event) => {
        if (!event.currentTarget.open) return;
        setDismissedState(state);
        titleInputRef.current?.focus();
      }}
    >
      <summary
        ref={responderSummaryRef}
        className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-dashed border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10 px-4 py-3 text-left transition-all hover:-translate-y-px hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-xl leading-none text-white shadow-sm shadow-[var(--color-primary)]/40">+</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-[var(--color-text)]">Add your own option</span>
          <span className="block text-sm text-[var(--color-text-muted)]">Have an idea? Add it to the vote.</span>
        </span>
        <span className="hidden rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white sm:block">Add</span>
      </summary>
      {form}
    </details>
  );
}
