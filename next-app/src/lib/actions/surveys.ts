'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSurvey, updateSurvey, updateSurveyState, updateSurveyArchived, deleteSurvey, addSurveyEntry, removeSurveyEntry, getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { removeBallotMovie } from '@/lib/queries/ballots';

export async function createSurveyAction(prevState: any, formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const maxRankNStr = formData.get('maxRankN') as string || '3';

  if (!title) return { error: 'Title is required', title: '', description: '', maxRankN: maxRankNStr };
  if (title.length > 100) return { error: 'Title must be less than 100 characters', title, description, maxRankN: maxRankNStr };

  const maxRankN = parseInt(maxRankNStr, 10);
  if (isNaN(maxRankN) || maxRankN < 1 || maxRankN > 10) {
    return { error: 'Max rank must be between 1 and 10', title, description, maxRankN: maxRankNStr };
  }

  const survey = await createSurvey({ title, description: description || undefined, maxRankN });
  redirect(`/admin/surveys/${survey.id}`);
}

export async function updateSurveyAction(prevState: any, formData: FormData) {
  const surveyId = formData.get('surveyId') as string;
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const maxRankNStr = formData.get('maxRankN') as string || '3';

  if (!title) return { error: 'Title is required' };

  const maxRankN = parseInt(maxRankNStr, 10);
  if (isNaN(maxRankN) || maxRankN < 1 || maxRankN > 10) return { error: 'Max rank must be between 1 and 10' };

  await updateSurvey(surveyId, { title, description: description || null, max_rank_n: maxRankN });
  revalidatePath(`/admin/surveys/${surveyId}`);
  return { success: true, message: 'Survey updated' };
}

export async function changeSurveyStateAction(prevState: any, formData: FormData) {
  const surveyId = formData.get('surveyId') as string;
  const newState = formData.get('state') as 'draft' | 'live' | 'frozen';

  if (!['draft', 'live', 'frozen'].includes(newState)) return { error: 'Invalid state' };

  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state === 'frozen') return { error: 'Cannot change state of frozen survey' };
  if (survey.state === 'draft' && newState === 'frozen') return { error: 'Cannot freeze a draft survey directly' };

  if (newState === 'live') {
    const entries = await getSurveyEntries(surveyId);
    if (entries.length === 0) return { error: 'Cannot go live without any movies' };
  }

  const result = await updateSurveyState(surveyId, newState);
  if (!result.success) return { error: result.error };
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath('/dashboard');
  return { success: true, message: `Survey is now ${newState}` };
}

export async function addMovieToSurveyAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const surveyId = formData.get('surveyId') as string;
  const movieId = formData.get('movieId') as string;
  if (!movieId) return { error: 'Movie ID required' };

  try {
    await addSurveyEntry({ surveyId, movieId, addedBy: user.id });
    revalidatePath(`/admin/surveys/${surveyId}`);
    return { success: true, message: 'Movie added' };
  } catch {
    return { error: 'Movie already in survey' };
  }
}

export async function removeMovieFromSurveyAction(prevState: any, formData: FormData) {
  const surveyId = formData.get('surveyId') as string;
  const entryId = formData.get('entryId') as string;
  const movieId = formData.get('movieId') as string;

  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state === 'frozen') return { error: 'Cannot remove movies from frozen survey' };

  if (survey.state === 'live' && movieId) {
    const affected = await removeBallotMovie(surveyId, movieId);
    await removeSurveyEntry(entryId);
    revalidatePath(`/admin/surveys/${surveyId}`);
    return { success: true, message: `Movie removed. ${affected} ballot(s) affected.` };
  }

  await removeSurveyEntry(entryId);
  revalidatePath(`/admin/surveys/${surveyId}`);
  return { success: true, message: 'Movie removed' };
}

export async function deleteSurveyAction(prevState: any, formData: FormData) {
  const surveyId = formData.get('surveyId') as string;
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'draft') return { error: 'Can only delete draft surveys' };

  await deleteSurvey(surveyId);
  redirect('/admin/surveys');
}

export async function toggleSurveyArchivedAction(prevState: any, formData: FormData) {
  const surveyId = formData.get('surveyId') as string;
  const archived = formData.get('archived') === 'true';

  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'frozen') return { error: 'Can only archive frozen surveys' };

  await updateSurveyArchived(surveyId, archived);
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath('/admin/surveys');
  revalidatePath('/history');
  revalidatePath('/leaderboard');
  return { success: true, message: archived ? 'Survey archived' : 'Survey unarchived' };
}
