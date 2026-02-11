import { createClient } from '@/lib/supabase/server';
import type { Ballot, BallotRank, BallotChangeLog } from '@/lib/types';

export async function getBallot(surveyId: string, userId: string): Promise<(Ballot & { ranks: (BallotRank & { movie: { id: string; title: string } })[] }) | null> {
  const supabase = await createClient();
  const { data: ballot } = await supabase
    .from('ballots')
    .select('*')
    .eq('survey_id', surveyId)
    .eq('user_id', userId)
    .single();

  if (!ballot) return null;

  const { data: ranks } = await supabase
    .from('ballot_ranks')
    .select('*, movies!movie_id(id, title)')
    .eq('ballot_id', ballot.id)
    .order('rank');

  return {
    ...ballot,
    ranks: (ranks || []).map((r: any) => ({ ...r, movie: r.movies })),
  };
}

export async function getAllBallots(surveyId: string): Promise<Array<{
  ballot: Ballot;
  user: { id: string; displayName: string };
  ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
}>> {
  const supabase = await createClient();
  const { data: allBallots } = await supabase
    .from('ballots')
    .select('*, profiles!user_id(id, display_name)')
    .eq('survey_id', surveyId);

  if (!allBallots) return [];

  const result = await Promise.all(
    allBallots.map(async (b: any) => {
      const { data: ranks } = await supabase
        .from('ballot_ranks')
        .select('rank, movie_id, movies!movie_id(title)')
        .eq('ballot_id', b.id)
        .order('rank');

      return {
        ballot: { id: b.id, survey_id: b.survey_id, user_id: b.user_id, created_at: b.created_at, updated_at: b.updated_at },
        user: { id: b.profiles.id, displayName: b.profiles.display_name },
        ranks: (ranks || []).map((r: any) => ({
          rank: r.rank,
          movieId: r.movie_id,
          movieTitle: r.movies?.title || 'Unknown',
        })),
      };
    })
  );

  return result;
}

export async function submitBallot(data: { surveyId: string; userId: string; ranks: Array<{ rank: number; movieId: string }> }): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('submit_ballot', {
    p_survey_id: data.surveyId,
    p_user_id: data.userId,
    p_ranks: data.ranks,
  });
}

export async function removeBallotMovie(surveyId: string, movieId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('remove_ballot_movie', {
    p_survey_id: surveyId,
    p_movie_id: movieId,
  });
  return data || 0;
}

export async function getBallotChangeLogs(surveyId: string): Promise<(BallotChangeLog & { userName: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ballot_change_logs')
    .select('*, profiles!user_id(display_name)')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false });
  return (data || []).map((l: any) => ({
    ...l,
    userName: l.profiles?.display_name || 'Unknown',
  }));
}
