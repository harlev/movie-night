import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Movie, Survey, SurveyChoice, SurveyEntry } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

type ChoiceMovie = Pick<Movie, 'id' | 'title' | 'tmdb_id' | 'metadata_snapshot' | 'watched' | 'watched_at'>;

interface ChoiceEntryRow {
  id: string;
  survey_id: string;
  movie_id: string | null;
  title: string | null;
  description: string | null;
  image_path: string | null;
  link_url: string | null;
  created_by_mode: 'admin' | 'responder';
}

export function mapSurveyEntryToChoice(
  entry: ChoiceEntryRow,
  movie: ChoiceMovie | null,
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
): SurveyChoice {
  const posterPath = movie?.metadata_snapshot?.posterPath;
  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w185${posterPath}`
    : entry.image_path && supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/survey-option-images/${entry.image_path}`
      : null;

  return {
    id: entry.id,
    surveyId: entry.survey_id,
    title: movie?.title ?? entry.title ?? 'Untitled option',
    description: movie?.metadata_snapshot?.overview ?? entry.description,
    imageUrl,
    linkUrl: entry.link_url,
    movie,
    createdByMode: entry.created_by_mode,
  };
}

export async function createSurvey(data: {
  title: string;
  description?: string;
  maxRankN?: number;
  closesAt?: string;
  surveyType?: Survey['survey_type'];
  allowResponderOptions?: boolean;
  isAnonymous?: boolean;
  membersOnly?: boolean;
}): Promise<Survey> {
  const supabase = await createClient();
  const id = generateId();
  const { data: survey, error } = await supabase.from('surveys').insert({
    id,
    title: data.title,
    description: data.description || null,
    max_rank_n: data.maxRankN || 3,
    closes_at: data.closesAt || null,
    survey_type: data.surveyType ?? 'movie',
    allow_responder_options: data.allowResponderOptions ?? false,
    is_anonymous: data.isAnonymous ?? false,
    members_only: data.membersOnly ?? true,
  }).select().single();
  if (error) throw error;
  return survey;
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('surveys').select('*').eq('id', id).single();
  return data;
}

export async function getAllSurveys(): Promise<Survey[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getLiveSurvey(): Promise<Survey | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('surveys')
    .select('*')
    .eq('state', 'live')
    .eq('survey_type', 'movie')
    .limit(1)
    .single();
  return data;
}

export async function updateSurvey(
  id: string,
  data: Partial<Pick<Survey,
    'title' | 'description' | 'max_rank_n' | 'closes_at' | 'allow_responder_options' | 'is_anonymous' | 'members_only'>>
): Promise<Survey | null> {
  const supabase = await createClient();
  const { data: survey } = await supabase
    .from('surveys')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return survey;
}

export async function updateSurveyState(
  id: string,
  state: 'draft' | 'live' | 'frozen'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const survey = await getSurveyById(id);
  if (!survey) return { success: false, error: 'Survey not found' };

  if (state === 'live' && survey.survey_type === 'movie') {
    const existing = await getLiveSurvey();
    if (existing && existing.id !== id) return { success: false, error: 'Another movie survey is already live' };
  }

  const updates: Record<string, unknown> = { state, updated_at: new Date().toISOString() };
  if (state === 'frozen') updates.frozen_at = new Date().toISOString();
  const { error } = await supabase.from('surveys').update(updates).eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateSurveyArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from('surveys').update({ archived, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function deleteSurvey(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('surveys').delete().eq('id', id);
}

export async function addSurveyEntry(data: {
  surveyId: string;
  movieId: string;
  addedBy: string;
}): Promise<SurveyEntry> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('survey_entries')
    .select('*')
    .eq('survey_id', data.surveyId)
    .eq('movie_id', data.movieId)
    .single();

  if (existing) {
    if (existing.removed_at) {
      const { data: restored, error } = await supabase
        .from('survey_entries')
        .update({ removed_at: null, added_by: data.addedBy })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return restored;
    }
    throw new Error('Movie already in survey');
  }

  const { data: entry, error } = await supabase.from('survey_entries').insert({
    id: generateId(),
    survey_id: data.surveyId,
    movie_id: data.movieId,
    added_by: data.addedBy,
    created_by_mode: 'admin',
  }).select().single();
  if (error) throw error;
  return entry;
}

export async function addOpenSurveyOption(data: {
  surveyId: string;
  title: string;
  description: string | null;
  imagePath: string | null;
  linkUrl: string | null;
  createdByMode: 'admin' | 'responder';
  addedBy: string | null;
  voterId: string | null;
}): Promise<SurveyEntry> {
  const admin = createAdminClient();
  const { data: entry, error } = await admin.from('survey_entries').insert({
    id: generateId(),
    survey_id: data.surveyId,
    movie_id: null,
    title: data.title,
    description: data.description,
    image_path: data.imagePath,
    link_url: data.linkUrl,
    created_by_mode: data.createdByMode,
    added_by: data.addedBy,
    created_by_voter_id: data.voterId,
  }).select().single();
  if (error) throw error;
  return entry;
}

export async function removeSurveyEntry(entryId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('survey_entries').update({ removed_at: new Date().toISOString() }).eq('id', entryId);
}

export async function removeSurveyOption(entryId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: entry } = await admin.from('survey_entries').select('image_path').eq('id', entryId).single();
  const { error } = await admin
    .from('survey_entries')
    .update({ removed_at: new Date().toISOString() })
    .eq('id', entryId);
  if (error) throw error;
  if (entry?.image_path) {
    await admin.storage.from('survey-option-images').remove([entry.image_path]);
  }
}

export async function getSurveyChoices(surveyId: string): Promise<SurveyChoice[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('survey_entries')
    .select('*, movies!movie_id(id, title, tmdb_id, metadata_snapshot, watched, watched_at)')
    .eq('survey_id', surveyId)
    .is('removed_at', null)
    .order('created_at');
  if (error) throw error;
  return (data || []).map((entry: any) => mapSurveyEntryToChoice(entry, entry.movies ?? null));
}

export async function getSurveyEntries(
  surveyId: string
): Promise<Array<SurveyEntry & { movie: ChoiceMovie }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('survey_entries')
    .select('*, movies!movie_id(id, title, tmdb_id, metadata_snapshot, watched, watched_at)')
    .eq('survey_id', surveyId)
    .not('movie_id', 'is', null)
    .is('removed_at', null)
    .order('created_at');
  return (data || []).map((entry: any) => ({ ...entry, movie: entry.movies }));
}

export async function getAdminSurveyOptionCount(surveyId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from('survey_entries')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
    .eq('created_by_mode', 'admin')
    .is('removed_at', null);
  return count ?? 0;
}

export async function finalizeExpiredSurveys(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('finalize_expired_surveys');
  if (error) throw error;
  return (data ?? []) as string[];
}
