import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { QuickPoll, QuickPollMovie, QuickPollVote } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

// ── Admin queries (use RLS-aware client) ──

export async function createPoll(data: {
  title: string;
  description?: string;
  maxRankN?: number;
  createdBy: string;
  closesAt?: string;
}): Promise<QuickPoll> {
  const supabase = await createClient();
  const id = generateId();
  const { data: poll, error } = await supabase.from('quick_polls').insert({
    id,
    title: data.title,
    description: data.description || null,
    max_rank_n: data.maxRankN || 3,
    created_by: data.createdBy,
    closes_at: data.closesAt || null,
  }).select().single();
  if (error) throw error;
  return poll;
}

export async function getPollById(id: string): Promise<QuickPoll | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('quick_polls').select('*').eq('id', id).single();
  return data;
}

export async function getAllPolls(): Promise<QuickPoll[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('quick_polls').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function updatePoll(id: string, data: Partial<Pick<QuickPoll, 'title' | 'description' | 'max_rank_n' | 'closes_at'>>): Promise<QuickPoll | null> {
  const supabase = await createClient();
  const { data: poll } = await supabase.from('quick_polls').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return poll;
}

export async function getLivePolls(): Promise<QuickPoll[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('quick_polls').select('*').eq('state', 'live').order('created_at', { ascending: false });
  return data || [];
}

export async function updatePollState(id: string, state: 'draft' | 'live' | 'closed'): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, any> = { state, updated_at: new Date().toISOString() };
  if (state === 'closed') {
    updates.closed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('quick_polls').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePollArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from('quick_polls').update({ archived, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function deletePoll(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('quick_polls').delete().eq('id', id);
}

// ── Poll Movies (admin client for writes, admin client for public reads) ──

export async function addPollMovie(data: {
  pollId: string;
  tmdbId: number;
  title: string;
  metadataSnapshot: QuickPollMovie['metadata_snapshot'];
}): Promise<QuickPollMovie> {
  const supabase = await createClient();
  const id = generateId();
  const { data: movie, error } = await supabase.from('quick_poll_movies').insert({
    id,
    poll_id: data.pollId,
    tmdb_id: data.tmdbId,
    title: data.title,
    metadata_snapshot: data.metadataSnapshot,
  }).select().single();
  if (error) throw error;
  return movie;
}

export async function removePollMovie(movieId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('quick_poll_movies').delete().eq('id', movieId);
}

export async function getPollMovies(pollId: string): Promise<QuickPollMovie[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('quick_poll_movies').select('*').eq('poll_id', pollId).order('created_at');
  return data || [];
}

// ── Poll Votes (all via admin client since voters are anonymous) ──

export async function submitPollVote(data: {
  pollId: string;
  voterId: string;
  voterName: string | null;
  ranks: Array<{ rank: number; movieId: string }>;
}): Promise<void> {
  const admin = createAdminClient();

  // Check for existing vote
  const { data: existing } = await admin
    .from('quick_poll_votes')
    .select('id')
    .eq('poll_id', data.pollId)
    .eq('voter_id', data.voterId)
    .single();

  if (existing) {
    await admin.from('quick_poll_votes').update({
      ranks: data.ranks,
      voter_name: data.voterName,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    const id = generateId();
    await admin.from('quick_poll_votes').insert({
      id,
      poll_id: data.pollId,
      voter_id: data.voterId,
      voter_name: data.voterName,
      ranks: data.ranks,
    });
  }
}

export async function getPollVote(pollId: string, voterId: string): Promise<QuickPollVote | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('quick_poll_votes')
    .select('*')
    .eq('poll_id', pollId)
    .eq('voter_id', voterId)
    .single();
  return data;
}

export async function getPollVotes(pollId: string, includeDisabled = false): Promise<QuickPollVote[]> {
  const admin = createAdminClient();
  let query = admin
    .from('quick_poll_votes')
    .select('*')
    .eq('poll_id', pollId);
  if (!includeDisabled) {
    query = query.eq('disabled', false);
  }
  const { data } = await query.order('created_at');
  return data || [];
}

export async function getPollVoteCount(pollId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from('quick_poll_votes')
    .select('*', { count: 'exact', head: true })
    .eq('poll_id', pollId)
    .eq('disabled', false);
  return count || 0;
}

export async function togglePollVoteDisabled(voteId: string, disabled: boolean): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('quick_poll_votes')
    .update({ disabled, updated_at: new Date().toISOString() })
    .eq('id', voteId);
}

export async function removePollMovieAndCleanVotes(pollId: string, movieId: string, pollMovieId: string): Promise<number> {
  const admin = createAdminClient();

  // Get all votes for this poll
  const { data: votes } = await admin
    .from('quick_poll_votes')
    .select('id, ranks')
    .eq('poll_id', pollId);

  let affected = 0;

  if (votes) {
    for (const vote of votes) {
      const ranks = vote.ranks as Array<{ rank: number; movieId: string }>;
      const hasMovie = ranks.some((r) => r.movieId === movieId);
      if (hasMovie) {
        const newRanks = ranks.filter((r) => r.movieId !== movieId);
        await admin.from('quick_poll_votes').update({
          ranks: newRanks,
          updated_at: new Date().toISOString(),
        }).eq('id', vote.id);
        affected++;
      }
    }
  }

  // Delete the poll movie (use authenticated client for RLS)
  const supabase = await createClient();
  await supabase.from('quick_poll_movies').delete().eq('id', pollMovieId);

  return affected;
}
