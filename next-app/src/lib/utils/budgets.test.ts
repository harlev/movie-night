import assert from 'node:assert/strict';
import test from 'node:test';

test('budget helpers format currency, validate URL, and compute progress metrics', async () => {
  let budgetUtils: typeof import('./budgets.ts');

  try {
    budgetUtils = await import('./budgets.ts');
  } catch {
    assert.fail('Expected src/lib/utils/budgets.ts to exist');
  }

  assert.equal(budgetUtils.formatBudgetCurrency(12_345), '$123.45');
  assert.equal(budgetUtils.parseBudgetCurrencyToCents('42.50'), 4_250);
  assert.equal(budgetUtils.parseBudgetCurrencyToCents('$1,250.99'), 125_099);
  assert.equal(
    budgetUtils.getBudgetValidationError({
      totalAmountInput: '100.00',
      currentAmountInput: '125.00',
      venmoUrl: 'https://account.venmo.com/u/movie-night',
    }),
    'Current amount cannot exceed total amount'
  );
  assert.equal(
    budgetUtils.getBudgetProgress({
      totalAmountCents: 30_000,
      currentAmountCents: 18_000,
      initialTotalAmountCents: 25_000,
      initialCurrentAmountCents: 20_000,
    }).percentRemaining,
    60
  );
  assert.equal(
    budgetUtils.isValidBudgetUrl('https://account.venmo.com/u/movie-night'),
    true
  );
});
