import { createClient } from '@/lib/supabase/server';
import type { AdminLog } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

export async function createAdminLog(data: {
  actorId: string;
  action: string;
  targetType: 'user' | 'movie' | 'survey' | 'invite' | 'poll';
  targetId: string;
  details?: Record<string, unknown>;
}): Promise<AdminLog> {
  const supabase = await createClient();
  const id = generateId();
  const { data: log, error } = await supabase.from('admin_logs').insert({
    id,
    actor_id: data.actorId,
    action: data.action,
    target_type: data.targetType,
    target_id: data.targetId,
    details: data.details || null,
  }).select().single();
  if (error) throw error;
  return log;
}

export async function getAdminLogs(options: { limit?: number } = {}): Promise<(AdminLog & { actorName: string })[]> {
  const supabase = await createClient();
  let query = supabase
    .from('admin_logs')
    .select('*, profiles!actor_id(display_name)')
    .order('created_at', { ascending: false });

  if (options.limit) query = query.limit(options.limit);

  const { data } = await query;
  return (data || []).map((l: any) => ({
    ...l,
    actorName: l.profiles?.display_name || 'Unknown',
  }));
}
