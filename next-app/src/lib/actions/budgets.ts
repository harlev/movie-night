'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createAdminLog } from '@/lib/queries/admin';
import { getUserById } from '@/lib/queries/profiles';
import { generateId } from '@/lib/utils/id';
import {
  getBudgetValidationError,
  parseBudgetCurrencyToCents,
} from '@/lib/utils/budgets';

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' as const };
  }

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') {
    return { error: 'Admin access required' as const };
  }

  return { user };
}

async function getOpenBudgetRecord(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('budgets')
    .select('id, status')
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function insertLifecycleEvent(admin: ReturnType<typeof createAdminClient>, input: {
  budgetId: string;
  actorId: string;
  eventType: 'opened' | 'closed' | 'reopened';
  createdAt: string;
}) {
  const { error } = await admin.from('budget_lifecycle_events').insert({
    id: generateId(),
    budget_id: input.budgetId,
    actor_id: input.actorId,
    event_type: input.eventType,
    created_at: input.createdAt,
  });

  if (error) {
    throw error;
  }
}

function getConflictMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  ) {
    return 'Only one budget can be open at a time';
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: string }).message === 'string' &&
    (error as { message: string }).message.includes('budgets_single_open_idx')
  ) {
    return 'Only one budget can be open at a time';
  }

  return null;
}

export async function createBudgetAction(prevState: any, formData: FormData) {
  const auth = await requireAdminUser();
  if ('error' in auth) return { error: auth.error };

  const totalAmountInput = (formData.get('totalAmount') as string | null)?.trim() ?? '';
  const currentAmountInput = (formData.get('currentAmount') as string | null)?.trim() ?? '';
  const venmoUrl = (formData.get('venmoUrl') as string | null)?.trim() ?? '';

  const validationError = getBudgetValidationError({
    totalAmountInput,
    currentAmountInput,
    venmoUrl,
  });
  if (validationError) return { error: validationError };

  const admin = createAdminClient();
  const existingOpenBudget = await getOpenBudgetRecord(admin);
  if (existingOpenBudget) {
    return { error: 'Only one budget can be open at a time' };
  }

  const budgetId = generateId();
  const now = new Date().toISOString();

  try {
    const { error } = await admin.from('budgets').insert({
      id: budgetId,
      initial_total_amount_cents: parseBudgetCurrencyToCents(totalAmountInput),
      initial_current_amount_cents: parseBudgetCurrencyToCents(currentAmountInput),
      total_amount_cents: parseBudgetCurrencyToCents(totalAmountInput),
      current_amount_cents: parseBudgetCurrencyToCents(currentAmountInput),
      venmo_url: venmoUrl,
      status: 'open',
      last_opened_at: now,
      closed_at: null,
      created_by: auth.user.id,
      updated_by: auth.user.id,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      throw error;
    }

    await insertLifecycleEvent(admin, {
      budgetId,
      actorId: auth.user.id,
      eventType: 'opened',
      createdAt: now,
    });
  } catch (error) {
    const conflictMessage = getConflictMessage(error);
    if (conflictMessage) return { error: conflictMessage };

    console.error('Failed to create budget:', error);
    return { error: 'Failed to create budget' };
  }

  await createAdminLog({
    actorId: auth.user.id,
    action: 'budget_created',
    targetType: 'budget',
    targetId: budgetId,
    details: {
      totalAmountCents: parseBudgetCurrencyToCents(totalAmountInput),
      currentAmountCents: parseBudgetCurrencyToCents(currentAmountInput),
      venmoUrl,
    },
  });

  revalidatePath('/admin/budgets');
  revalidatePath('/dashboard');

  return { success: true, message: 'Budget opened' };
}

export async function updateBudgetAction(prevState: any, formData: FormData) {
  const auth = await requireAdminUser();
  if ('error' in auth) return { error: auth.error };

  const budgetId = (formData.get('budgetId') as string | null)?.trim() ?? '';
  const totalAmountInput = (formData.get('totalAmount') as string | null)?.trim() ?? '';
  const currentAmountInput = (formData.get('currentAmount') as string | null)?.trim() ?? '';
  const venmoUrl = (formData.get('venmoUrl') as string | null)?.trim() ?? '';

  if (!budgetId) return { error: 'Budget not found' };

  const validationError = getBudgetValidationError({
    totalAmountInput,
    currentAmountInput,
    venmoUrl,
  });
  if (validationError) return { error: validationError };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('budgets')
    .update({
      total_amount_cents: parseBudgetCurrencyToCents(totalAmountInput),
      current_amount_cents: parseBudgetCurrencyToCents(currentAmountInput),
      venmo_url: venmoUrl,
      updated_by: auth.user.id,
      updated_at: now,
    })
    .eq('id', budgetId);

  if (error) {
    console.error('Failed to update budget:', error);
    return { error: 'Failed to update budget' };
  }

  await createAdminLog({
    actorId: auth.user.id,
    action: 'budget_updated',
    targetType: 'budget',
    targetId: budgetId,
    details: {
      totalAmountCents: parseBudgetCurrencyToCents(totalAmountInput),
      currentAmountCents: parseBudgetCurrencyToCents(currentAmountInput),
      venmoUrl,
    },
  });

  revalidatePath('/admin/budgets');
  revalidatePath('/dashboard');

  return { success: true, message: 'Budget updated' };
}

export async function closeBudgetAction(prevState: any, formData: FormData) {
  const auth = await requireAdminUser();
  if ('error' in auth) return { error: auth.error };

  const budgetId = (formData.get('budgetId') as string | null)?.trim() ?? '';
  if (!budgetId) return { error: 'Budget not found' };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('budgets')
    .update({
      status: 'closed',
      closed_at: now,
      updated_by: auth.user.id,
      updated_at: now,
    })
    .eq('id', budgetId)
    .eq('status', 'open');

  if (error) {
    console.error('Failed to close budget:', error);
    return { error: 'Failed to close budget' };
  }

  try {
    await insertLifecycleEvent(admin, {
      budgetId,
      actorId: auth.user.id,
      eventType: 'closed',
      createdAt: now,
    });
  } catch (eventError) {
    console.error('Failed to record budget close event:', eventError);
    return { error: 'Budget closed, but history could not be updated' };
  }

  await createAdminLog({
    actorId: auth.user.id,
    action: 'budget_closed',
    targetType: 'budget',
    targetId: budgetId,
  });

  revalidatePath('/admin/budgets');
  revalidatePath('/dashboard');

  return { success: true, message: 'Budget closed' };
}

export async function reopenBudgetAction(prevState: any, formData: FormData) {
  const auth = await requireAdminUser();
  if ('error' in auth) return { error: auth.error };

  const budgetId = (formData.get('budgetId') as string | null)?.trim() ?? '';
  if (!budgetId) return { error: 'Budget not found' };

  const admin = createAdminClient();
  const existingOpenBudget = await getOpenBudgetRecord(admin);
  if (existingOpenBudget && existingOpenBudget.id !== budgetId) {
    return { error: 'Only one budget can be open at a time' };
  }

  const now = new Date().toISOString();

  try {
    const { error } = await admin
      .from('budgets')
      .update({
        status: 'open',
        last_opened_at: now,
        closed_at: null,
        updated_by: auth.user.id,
        updated_at: now,
      })
      .eq('id', budgetId);

    if (error) {
      throw error;
    }

    await insertLifecycleEvent(admin, {
      budgetId,
      actorId: auth.user.id,
      eventType: 'reopened',
      createdAt: now,
    });
  } catch (error) {
    const conflictMessage = getConflictMessage(error);
    if (conflictMessage) return { error: conflictMessage };

    console.error('Failed to reopen budget:', error);
    return { error: 'Failed to reopen budget' };
  }

  await createAdminLog({
    actorId: auth.user.id,
    action: 'budget_reopened',
    targetType: 'budget',
    targetId: budgetId,
  });

  revalidatePath('/admin/budgets');
  revalidatePath('/dashboard');

  return { success: true, message: 'Budget reopened' };
}
