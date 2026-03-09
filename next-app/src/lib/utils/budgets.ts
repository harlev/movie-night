const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatBudgetCurrency(amountCents: number): string {
  return USD_FORMATTER.format((amountCents || 0) / 100);
}

export function parseBudgetCurrencyToCents(value: string): number | null {
  const normalized = value.replace(/[$,\s]/g, '').trim();
  if (!normalized) return null;
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}

export function isValidBudgetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getBudgetValidationError(input: {
  totalAmountInput: string;
  currentAmountInput: string;
  venmoUrl: string;
}): string | null {
  const totalAmountCents = parseBudgetCurrencyToCents(input.totalAmountInput);
  if (totalAmountCents === null) return 'Please enter a valid total amount';
  if (totalAmountCents < 0) return 'Total amount cannot be negative';

  const currentAmountCents = parseBudgetCurrencyToCents(input.currentAmountInput);
  if (currentAmountCents === null) return 'Please enter a valid current amount';
  if (currentAmountCents < 0) return 'Current amount cannot be negative';
  if (currentAmountCents > totalAmountCents) {
    return 'Current amount cannot exceed total amount';
  }

  const venmoUrl = input.venmoUrl.trim();
  if (!venmoUrl) return 'Please enter a Venmo URL';
  if (!isValidBudgetUrl(venmoUrl)) return 'Please enter a valid Venmo URL';

  return null;
}

export function getBudgetProgress(input: {
  totalAmountCents: number;
  currentAmountCents: number;
  initialTotalAmountCents: number;
  initialCurrentAmountCents: number;
}) {
  const total = Math.max(0, input.totalAmountCents);
  const current = Math.min(Math.max(0, input.currentAmountCents), total);
  const initialTotal = Math.max(0, input.initialTotalAmountCents);
  const initialCurrent = Math.min(Math.max(0, input.initialCurrentAmountCents), initialTotal);

  return {
    percentRemaining: total > 0 ? Math.round((current / total) * 100) : 0,
    spentAmountCents: Math.max(0, total - current),
    initialSpentAmountCents: Math.max(0, initialTotal - initialCurrent),
  };
}

export function formatBudgetDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatBudgetDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
