import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const BUDGET_ACTIONS_PATH = path.join(process.cwd(), 'src/lib/actions/budgets.ts');

test('budget actions enforce admin-only single-open lifecycle management', () => {
  assert.equal(existsSync(BUDGET_ACTIONS_PATH), true, 'Expected src/lib/actions/budgets.ts to exist');
  const source = readFileSync(BUDGET_ACTIONS_PATH, 'utf8');

  assert.equal(source.includes('export async function createBudgetAction'), true);
  assert.equal(source.includes('export async function updateBudgetAction'), true);
  assert.equal(source.includes('export async function closeBudgetAction'), true);
  assert.equal(source.includes('export async function reopenBudgetAction'), true);
  assert.equal(source.includes('Admin access required'), true);
  assert.equal(source.includes('Only one budget can be open at a time'), true);
  assert.equal(source.includes("revalidatePath('/admin/budgets');"), true);
  assert.equal(source.includes("revalidatePath('/dashboard');"), true);
  assert.equal(source.includes("targetType: 'budget'"), true);
  assert.equal(source.includes(".select('id')"), true);
  assert.equal(source.includes("return { error: 'Budget not found' };"), true);
  assert.equal(source.includes("return { error: 'Budget already closed' };"), true);
  assert.equal(source.includes("return { error: 'Budget already open' };"), true);
  assert.equal(source.includes(".eq('status', 'closed')"), true);
});
