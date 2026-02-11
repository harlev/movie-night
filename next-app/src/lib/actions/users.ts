'use server';

import { createClient } from '@/lib/supabase/server';
import { updateUser } from '@/lib/queries/profiles';
import { createAdminLog } from '@/lib/queries/admin';

export async function updateUserStatusAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const userId = formData.get('userId') as string;
  const status = formData.get('status') as 'active' | 'disabled';

  if (!userId || !['active', 'disabled'].includes(status)) return { error: 'Invalid request' };
  if (userId === currentUser.id && status === 'disabled') return { error: 'Cannot disable your own account' };

  const user = await updateUser(userId, { status });
  if (!user) return { error: 'User not found' };

  await createAdminLog({
    actorId: currentUser.id,
    action: status === 'disabled' ? 'user_disabled' : 'user_enabled',
    targetType: 'user',
    targetId: userId,
    details: { newStatus: status },
  });

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

  const user = await updateUser(userId, { role });
  if (!user) return { error: 'User not found' };

  await createAdminLog({
    actorId: currentUser.id,
    action: 'role_changed',
    targetType: 'user',
    targetId: userId,
    details: { newRole: role },
  });

  return { success: true, message: `User role updated to ${role}` };
}
