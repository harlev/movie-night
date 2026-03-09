import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const BUDGET_CONSUMPTION_BAR_PATH = path.join(
  process.cwd(),
  'src/app/(app)/dashboard/BudgetConsumptionBar.tsx'
);

test('budget consumption bar animates once when entering view and respects reduced motion', () => {
  assert.equal(
    existsSync(BUDGET_CONSUMPTION_BAR_PATH),
    true,
    'Expected src/app/(app)/dashboard/BudgetConsumptionBar.tsx to exist'
  );

  const source = readFileSync(BUDGET_CONSUMPTION_BAR_PATH, 'utf8');

  assert.equal(source.includes("'use client';"), true);
  assert.equal(source.includes('window.matchMedia('), true);
  assert.equal(source.includes('prefers-reduced-motion: reduce'), true);
  assert.equal(source.includes('IntersectionObserver'), true);
  assert.equal(source.includes('setHasAnimated(true)'), true);
  assert.equal(source.includes('threshold: 0.35'), true);
  assert.equal(
    source.includes('bg-[linear-gradient(90deg,rgba(62,51,39,0.99),rgba(40,33,26,0.99))]'),
    true
  );
  assert.equal(source.includes('transition-[width]'), true);
  assert.equal(source.includes('duration-[800ms]'), true);
  assert.equal(source.includes('ease-out'), true);
  assert.equal(source.includes('safeRemainingWidthPercent : 100'), true);
  assert.equal(source.includes('safeSpentWidthPercent : 0'), true);
  assert.equal(source.includes('{budgetRemainingLabel}'), true);
});
