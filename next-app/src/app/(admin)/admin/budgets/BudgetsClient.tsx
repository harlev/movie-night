'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';
import {
  closeBudgetAction,
  createBudgetAction,
  reopenBudgetAction,
  updateBudgetAction,
} from '@/lib/actions/budgets';
import type { BudgetLifecycleEvent } from '@/lib/types';
import type { BudgetWithLifecycle } from '@/lib/queries/budgets';
import {
  formatBudgetCurrency,
  formatBudgetDate,
  formatBudgetDateTime,
} from '@/lib/utils/budgets';

const SINGLE_OPEN_BUDGET_ERROR = 'Only one budget can be open at a time';

interface BudgetsClientProps {
  budgets: BudgetWithLifecycle[];
}

function formatEventLabel(eventType: BudgetLifecycleEvent['event_type']): string {
  switch (eventType) {
    case 'opened':
      return 'Opened';
    case 'reopened':
      return 'Reopened';
    case 'closed':
      return 'Closed';
    default:
      return eventType;
  }
}

function BudgetFields({
  budgetId,
  defaultTotalAmount,
  defaultCurrentAmount,
  defaultVenmoUrl,
}: {
  budgetId?: string;
  defaultTotalAmount: string;
  defaultCurrentAmount: string;
  defaultVenmoUrl: string;
}) {
  return (
    <>
      {budgetId ? <input type="hidden" name="budgetId" value={budgetId} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Total Amount
          </label>
          <input
            type="text"
            name="totalAmount"
            defaultValue={defaultTotalAmount}
            placeholder="0.00"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Current Amount
          </label>
          <input
            type="text"
            name="currentAmount"
            defaultValue={defaultCurrentAmount}
            placeholder="0.00"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Venmo URL
          </label>
          <input
            type="url"
            name="venmoUrl"
            defaultValue={defaultVenmoUrl}
            placeholder="https://account.venmo.com/u/..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
      </div>
    </>
  );
}

function StartNewBudgetForm({
  onToast,
}: {
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createBudgetAction, null);

  useEffect(() => {
    if (!state?.error) return;
    onToast(state.error);
  }, [onToast, state]);

  useEffect(() => {
    if (!state?.success) return;
    router.refresh();
  }, [router, state]);

  return (
    <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Start New Budget</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Open a fresh budget cycle with the current total, remaining amount, and Venmo link.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <BudgetFields defaultTotalAmount="" defaultCurrentAmount="" defaultVenmoUrl="" />

        {state?.success ? (
          <p className="text-sm text-[var(--color-success)]">{state.message}</p>
        ) : null}
        {state?.error && state.error !== SINGLE_OPEN_BUDGET_ERROR ? (
          <p className="text-sm text-[var(--color-error)]">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
        >
          {pending ? 'Opening...' : 'Start New Budget'}
        </button>
      </form>
    </div>
  );
}

function ActiveBudgetSection({
  budget,
  onToast,
}: {
  budget: BudgetWithLifecycle | null;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [updateState, updateAction, updatePending] = useActionState(updateBudgetAction, null);
  const [closeState, closeAction, closePending] = useActionState(closeBudgetAction, null);

  useEffect(() => {
    if (updateState?.error) onToast(updateState.error);
  }, [onToast, updateState]);

  useEffect(() => {
    if (closeState?.error) onToast(closeState.error);
  }, [closeState, onToast]);

  useEffect(() => {
    if (updateState?.success || closeState?.success) {
      router.refresh();
    }
  }, [closeState, router, updateState]);

  if (!budget) {
    return (
      <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Active Budget</h2>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          There is no active budget right now.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Active Budget</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Opened {formatBudgetDateTime(budget.last_opened_at)} with{' '}
            {formatBudgetCurrency(budget.initial_current_amount_cents)} remaining out of{' '}
            {formatBudgetCurrency(budget.initial_total_amount_cents)}.
          </p>
        </div>
        <div className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
          Open
        </div>
      </div>

      <form action={updateAction} className="mt-5 space-y-4">
        <BudgetFields
          budgetId={budget.id}
          defaultTotalAmount={(budget.total_amount_cents / 100).toFixed(2)}
          defaultCurrentAmount={(budget.current_amount_cents / 100).toFixed(2)}
          defaultVenmoUrl={budget.venmo_url}
        />

        {updateState?.success ? (
          <p className="text-sm text-[var(--color-success)]">{updateState.message}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={updatePending}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {updatePending ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </form>

      <form action={closeAction} className="mt-4">
        <input type="hidden" name="budgetId" value={budget.id} />
        <button
          type="submit"
          disabled={closePending}
          className="rounded-lg bg-[var(--color-secondary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-secondary)]/80 disabled:opacity-50"
        >
          {closePending ? 'Closing...' : 'Close Budget'}
        </button>
      </form>
    </div>
  );
}

function BudgetHistoryCard({
  budget,
  onToast,
}: {
  budget: BudgetWithLifecycle;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [updateState, updateAction, updatePending] = useActionState(updateBudgetAction, null);
  const [reopenState, reopenAction, reopenPending] = useActionState(reopenBudgetAction, null);

  useEffect(() => {
    if (updateState?.error) onToast(updateState.error);
  }, [onToast, updateState]);

  useEffect(() => {
    if (reopenState?.error) onToast(reopenState.error);
  }, [onToast, reopenState]);

  useEffect(() => {
    if (updateState?.success || reopenState?.success) {
      router.refresh();
    }
  }, [reopenState, router, updateState]);

  return (
    <article className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">
            Budget from {formatBudgetDate(budget.created_at)}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Opened {formatBudgetDateTime(budget.last_opened_at)} with{' '}
            {formatBudgetCurrency(budget.initial_current_amount_cents)} remaining out of{' '}
            {formatBudgetCurrency(budget.initial_total_amount_cents)}.
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {budget.status}
        </span>
      </div>

      <form action={updateAction} className="mt-5 space-y-4">
        <BudgetFields
          budgetId={budget.id}
          defaultTotalAmount={(budget.total_amount_cents / 100).toFixed(2)}
          defaultCurrentAmount={(budget.current_amount_cents / 100).toFixed(2)}
          defaultVenmoUrl={budget.venmo_url}
        />

        {updateState?.success ? (
          <p className="text-sm text-[var(--color-success)]">{updateState.message}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={updatePending}
            className="rounded-lg bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
          >
            {updatePending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {budget.status === 'closed' ? (
        <form action={reopenAction} className="mt-3">
          <input type="hidden" name="budgetId" value={budget.id} />
          <button
            type="submit"
            disabled={reopenPending}
            className="rounded-lg bg-[var(--color-success)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-success)]/80 disabled:opacity-50"
          >
            {reopenPending ? 'Reopening...' : 'Reopen Budget'}
          </button>
        </form>
      ) : null}

      <div className="mt-5 border-t border-[var(--color-border)]/60 pt-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Lifecycle
        </p>
        <ul className="mt-3 space-y-2">
          {budget.lifecycleEvents.length > 0 ? (
            budget.lifecycleEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--color-text)]">{formatEventLabel(event.event_type)}</span>
                <span className="text-[var(--color-text-muted)]">
                  {formatBudgetDateTime(event.created_at)}
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-[var(--color-text-muted)]">No lifecycle events recorded yet.</li>
          )}
        </ul>
      </div>
    </article>
  );
}

export default function BudgetsClient({ budgets }: BudgetsClientProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const activeBudget = budgets.find((budget) => budget.status === 'open') ?? null;
  const historyBudgets = budgets.filter((budget) => budget.id !== activeBudget?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Budgets</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Track the active budget, manage contribution links, and keep the full lifecycle history.
        </p>
      </div>

      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        variant="error"
      />

      <ActiveBudgetSection budget={activeBudget} onToast={setToastMessage} />
      <StartNewBudgetForm onToast={setToastMessage} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Budget History</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Edit past budgets, review lifecycle changes, and reopen a previous budget when needed.
          </p>
        </div>

        {historyBudgets.length > 0 ? (
          <div className="space-y-4">
            {historyBudgets.map((budget) => (
              <BudgetHistoryCard key={budget.id} budget={budget} onToast={setToastMessage} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)] shadow-lg shadow-black/20">
            No previous budgets yet.
          </div>
        )}
      </section>
    </div>
  );
}
