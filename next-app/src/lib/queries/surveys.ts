import { createClient } from '@/lib/supabase/server';
import type { Survey, SurveyEntry, Movie } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

export async function createSurvey(data: {
  title: string;
  description?: string;
  maxRankN?: number;
  closesAt?: string;
}): Promise<Survey> {
  const supabase = await createClient();
  const id = generateId();
  const { data: survey, error } = await supabase.from('surveys').insert({
    id,
    title: data.title,
    description: data.description || null,
    max_rank_n: data.maxRankN || 3,
    closes_at: data.closesAt || null,
  }).select().single();
  if (error) throw error;
  return survey;
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('surveys').select('*').eq('id', id).single();
  return data;
}

export async function getAllSurveys(): Promise<Survey[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getLiveSurvey(): Promise<Survey | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('surveys').select('*').eq('state', 'live').limit(1).single();
  return data;
}

export async function updateSurvey(id: string, data: Partial<Pick<Survey, 'title' | 'description' | 'max_rank_n' | 'closes_at'>>): Promise<Survey | null> {
  const supabase = await createClient();
  const { data: survey } = await supabase.from('surveys').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return survey;
}

export async function updateSurveyState(id: string, state: 'draft' | 'live' | 'frozen'): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (state === 'live') {
    const existing = await getLiveSurvey();
    if (existing && existing.id !== id) {
      return { success: false, error: 'Another survey is already live' };
    }
  }

  const updates: Record<string, any> = { state, updated_at: new Date().toISOString() };
  if (state === 'frozen') {
    updates.frozen_at = new Date().toISOString();
  }

  const { error } = await supabase.from('surveys').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateSurveyArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from('surveys').update({ archived, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function deleteSurvey(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('surveys').delete().eq('id', id);
}

export async function addSurveyEntry(data: { surveyId: string; movieId: string; addedBy: string }): Promise<SurveyEntry> {
  const supabase = await createClient();

  // Check if entry exists (even if removed)
  const { data: existing } = await supabase
    .from('survey_entries')
    .select('*')
    .eq('survey_id', data.surveyId)
    .eq('movie_id', data.movieId)
    .single();

  if (existing) {
    if (existing.removed_at) {
      const { data: updated, error } = await supabase
        .from('survey_entries')
        .update({ removed_at: null, added_by: data.addedBy })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    }
    throw new Error('Movie already in survey');
  }

  const id = generateId();
  const { data: entry, error } = await supabase.from('survey_entries').insert({
    id,
    survey_id: data.surveyId,
    movie_id: data.movieId,
    added_by: data.addedBy,
  }).select().single();
  if (error) throw error;
  return entry;
}

export async function removeSurveyEntry(entryId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('survey_entries').update({ removed_at: new Date().toISOString() }).eq('id', entryId);
}

export async function getSurveyEntries(surveyId: string): Promise<(SurveyEntry & { movie: Pick<Movie, 'id' | 'title' | 'tmdb_id' | 'metadata_snapshot'> })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('survey_entries')
    .select('*, movies!movie_id(id, title, tmdb_id, metadata_snapshot)')
    .eq('survey_id', surveyId)
    .is('removed_at', null)
    .order('created_at');
  return (data || []).map((e: any) => ({
    ...e,
    movie: e.movies,
  }));
}
