'use server';

import { createClient } from '@/lib/supabase/server';
import { createInvite, expireInvite } from '@/lib/queries/invites';
import { createAdminLog } from '@/lib/queries/admin';

export async function createInviteAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const expiresInDaysStr = formData.get('expiresInDays') as string || '7';
  const expiresInDays = parseInt(expiresInDaysStr, 10);
  if (isNaN(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
    return { error: 'Expiration must be between 1 and 30 days' };
  }

  const invite = await createInvite(user.id, expiresInDays);

  await createAdminLog({
    actorId: user.id,
    action: 'invite_created',
    targetType: 'invite',
    targetId: invite.id,
    details: { code: invite.code, expiresInDays },
  });

  return { success: true, invite };
}

export async function expireInviteAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const inviteId = formData.get('inviteId') as string;
  if (!inviteId) return { error: 'Invalid request' };

  await expireInvite(inviteId);

  await createAdminLog({
    actorId: user.id,
    action: 'invite_expired',
    targetType: 'invite',
    targetId: inviteId,
  });

  return { success: true, message: 'Invite expired' };
}
