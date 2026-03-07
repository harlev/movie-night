import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Movie, MovieComment } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { calculateStandings } from '@/lib/services/scoring';
import { isPastSurveyWinnerWatchDeadline } from '@/lib/utils/watchedMovies';

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

export async function autoMarkPastDueSurveyWinnersAsWatched(referenceNow: Date = new Date()): Promise<number> {
  const admin = createAdminClient();
  const { data: surveys, error: surveysError } = await admin
    .from('surveys')
    .select('id, max_rank_n, frozen_at')
    .eq('state', 'frozen')
    .not('frozen_at', 'is', null);

  if (surveysError || !surveys || surveys.length === 0) return 0;

  const dueSurveys = surveys.filter(
    (survey: any) =>
      typeof survey.frozen_at === 'string' &&
      isPastSurveyWinnerWatchDeadline(survey.frozen_at, referenceNow)
  );

  if (dueSurveys.length === 0) return 0;

  const winnerMovieIds = new Set<string>();

  for (const survey of dueSurveys) {
    const [{ data: entries, error: entriesError }, { data: ballots, error: ballotsError }] =
      await Promise.all([
        admin
          .from('survey_entries')
          .select('movie_id, movies!movie_id(title, tmdb_id, metadata_snapshot)')
          .eq('survey_id', survey.id)
          .is('removed_at', null),
        admin
          .from('ballots')
          .select('ballot_ranks(rank, movie_id)')
          .eq('survey_id', survey.id),
      ]);

    if (entriesError || ballotsError || !entries || !ballots || entries.length === 0 || ballots.length === 0) {
      continue;
    }

    const standings = calculateStandings(
      ballots.map((ballot: any) => ({
        ranks: (ballot.ballot_ranks || []).map((rank: any) => ({
          rank: rank.rank,
          movieId: rank.movie_id,
        })),
      })),
      entries.map((entry: any) => ({
        id: entry.movie_id,
        title: entry.movies?.title || 'Unknown',
        tmdbId: entry.movies?.tmdb_id || 0,
        metadataSnapshot: entry.movies?.metadata_snapshot
          ? { posterPath: entry.movies.metadata_snapshot.posterPath || null }
          : null,
      })),
      survey.max_rank_n
    );

    for (const standing of standings) {
      if (standing.position === 1 && standing.totalPoints > 0) {
        winnerMovieIds.add(standing.movieId);
      }
    }
  }

  if (winnerMovieIds.size === 0) return 0;

  const winnerIds = Array.from(winnerMovieIds);
  const { data: unwatchedWinners, error: unwatchedError } = await admin
    .from('movies')
    .select('id')
    .in('id', winnerIds)
    .eq('watched', false);

  if (unwatchedError || !unwatchedWinners || unwatchedWinners.length === 0) return 0;

  const nowIso = referenceNow.toISOString();
  const idsToMark = unwatchedWinners.map((movie: any) => movie.id);
  const { error: updateError } = await admin
    .from('movies')
    .update({ watched: true, watched_at: nowIso, updated_at: nowIso })
    .in('id', idsToMark);

  if (updateError) return 0;
  return idsToMark.length;
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
