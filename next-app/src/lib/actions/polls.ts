'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { searchMovies, getMovieDetails, createMetadataSnapshot, fetchMovieVideos } from '@/lib/services/tmdb';
import {
  createPoll,
  updatePoll,
  updatePollState,
  deletePoll,
  getPollById,
  getPollMovies,
  addPollMovie,
  removePollMovieAndCleanVotes,
  submitPollVote,
  togglePollVoteDisabled,
} from '@/lib/queries/polls';
import { createAdminLog } from '@/lib/queries/admin';

// ── Admin Actions ──

export async function createPollAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const maxRankNStr = formData.get('maxRankN') as string || '3';

  if (!title) return { error: 'Title is required', title: '', description: '', maxRankN: maxRankNStr };
  if (title.length > 100) return { error: 'Title must be less than 100 characters', title, description, maxRankN: maxRankNStr };

  const maxRankN = parseInt(maxRankNStr, 10);
  if (isNaN(maxRankN) || maxRankN < 1 || maxRankN > 10) {
    return { error: 'Max rank must be between 1 and 10', title, description, maxRankN: maxRankNStr };
  }

  const poll = await createPoll({ title, description: description || undefined, maxRankN, createdBy: user.id });

  await createAdminLog({
    actorId: user.id,
    action: 'poll_created',
    targetType: 'poll',
    targetId: poll.id,
    details: { title },
  });

  redirect(`/admin/polls/${poll.id}`);
}

export async function updatePollAction(prevState: any, formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const maxRankNStr = formData.get('maxRankN') as string || '3';

  if (!title) return { error: 'Title is required' };

  const maxRankN = parseInt(maxRankNStr, 10);
  if (isNaN(maxRankN) || maxRankN < 1 || maxRankN > 10) return { error: 'Max rank must be between 1 and 10' };

  await updatePoll(pollId, { title, description: description || null, max_rank_n: maxRankN });
  revalidatePath(`/admin/polls/${pollId}`);
  return { success: true, message: 'Poll updated' };
}

export async function changePollStateAction(prevState: any, formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const newState = formData.get('state') as 'draft' | 'live' | 'closed';

  if (!['draft', 'live', 'closed'].includes(newState)) return { error: 'Invalid state' };

  const poll = await getPollById(pollId);
  if (!poll) return { error: 'Poll not found' };
  if (poll.state === 'closed') return { error: 'Cannot change state of closed poll' };
  if (poll.state === 'draft' && newState === 'closed') return { error: 'Cannot close a draft poll directly' };

  if (newState === 'live') {
    const movies = await getPollMovies(pollId);
    if (movies.length === 0) return { error: 'Cannot go live without any movies' };
  }

  const result = await updatePollState(pollId, newState);
  if (!result.success) return { error: result.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await createAdminLog({
      actorId: user.id,
      action: `poll_${newState}`,
      targetType: 'poll',
      targetId: pollId,
      details: { title: poll.title },
    });
  }

  revalidatePath(`/admin/polls/${pollId}`);
  return { success: true, message: `Poll is now ${newState}` };
}

export async function deletePollAction(prevState: any, formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const poll = await getPollById(pollId);
  if (!poll) return { error: 'Poll not found' };
  if (poll.state !== 'draft') return { error: 'Can only delete draft polls' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await createAdminLog({
      actorId: user.id,
      action: 'poll_deleted',
      targetType: 'poll',
      targetId: pollId,
      details: { title: poll.title },
    });
  }

  await deletePoll(pollId);
  redirect('/admin/polls');
}

export async function searchMoviesForPollAction(prevState: any, formData: FormData) {
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

export async function addMovieToPollAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const pollId = formData.get('pollId') as string;
  const tmdbIdStr = formData.get('tmdbId') as string;
  if (!tmdbIdStr) return { error: 'No movie selected' };

  const tmdbId = parseInt(tmdbIdStr, 10);
  if (isNaN(tmdbId)) return { error: 'Invalid movie ID' };

  const poll = await getPollById(pollId);
  if (!poll) return { error: 'Poll not found' };
  if (poll.state === 'closed') return { error: 'Cannot add movies to closed poll' };

  // Check if already in poll
  const existing = await getPollMovies(pollId);
  if (existing.some((m) => m.tmdb_id === tmdbId)) {
    return { error: 'Movie already in poll' };
  }

  try {
    const details = await getMovieDetails(tmdbId);
    if (!details) return { error: 'Movie not found on TMDb' };

    const trailerKey = await fetchMovieVideos(tmdbId);
    const snapshot = createMetadataSnapshot(details, trailerKey);

    await addPollMovie({
      pollId,
      tmdbId: details.id,
      title: details.title,
      metadataSnapshot: snapshot,
    });

    revalidatePath(`/admin/polls/${pollId}`);
    return { success: true, message: 'Movie added' };
  } catch (error: any) {
    console.error('Error adding movie to poll:', error);
    return { error: 'Failed to add movie' };
  }
}

export async function removeMovieFromPollAction(prevState: any, formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const pollMovieId = formData.get('pollMovieId') as string;
  const movieId = formData.get('movieId') as string;

  const poll = await getPollById(pollId);
  if (!poll) return { error: 'Poll not found' };
  if (poll.state === 'closed') return { error: 'Cannot remove movies from closed poll' };

  if (poll.state === 'live') {
    const affected = await removePollMovieAndCleanVotes(pollId, movieId, pollMovieId);
    revalidatePath(`/admin/polls/${pollId}`);
    return { success: true, message: `Movie removed. ${affected} vote(s) affected.` };
  }

  // Draft: just remove the movie
  const supabaseClient = await createClient();
  await supabaseClient.from('quick_poll_movies').delete().eq('id', pollMovieId);
  revalidatePath(`/admin/polls/${pollId}`);
  return { success: true, message: 'Movie removed' };
}

export async function togglePollVoteDisabledAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const voteId = formData.get('voteId') as string;
  const pollId = formData.get('pollId') as string;
  const disabled = formData.get('disabled') === 'true';

  await togglePollVoteDisabled(voteId, disabled);
  revalidatePath(`/admin/polls/${pollId}`);
  return { success: true };
}

// ── Public Action (no auth required) ──

export async function submitPollVoteAction(prevState: any, formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const ranksJson = formData.get('ranks') as string;
  const voterName = (formData.get('voterName') as string)?.trim() || null;

  const cookieStore = await cookies();
  const voterId = cookieStore.get('qp_voter_id')?.value;
  if (!voterId) return { error: 'Missing voter identity. Please enable cookies.' };

  const poll = await getPollById(pollId);
  if (!poll) return { error: 'Poll not found' };
  if (poll.state !== 'live') return { error: 'This poll is not accepting votes' };

  let ranks: Array<{ rank: number; movieId: string }>;
  try {
    ranks = JSON.parse(ranksJson);
  } catch {
    return { error: 'Invalid ballot data' };
  }

  if (!Array.isArray(ranks) || ranks.length === 0) {
    return { error: 'Please rank at least one movie' };
  }

  // Validate ranks against poll movies
  const movies = await getPollMovies(pollId);
  const movieIds = new Set(movies.map((m) => m.id));
  for (const { rank, movieId } of ranks) {
    if (!movieIds.has(movieId)) return { error: 'Invalid movie in ballot' };
    if (rank < 1 || rank > poll.max_rank_n) return { error: 'Invalid rank position' };
  }

  await submitPollVote({ pollId, voterId, voterName, ranks });

  revalidatePath(`/poll/${pollId}`);
  return { success: true, message: 'Vote submitted!' };
}
