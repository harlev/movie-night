import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateId } from '@/lib/utils/id';

export interface SuggestionData {
  movie_id: string;
  suggestion_count: number;
  current_user_suggested: boolean;
  suggesters: Array<{ user_id: string; display_name: string }>;
}

export async function getSuggestedMovies(currentUserId: string): Promise<SuggestionData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('movie_suggestions')
    .select('movie_id, user_id, profiles!user_id(display_name)')
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return [];

  // Group by movie_id
  const grouped = new Map<string, { suggesters: Array<{ user_id: string; display_name: string }>; currentUserSuggested: boolean }>();
  for (const row of data as any[]) {
    const entry = grouped.get(row.movie_id) || { suggesters: [], currentUserSuggested: false };
    entry.suggesters.push({
      user_id: row.user_id,
      display_name: row.profiles?.display_name || 'Unknown',
    });
    if (row.user_id === currentUserId) entry.currentUserSuggested = true;
    grouped.set(row.movie_id, entry);
  }

  return Array.from(grouped.entries()).map(([movie_id, val]) => ({
    movie_id,
    suggestion_count: val.suggesters.length,
    current_user_suggested: val.currentUserSuggested,
    suggesters: val.suggesters,
  }));
}

export async function addSuggestion(data: { movieId: string; userId: string }): Promise<void> {
  const supabase = await createClient();
  const id = generateId();
  const { error } = await supabase.from('movie_suggestions').insert({
    id,
    movie_id: data.movieId,
    user_id: data.userId,
  });
  if (error) throw error;
}

export async function removeSuggestion(data: { movieId: string; userId: string }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('movie_suggestions')
    .delete()
    .eq('movie_id', data.movieId)
    .eq('user_id', data.userId);
  if (error) throw error;
}

export async function removeMovieSuggestions(movieId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('movie_suggestions')
    .delete()
    .eq('movie_id', movieId);
  if (error) throw error;
}

export async function clearAllSuggestions(): Promise<number> {
  const admin = createAdminClient();
  // Get count first
  const { count } = await admin
    .from('movie_suggestions')
    .select('*', { count: 'exact', head: true });
  // Delete all
  const { error } = await admin
    .from('movie_suggestions')
    .delete()
    .neq('id', '');
  if (error) throw error;
  return count || 0;
}

export async function getSuggestionCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('movie_suggestions')
    .select('movie_id');
  if (!data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.movie_id] = (counts[row.movie_id] || 0) + 1;
  }
  return counts;
}
