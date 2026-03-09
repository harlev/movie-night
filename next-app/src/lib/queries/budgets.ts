import { createClient } from '@/lib/supabase/server';
import type { Budget, BudgetLifecycleEvent } from '@/lib/types';

export interface BudgetWithLifecycle extends Budget {
  lifecycleEvents: BudgetLifecycleEvent[];
}

export async function getOpenBudget(): Promise<Budget | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    console.error('Failed to load open budget:', error);
    return null;
  }

  return data;
}

export async function getBudgetsWithLifecycle(): Promise<BudgetWithLifecycle[]> {
  const supabase = await createClient();
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });

  if (budgetsError) {
    console.error('Failed to load budgets:', budgetsError);
    return [];
  }

  if (!budgets || budgets.length === 0) return [];

  const budgetIds = budgets.map((budget) => budget.id);
  const { data: lifecycleEvents, error: eventsError } = await supabase
    .from('budget_lifecycle_events')
    .select('*')
    .in('budget_id', budgetIds)
    .order('created_at', { ascending: false });

  if (eventsError) {
    console.error('Failed to load budget lifecycle events:', eventsError);
    return budgets.map((budget) => ({
      ...budget,
      lifecycleEvents: [],
    }));
  }

  const eventsByBudgetId = new Map<string, BudgetLifecycleEvent[]>();

  for (const event of lifecycleEvents || []) {
    const existing = eventsByBudgetId.get(event.budget_id) || [];
    existing.push(event);
    eventsByBudgetId.set(event.budget_id, existing);
  }

  return budgets.map((budget) => ({
    ...budget,
    lifecycleEvents: eventsByBudgetId.get(budget.id) || [],
  }));
}
