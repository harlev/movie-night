import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Movie, Survey, SurveyChoice, SurveyEntry } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

type ChoiceMovie = Pick<Movie, 'id' | 'title' | 'tmdb_id' | 'metadata_snapshot' | 'watched' | 'watched_at'>;
type MovieSurveyEntry = Omit<SurveyEntry, 'movie_id'> & { movie_id: string; movie: ChoiceMovie };

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
  const { data: survey, error } = await supabase
    .from('surveys')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return survey;
}

export async function updateSurveyState(
  id: string,
  state: 'draft' | 'live' | 'frozen',
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.rpc('set_survey_state', {
    p_survey_id: id,
    p_state: state,
    p_admin_id: adminId,
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateSurveyClosingTime(id: string, closesAt: string | null, adminId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc('update_survey_closing_time', {
    p_survey_id: id,
    p_closes_at: closesAt,
    p_admin_id: adminId,
  });
  if (error) throw error;
}

export async function updateSurveyArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('surveys').update({ archived, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteSurvey(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc('delete_draft_survey', { p_survey_id: id });
  if (error) throw error;
}

export async function addSurveyEntry(data: {
  surveyId: string;
  movieId: string;
  addedBy: string;
}): Promise<SurveyEntry> {
  const admin = createAdminClient();
  const { data: entry, error } = await admin.rpc('add_movie_survey_entry', {
    p_entry_id: generateId(),
    p_survey_id: data.surveyId,
    p_movie_id: data.movieId,
    p_admin_id: data.addedBy,
  });
  if (error) throw error;
  return entry as SurveyEntry;
}

export async function addOpenSurveyOption(data: {
  surveyId: string;
  title: string;
  description: string | null;
  imagePath: string | null;
  linkUrl: string | null;
  createdByMode: 'admin' | 'responder';
  authenticatedUserId: string | null;
  addedBy: string | null;
  voterId: string | null;
}): Promise<SurveyEntry> {
  const admin = createAdminClient();
  const { data: entry, error } = await admin.rpc('add_open_survey_option', {
    p_entry_id: generateId(),
    p_survey_id: data.surveyId,
    p_title: data.title,
    p_description: data.description,
    p_image_path: data.imagePath,
    p_link_url: data.linkUrl,
    p_created_by_mode: data.createdByMode,
    p_authenticated_user_id: data.authenticatedUserId,
    p_added_by: data.addedBy,
    p_created_by_voter_id: data.voterId,
  });
  if (error) throw error;
  return entry as SurveyEntry;
}

export async function queueSurveyOptionImageCleanup(objectPath: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('survey_image_cleanup_queue').upsert(
    { object_path: objectPath, last_error: null },
    { onConflict: 'object_path' }
  );
  if (error) throw error;
}

export async function cleanupSurveyOptionImages(limit = 100): Promise<{ cleaned: number; pending: number }> {
  const admin = createAdminClient();
  const { data: queued, error: loadError } = await admin
    .from('survey_image_cleanup_queue')
    .select('object_path, attempts')
    .order('created_at')
    .limit(limit);
  if (loadError) throw loadError;
  if (!queued?.length) return { cleaned: 0, pending: 0 };

  const paths = queued.map((item) => item.object_path);
  const { error: storageError } = await admin.storage.from('survey-option-images').remove(paths);
  if (storageError) {
    await Promise.all(queued.map(async (item) => {
      const { error } = await admin
        .from('survey_image_cleanup_queue')
        .update({ attempts: item.attempts + 1, last_error: storageError.message })
        .eq('object_path', item.object_path);
      if (error) throw error;
    }));
    return { cleaned: 0, pending: queued.length };
  }

  const { error: deleteError } = await admin
    .from('survey_image_cleanup_queue')
    .delete()
    .in('object_path', paths);
  if (deleteError) throw deleteError;
  return { cleaned: paths.length, pending: 0 };
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
): Promise<MovieSurveyEntry[]> {
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
