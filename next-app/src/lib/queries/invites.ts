import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Invite, InviteUse } from '@/lib/types';
import { generateId, generateInviteCode } from '@/lib/utils/id';

export async function createInvite(createdBy: string, expiresInDays: number = 7, role: 'member' | 'viewer' = 'member'): Promise<Invite> {
  const supabase = await createClient();
  const id = generateId();
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const { data: invite, error } = await supabase.from('invites').insert({
    id,
    code,
    created_by: createdBy,
    expires_at: expiresAt.toISOString(),
    role,
  }).select().single();
  if (error) throw error;
  return invite;
}

export async function validateInviteCode(code: string): Promise<{ valid: boolean; error?: string; invite?: Invite }> {
  // Use admin client since this is called before authentication (during signup)
  const admin = createAdminClient();
  const { data: invite } = await admin.from('invites').select('*').eq('code', code.toUpperCase()).single();

  if (!invite) return { valid: false, error: 'Invalid invite code' };
  if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: 'This invite code has expired' };
  }
  return { valid: true, invite };
}

export async function recordInviteUse(inviteId: string, userId: string): Promise<void> {
  // Use admin client since this is called during signup before session is established
  const admin = createAdminClient();
  const id = generateId();
  await admin.from('invite_uses').insert({ id, invite_id: inviteId, user_id: userId });
  const { data } = await admin.from('invites').select('use_count').eq('id', inviteId).single();
  await admin.from('invites').update({ use_count: (data?.use_count || 0) + 1 }).eq('id', inviteId);
}

export async function getAllInvites(): Promise<Invite[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function expireInvite(inviteId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('invites').update({ status: 'expired' }).eq('id', inviteId);
}

export async function getInviteUsers(inviteId: string): Promise<Array<{ userId: string; displayName: string; usedAt: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('invite_uses')
    .select('user_id, used_at, profiles!user_id(display_name)')
    .eq('invite_id', inviteId);
  return (data || []).map((u: any) => ({
    userId: u.user_id,
    displayName: u.profiles?.display_name || 'Unknown',
    usedAt: u.used_at,
  }));
}
