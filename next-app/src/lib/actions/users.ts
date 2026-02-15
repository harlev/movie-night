'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { createAdminLog } from '@/lib/queries/admin';

export async function updateProfileAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const displayName = (formData.get('displayName') as string)?.trim();
  if (!displayName || displayName.length < 1 || displayName.length > 50) {
    return { error: 'Display name must be between 1 and 50 characters' };
  }

  // Try updating via user's own auth context first (RLS)
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    // Fall back to admin client if RLS blocks self-update on display_name
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (adminError) return { error: 'Failed to update profile' };
  }

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
  return { success: true, message: 'Display name updated' };
}

export async function updateUserNameAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const userId = formData.get('userId') as string;
  const displayName = (formData.get('displayName') as string)?.trim();

  if (!userId || !displayName) return { error: 'Name is required' };
  if (displayName.length > 50) return { error: 'Name must be 50 characters or less' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { error: 'Failed to update name' };

  await createAdminLog({
    actorId: currentUser.id,
    action: 'user_name_changed',
    targetType: 'user',
    targetId: userId,
    details: { newName: displayName },
  });

  revalidatePath('/admin/users');
  return { success: true, message: 'Name updated' };
}

export async function updateUserStatusAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const userId = formData.get('userId') as string;
  const status = formData.get('status') as 'active' | 'disabled';

  if (!userId || !['active', 'disabled'].includes(status)) return { error: 'Invalid request' };
  if (userId === currentUser.id && status === 'disabled') return { error: 'Cannot disable your own account' };

  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error || !user) return { error: 'User not found' };

  await createAdminLog({
    actorId: currentUser.id,
    action: status === 'disabled' ? 'user_disabled' : 'user_enabled',
    targetType: 'user',
    targetId: userId,
    details: { newStatus: status },
  });

  revalidatePath('/admin/users');
  return { success: true, message: `User ${status === 'disabled' ? 'disabled' : 'enabled'}` };
}

export async function updateUserRoleAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const userId = formData.get('userId') as string;
  const role = formData.get('role') as 'admin' | 'member';

  if (!userId || !['admin', 'member'].includes(role)) return { error: 'Invalid request' };
  if (userId === currentUser.id && role === 'member') return { error: 'Cannot remove your own admin role' };

  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error || !user) return { error: 'User not found' };

  await createAdminLog({
    actorId: currentUser.id,
    action: 'role_changed',
    targetType: 'user',
    targetId: userId,
    details: { newRole: role },
  });

  revalidatePath('/admin/users');
  return { success: true, message: `User role updated to ${role}` };
}
