import { createClient } from '@/lib/supabase/server';
import type { Movie, MovieComment } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

export async function createMovie(data: {
  tmdbId: number;
  title: string;
  metadataSnapshot: Movie['metadata_snapshot'];
  suggestedBy: string;
}): Promise<Movie> {
  const supabase = await createClient();
  const id = generateId();
  const { data: movie, error } = await supabase.from('movies').insert({
    id,
    tmdb_id: data.tmdbId,
    title: data.title,
    metadata_snapshot: data.metadataSnapshot,
    suggested_by: data.suggestedBy,
  }).select().single();
  if (error) throw error;
  return movie;
}

export async function getMovieById(id: string): Promise<Movie | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('movies').select('*').eq('id', id).single();
  return data;
}

export async function getMovieByTmdbId(tmdbId: number): Promise<Movie | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('movies').select('*').eq('tmdb_id', tmdbId).single();
  return data;
}

export async function getAllMovies(): Promise<(Movie & { suggestedByName: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('movies')
    .select('*, profiles!suggested_by(display_name)')
    .eq('hidden', false)
    .order('created_at', { ascending: false });
  return (data || []).map((m: any) => ({
    ...m,
    suggestedByName: m.profiles?.display_name || 'Unknown',
  }));
}

export async function createMovieComment(data: {
  movieId: string;
  userId: string;
  content: string;
}): Promise<MovieComment> {
  const supabase = await createClient();
  const id = generateId();
  const { data: comment, error } = await supabase.from('movie_comments').insert({
    id,
    movie_id: data.movieId,
    user_id: data.userId,
    content: data.content,
  }).select().single();
  if (error) throw error;
  return comment;
}

export async function getMovieComments(movieId: string): Promise<(MovieComment & { userName: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('movie_comments')
    .select('*, profiles!user_id(display_name)')
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false });
  return (data || []).map((c: any) => ({
    ...c,
    userName: c.profiles?.display_name || 'Unknown',
  }));
}
