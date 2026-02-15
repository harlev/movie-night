'use client';

import { useActionState } from 'react';
import { backfillImdbIdsAction } from '@/lib/actions/movies';

export default function BackfillImdbButton() {
  const [state, formAction, isPending] = useActionState(backfillImdbIdsAction, null);

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Backfilling...' : 'Backfill IMDb IDs'}
        </button>
      </form>
      {state?.success && (
        <p className="text-[var(--color-success)] text-xs mt-2">
          Updated {state.updated}, skipped {state.skipped}, failed {state.failed}
        </p>
      )}
      {state?.error && (
        <p className="text-[var(--color-error)] text-xs mt-2">{state.error}</p>
      )}
    </div>
  );
}
