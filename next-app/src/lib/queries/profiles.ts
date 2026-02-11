import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export async function getUserById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data;
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).single();
  return data;
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function updateUser(id: string, updates: Partial<Pick<Profile, 'display_name' | 'role' | 'status'>>): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}
