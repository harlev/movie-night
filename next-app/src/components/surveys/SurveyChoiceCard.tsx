'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { removeOpenSurveyOptionAction } from '@/lib/actions/surveys';
import type { SurveyChoice } from '@/lib/types';

interface SurveyChoiceCardProps {
  choice: SurveyChoice;
  surveyId: string;
  canRemove?: boolean;
}

export function SurveyChoiceCard({ choice, surveyId, canRemove = false }: SurveyChoiceCardProps) {
  const [state, formAction, pending] = useActionState(removeOpenSurveyOptionAction, null);

  return (
    <article className="flex gap-3 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] p-3">
      {choice.imageUrl ? (
        <Image
          src={choice.imageUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="h-16 w-16 flex-none rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-[var(--color-surface)] text-xl text-[var(--color-text-muted)]" aria-hidden="true">?</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-[var(--color-text)]">{choice.title}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Added by {choice.createdByMode === 'admin' ? 'admin' : 'a responder'}</p>
          </div>
          {canRemove && (
            <form action={formAction}>
              <input type="hidden" name="surveyId" value={surveyId} />
              <input type="hidden" name="optionId" value={choice.id} />
              <button type="submit" disabled={pending} className="text-xs text-[var(--color-error)] hover:underline disabled:opacity-50">
                {pending ? 'Removing…' : 'Remove'}
              </button>
            </form>
          )}
        </div>
        {choice.description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{choice.description}</p>}
        {choice.linkUrl && (
          <a href={choice.linkUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block text-sm text-[var(--color-primary)] hover:underline">
            Open link
          </a>
        )}
        {state?.error && <p role="alert" className="mt-1 text-xs text-[var(--color-error)]">{state.error}</p>}
      </div>
    </article>
  );
}
