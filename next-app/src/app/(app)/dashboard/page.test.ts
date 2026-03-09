import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const DASHBOARD_PAGE_PATH = path.join(process.cwd(), 'src/app/(app)/dashboard/page.tsx');

test('dashboard header uses Next Movie Night label', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('Next Movie Night'), true);
  assert.equal(source.includes('Now Showing'), false);
  assert.equal(source.includes('<h1 className="sr-only">Dashboard</h1>'), true);
  assert.equal(source.includes('Welcome back to F.C Movie Night'), false);
});

test('dashboard header renders computed next movie night date from site settings', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('const nextMovieNightDateLabel = getNextMovieNightLabel({'), true);
  assert.equal(source.includes('overrideDate: siteSettings?.next_movie_night_override_date ?? null'), true);
  assert.equal(source.includes('{nextMovieNightDateLabel}'), true);
});

test('dashboard header uses a unified next movie night card instead of separate next movie panel', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('const nextMovie = siteSettings?.next_movie ?? null;'), true);
  assert.equal(source.includes('Next up'), false);
  assert.equal(source.includes('Selected from the latest completed survey'), false);
  assert.equal(/>\s*Next Movie\s*</.test(source), false);
  assert.equal(source.includes('md:grid-cols-[minmax(0,1fr)_auto]'), true);
  assert.equal(source.includes('md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]'), false);
  assert.equal(source.includes('href={`/movies/${nextMovie.id}`}'), true);
  assert.equal(source.includes('aria-label={`View details for ${nextMovie.title}`}'), true);
  assert.equal(source.includes('focus-visible:ring-[var(--color-primary)]/60'), true);
  assert.equal(source.includes('alt={`Poster for ${nextMovie.title}`}'), true);
  assert.equal(source.includes('{nextMovie && ('), false);
});

test('dashboard renders the movie night fund as remaining-balance UI', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('Movie Night Fund'), true);
  assert.equal(source.includes('Community Budget'), false);
  assert.equal(source.includes('Contribute via Venmo'), true);
  assert.equal(source.includes('rel="noopener noreferrer"'), true);
  assert.equal(source.includes(')} left'), true);
  assert.equal(source.includes('Raised '), true);
  assert.equal(source.includes(' total'), true);
  assert.equal(source.includes('Spent '), false);
  assert.equal(source.includes('Opened:'), false);
  assert.equal(source.includes('function formatBudgetCurrencyWholeDollars(amountCents: number): string {'), true);
  assert.equal(source.includes('function formatBudgetOpenSinceDate(value: string): string {'), true);
  assert.equal(source.includes("new Intl.NumberFormat('en-US', {"), true);
  assert.equal(source.includes("new Intl.DateTimeFormat('en-US', {"), true);
  assert.equal(source.includes("currency: 'USD'"), true);
  assert.equal(source.includes('minimumFractionDigits: 0'), true);
  assert.equal(source.includes('maximumFractionDigits: 0'), true);
  assert.equal(source.includes("month: 'short'"), true);
  assert.equal(source.includes("day: 'numeric'"), true);
  assert.equal(source.includes("timeZone: 'UTC'"), true);
  assert.equal(source.includes('budgetRemainingLabel'), true);
  assert.equal(source.includes('budgetRemainingAmountLabel'), true);
  assert.equal(source.includes('budgetOpenSinceLabel'), true);
  assert.equal(source.includes('openBudget ? formatBudgetOpenSinceDate(openBudget.last_opened_at) :'), true);
  assert.equal(source.includes('openBudget ? `${formatBudgetCurrencyWholeDollars(openBudget.current_amount_cents)} left` :'), true);
  assert.equal(source.includes('openBudget ? formatBudgetCurrencyWholeDollars(openBudget.current_amount_cents) :'), true);
  assert.equal(
    source.includes(
      'openBudget ? `Raised ${formatBudgetCurrencyWholeDollars(openBudget.total_amount_cents)} total • Open since ${budgetOpenSinceLabel}` :'
    ),
    true
  );
  assert.equal(source.includes('formatBudgetCurrency(openBudget.current_amount_cents)'), false);
  assert.equal(source.includes('formatBudgetCurrency(openBudget.total_amount_cents)'), false);
  assert.equal(source.includes('BudgetConsumptionBar'), true);
  assert.equal(source.includes('<BudgetConsumptionBar'), true);
  assert.equal(source.includes('budgetRemainingLabel={budgetRemainingAmountLabel}'), true);
  assert.equal(source.includes('{budgetRemainingLabel}'), true);
  assert.equal(source.includes('budgetSpentLabel'), false);
  assert.equal(source.includes('<p className="text-xs text-[var(--color-text-muted)]">{budgetSpentLabel}</p>'), false);
  assert.equal(source.includes('spentWidthPercent'), true);
  assert.equal(source.includes('remainingWidthPercent'), true);
  assert.equal(source.includes('h-[22px] overflow-hidden rounded-full'), true);
  assert.equal(source.includes('sm:h-[25px]'), true);
  assert.equal(source.includes('h-7 overflow-hidden rounded-full'), false);
  assert.equal(
    source.includes('bg-[linear-gradient(90deg,rgba(62,51,39,0.99),rgba(40,33,26,0.99))]'),
    false
  );
  assert.equal(source.includes('style={{ width: `${budgetSegments.remainingWidthPercent}%` }}'), false);
  assert.equal(source.includes('style={{ width: `${budgetSegments.spentWidthPercent}%` }}'), false);
  assert.equal(source.includes('h-2 w-2 rounded-full'), false);
  assert.equal(source.includes('Total Movies'), false);
  assert.equal(source.includes('Community Members'), false);
  assert.equal(source.includes('Surveys Completed'), false);
  assert.equal(source.includes('Initial Total'), false);
  assert.equal(source.includes('Current Total'), false);
  assert.equal(/>\s*Remaining\s*</.test(source), false);
  assert.equal(source.includes('Started at'), false);
  assert.equal(source.includes('animate-budget-fill h-full rounded-full'), false);
  assert.equal(source.includes('style={{ width: `${budgetProgress.percentRemaining}%` }}'), false);
  assert.equal(source.includes('<span>{budgetProgress.percentRemaining}%</span>'), false);
  assert.equal(source.includes('total remaining'), false);
  assert.equal(source.includes('No active budget yet.'), true);
});

test('dashboard renders voting panel before the movie night fund panel', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  const liveSurveySectionIndex = source.indexOf('{/* Live Survey */}');
  const movieNightFundSectionIndex = source.indexOf('{/* Movie Night Fund */}');

  assert.notEqual(liveSurveySectionIndex, -1);
  assert.notEqual(movieNightFundSectionIndex, -1);
  assert.equal(liveSurveySectionIndex < movieNightFundSectionIndex, true);
});
