import type { Metadata } from 'next';
import BudgetsClient from './BudgetsClient';
import { getBudgetsWithLifecycle } from '@/lib/queries/budgets';

export const metadata: Metadata = {
  title: 'Budgets - Admin',
};

export default async function AdminBudgetsPage() {
  const budgets = await getBudgetsWithLifecycle();

  return <BudgetsClient budgets={budgets} />;
}
