'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getMovieDetails, createMetadataSnapshot, fetchMovieVideos } from '@/lib/services/tmdb';
import { createMovie, getMovieByTmdbId, createMovieComment } from '@/lib/queries/movies';
import { getUserById } from '@/lib/queries/profiles';
import { createAdminLog } from '@/lib/queries/admin';

export async function suggestMovieAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (profile?.role === 'viewer') return { error: 'Viewers cannot suggest movies' };

  const tmdbIdStr = formData.get('tmdbId') as string;
  if (!tmdbIdStr) return { error: 'No movie selected' };

  const tmdbId = parseInt(tmdbIdStr, 10);
  if (isNaN(tmdbId)) return { error: 'Invalid movie ID' };

  const existing = await getMovieByTmdbId(tmdbId);
  if (existing) {
    if (existing.hidden) {
      // Un-archive the movie instead of rejecting
      const admin = createAdminClient();
      await admin
        .from('movies')
        .update({ hidden: false, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      revalidatePath('/movies');
      redirect(`/movies/${existing.id}`);
    }
    return { error: 'This movie has already been suggested' };
  }

  try {
    const details = await getMovieDetails(tmdbId);
    if (!details) return { error: 'Movie not found' };

    const trailerKey = await fetchMovieVideos(tmdbId);
    const movie = await createMovie({
      tmdbId: details.id,
      title: details.title,
      metadataSnapshot: createMetadataSnapshot(details, trailerKey),
      suggestedBy: user.id,
    });

    redirect(`/movies/${movie.id}`);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error creating movie:', error);
    return { error: 'Failed to suggest movie' };
  }
}

export async function toggleMovieArchiveAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const movieId = formData.get('movieId') as string;
  if (!movieId) return { error: 'Invalid request' };

  const admin = createAdminClient();
  const { data: movie, error } = await admin
    .from('movies')
    .select('id, title, hidden')
    .eq('id', movieId)
    .single();
  if (error || !movie) return { error: 'Movie not found' };

  const newHidden = !movie.hidden;
  await admin
    .from('movies')
    .update({ hidden: newHidden, updated_at: new Date().toISOString() })
    .eq('id', movieId);

  await createAdminLog({
    actorId: user.id,
    action: newHidden ? 'movie_archived' : 'movie_unarchived',
    targetType: 'movie',
    targetId: movieId,
    details: { title: movie.title },
  });

  revalidatePath('/movies');
  revalidatePath(`/movies/${movieId}`);

  if (newHidden) {
    redirect('/movies');
  }
  return { success: true, archived: false };
}

export async function backfillMovieMetadataAction(prevState: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const admin = createAdminClient();
  const { data: movies, error } = await admin
    .from('movies')
    .select('id, tmdb_id, metadata_snapshot');
  if (error) return { error: 'Failed to fetch movies' };

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const movie of movies || []) {
    const snapshot = movie.metadata_snapshot as Record<string, unknown> | null;
    const hasImdbId = !!snapshot?.imdbId;
    const hasRuntime = snapshot?.runtime != null;

    if (hasImdbId && hasRuntime) {
      skipped++;
      continue;
    }

    try {
      const details = await getMovieDetails(movie.tmdb_id);
      if (!details) {
        skipped++;
        continue;
      }

      const updates: Record<string, unknown> = {};
      if (!hasImdbId && details.imdb_id) updates.imdbId = details.imdb_id;
      if (!hasRuntime && details.runtime != null) updates.runtime = details.runtime;

      if (Object.keys(updates).length === 0) {
        skipped++;
        continue;
      }

      await admin
        .from('movies')
        .update({
          metadata_snapshot: { ...snapshot, ...updates },
          updated_at: new Date().toISOString(),
        })
        .eq('id', movie.id);
      updated++;
    } catch {
      failed++;
    }
  }

  await createAdminLog({
    actorId: user.id,
    action: 'backfill_movie_metadata',
    targetType: 'movie',
    targetId: 'bulk',
    details: { updated, skipped, failed },
  });

  revalidatePath('/movies');
  return { success: true, updated, skipped, failed };
}

export async function addCommentAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (profile?.role === 'viewer') return { error: 'Viewers cannot post comments' };

  const movieId = formData.get('movieId') as string;
  const content = (formData.get('content') as string)?.trim();

  if (!content) return { error: 'Comment cannot be empty' };
  if (content.length > 1000) return { error: 'Comment must be less than 1000 characters' };

  await createMovieComment({ movieId, userId: user.id, content });
  return { success: true };
}
