'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserById } from '@/lib/queries/profiles';
import { createAdminLog } from '@/lib/queries/admin';
import { addSuggestion, removeSuggestion, removeMovieSuggestions, clearAllSuggestions } from '@/lib/queries/suggestions';
import { addSurveyEntry } from '@/lib/queries/surveys';
import { getWatchedNomineeWarningToast } from '@/lib/utils/watchedMovies';

export async function toggleSuggestionAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role === 'viewer') return { error: 'Viewers cannot suggest movies' };

  const movieId = formData.get('movieId') as string;
  const action = formData.get('action') as string;
  if (!movieId || !['add', 'remove'].includes(action)) return { error: 'Invalid request' };

  try {
    let warning: string | null = null;

    if (action === 'add') {
      const { data: movie, error: movieError } = await supabase
        .from('movies')
        .select('title, watched')
        .eq('id', movieId)
        .single();
      if (movieError || !movie) return { error: 'Movie not found' };

      await addSuggestion({ movieId, userId: user.id });
      if (movie.watched) {
        warning = getWatchedNomineeWarningToast(movie.title);
      }
    } else {
      await removeSuggestion({ movieId, userId: user.id });
    }

    revalidatePath('/movies');
    revalidatePath(`/movies/${movieId}`);
    return { success: true, warning };
  } catch (error: any) {
    return { error: 'Failed to update suggestion' };
  }
}

export async function adminRemoveMovieSuggestionAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const movieId = formData.get('movieId') as string;
  const movieTitle = formData.get('movieTitle') as string;
  if (!movieId) return { error: 'Invalid request' };

  try {
    await removeMovieSuggestions(movieId);
    await createAdminLog({
      actorId: user.id,
      action: 'suggestion_removed',
      targetType: 'suggestion',
      targetId: movieId,
      details: { movieTitle },
    });
    revalidatePath('/movies');
    return { success: true };
  } catch {
    return { error: 'Failed to remove suggestions' };
  }
}

export async function adminClearAllSuggestionsAction(prevState: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  try {
    const count = await clearAllSuggestions();
    await createAdminLog({
      actorId: user.id,
      action: 'suggestions_cleared',
      targetType: 'suggestion',
      targetId: 'all',
      details: { count },
    });
    revalidatePath('/movies');
    revalidatePath('/admin/surveys');
    return { success: true, count };
  } catch {
    return { error: 'Failed to clear suggestions' };
  }
}

export async function bulkAddSuggestedToSurveyAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const surveyId = formData.get('surveyId') as string;
  const movieIdsJson = formData.get('movieIds') as string;
  if (!surveyId || !movieIdsJson) return { error: 'Invalid request' };

  let movieIds: string[];
  try {
    movieIds = JSON.parse(movieIdsJson);
  } catch {
    return { error: 'Invalid movie IDs' };
  }

  let added = 0;
  let skipped = 0;
  let watchedAdded = 0;
  let firstWatchedAddedTitle: string | null = null;

  const { data: movieRows } = await supabase
    .from('movies')
    .select('id, title, watched')
    .in('id', movieIds);

  const movieById = new Map(
    (movieRows || []).map((movie: any) => [movie.id, { title: movie.title as string, watched: !!movie.watched }])
  );

  for (const movieId of movieIds) {
    try {
      await addSurveyEntry({ surveyId, movieId, addedBy: user.id });
      added++;
      if (movieById.get(movieId)?.watched) {
        watchedAdded++;
        if (!firstWatchedAddedTitle) {
          firstWatchedAddedTitle = movieById.get(movieId)?.title || null;
        }
      }
    } catch {
      skipped++;
    }
  }

  revalidatePath(`/admin/surveys/${surveyId}`);
  if (watchedAdded > 0) {
    return {
      success: true,
      added,
      skipped,
      warning: watchedAdded === 1
        ? getWatchedNomineeWarningToast(firstWatchedAddedTitle || 'Movie')
        : `${watchedAdded} watched movies were added to nominees.`,
    };
  }

  return { success: true, added, skipped };
}
