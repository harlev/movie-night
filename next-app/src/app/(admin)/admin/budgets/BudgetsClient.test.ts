import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const BUDGETS_CLIENT_PATH = path.join(
  process.cwd(),
  'src/app/(admin)/admin/budgets/BudgetsClient.tsx'
);

test('BudgetsClient reuses shared Toast and exposes active budget plus history controls', () => {
  assert.equal(
    existsSync(BUDGETS_CLIENT_PATH),
    true,
    'Expected src/app/(admin)/admin/budgets/BudgetsClient.tsx to exist'
  );
  const source = readFileSync(BUDGETS_CLIENT_PATH, 'utf8');

  assert.equal(source.includes("import Toast from '@/components/ui/Toast';"), true);
  assert.equal(source.includes('Start New Budget'), true);
  assert.equal(source.includes('Active Budget'), true);
  assert.equal(source.includes('Budget History'), true);
  assert.equal(source.includes('Contribute via Venmo'), false);
  assert.equal(source.includes('Reopen Budget'), true);
  assert.equal(source.includes('Close Budget'), true);
  assert.equal(source.includes('<Toast'), true);
  assert.equal(source.includes('Only one budget can be open at a time'), true);
});
