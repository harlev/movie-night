'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { searchMovies, getMovieDetails, createMetadataSnapshot, fetchMovieVideos } from '@/lib/services/tmdb';
import { createMovie, getMovieByTmdbId, createMovieComment } from '@/lib/queries/movies';

export async function searchMoviesAction(prevState: any, formData: FormData) {
  const query = formData.get('query') as string;

  if (!query || query.length < 2) {
    return { error: 'Search query must be at least 2 characters' };
  }

  try {
    const result = await searchMovies(query);
    return { searchResults: result.movies, query };
  } catch (error) {
    console.error('TMDb search error:', error);
    return { error: 'Failed to search movies' };
  }
}

export async function suggestMovieAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const tmdbIdStr = formData.get('tmdbId') as string;
  if (!tmdbIdStr) return { error: 'No movie selected' };

  const tmdbId = parseInt(tmdbIdStr, 10);
  if (isNaN(tmdbId)) return { error: 'Invalid movie ID' };

  const existing = await getMovieByTmdbId(tmdbId);
  if (existing) return { error: 'This movie has already been suggested' };

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

export async function addCommentAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const movieId = formData.get('movieId') as string;
  const content = (formData.get('content') as string)?.trim();

  if (!content) return { error: 'Comment cannot be empty' };
  if (content.length > 1000) return { error: 'Comment must be less than 1000 characters' };

  await createMovieComment({ movieId, userId: user.id, content });
  return { success: true };
}
