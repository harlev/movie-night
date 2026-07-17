import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Ballot, BallotChangeLog, BallotRank } from '@/lib/types';

interface BallotNameSource {
  owner_mode: 'user' | 'guest' | 'anonymous';
  guest_display_name: string | null;
  profile_display_name?: string | null;
}

export function getBallotDisplayName(source: BallotNameSource, surveyIsAnonymous: boolean): string {
  if (surveyIsAnonymous || source.owner_mode === 'anonymous') return 'Anonymous';
  if (source.owner_mode === 'guest') return source.guest_display_name?.trim() || 'Anonymous';
  return source.profile_display_name?.trim() || 'Unknown';
}

type BallotWithRanks = Ballot & {
  ranks: Array<BallotRank & { option: { id: string; title: string }; movie: { id: string; title: string } | null }>;
};

export async function getBallotByOwner(
  surveyId: string,
  owner: { ownerMode: 'user'; userId: string } | { ownerMode: 'guest' | 'anonymous'; voterId: string }
): Promise<BallotWithRanks | null> {
  const admin = createAdminClient();
  let query = admin.from('ballots').select('*').eq('survey_id', surveyId).eq('owner_mode', owner.ownerMode);
  query = owner.ownerMode === 'user'
    ? query.eq('user_id', owner.userId)
    : query.eq('voter_id', owner.voterId);
  const { data: ballot } = await query.single();
  if (!ballot) return null;

  const { data: ranks } = await admin
    .from('ballot_ranks')
    .select('*, survey_entries!survey_entry_id(id, title, movies!movie_id(id, title))')
    .eq('ballot_id', ballot.id)
    .order('rank');

  return {
    ...ballot,
    ranks: (ranks || []).map((rank: any) => ({
      ...rank,
      option: {
        id: rank.survey_entry_id,
        title: rank.survey_entries?.movies?.title ?? rank.survey_entries?.title ?? 'Unknown',
      },
      movie: rank.survey_entries?.movies ?? null,
    })),
  };
}

export async function getBallot(surveyId: string, userId: string): Promise<BallotWithRanks | null> {
  return getBallotByOwner(surveyId, { ownerMode: 'user', userId });
}

export async function getAllBallots(surveyId: string): Promise<Array<{
  ballot: Ballot;
  user: { id: string; displayName: string; badge: string | null; mode: Ballot['owner_mode'] };
  ranks: Array<{
    rank: number;
    optionId: string;
    optionTitle: string;
    movieId: string;
    movieTitle: string;
  }>;
}>> {
  const admin = createAdminClient();
  const [{ data: survey }, { data: allBallots }] = await Promise.all([
    admin.from('surveys').select('is_anonymous').eq('id', surveyId).single(),
    admin.from('ballots').select('*, profiles!user_id(id, display_name)').eq('survey_id', surveyId),
  ]);
  if (!allBallots) return [];

  return Promise.all(allBallots.map(async (ballot: any) => {
    const { data: ranks } = await admin
      .from('ballot_ranks')
      .select('rank, survey_entry_id, survey_entries!survey_entry_id(title, movies!movie_id(id, title))')
      .eq('ballot_id', ballot.id)
      .order('rank');
    const displayName = getBallotDisplayName({
      owner_mode: ballot.owner_mode,
      guest_display_name: ballot.guest_display_name,
      profile_display_name: ballot.profiles?.display_name,
    }, survey?.is_anonymous ?? false);

    return {
      ballot: {
        id: ballot.id,
        survey_id: ballot.survey_id,
        user_id: ballot.user_id,
        owner_mode: ballot.owner_mode,
        voter_id: ballot.voter_id,
        guest_display_name: ballot.guest_display_name,
        created_at: ballot.created_at,
        updated_at: ballot.updated_at,
      },
      user: {
        id: ballot.profiles?.id || ballot.user_id || ballot.id,
        displayName,
        badge: ballot.owner_mode === 'guest' ? 'Guest' : ballot.owner_mode === 'anonymous' ? 'Anonymous' : null,
        mode: ballot.owner_mode,
      },
      ranks: (ranks || []).map((rank: any) => {
        const title = rank.survey_entries?.movies?.title ?? rank.survey_entries?.title ?? 'Unknown';
        const movieId = rank.survey_entries?.movies?.id ?? rank.survey_entry_id;
        return {
          rank: rank.rank,
          optionId: rank.survey_entry_id,
          optionTitle: title,
          movieId,
          movieTitle: title,
        };
      }),
    };
  }));
}

interface GenericBallotSubmission {
  surveyId: string;
  authenticatedUserId: string | null;
  ownerMode: 'user' | 'guest' | 'anonymous';
  voterId: string | null;
  guestDisplayName: string | null;
  ranks: Array<{ rank: number; optionId: string }>;
}

interface LegacyBallotSubmission {
  surveyId: string;
  userId: string;
  ranks: Array<{ rank: number; movieId: string }>;
}

export async function submitBallot(data: GenericBallotSubmission | LegacyBallotSubmission): Promise<void> {
  const admin = createAdminClient();
  let submission: GenericBallotSubmission;

  if ('userId' in data) {
    const movieIds = data.ranks.map((rank) => rank.movieId);
    const { data: entries } = await admin
      .from('survey_entries')
      .select('id, movie_id')
      .eq('survey_id', data.surveyId)
      .in('movie_id', movieIds);
    const entryByMovie = new Map((entries || []).map((entry) => [entry.movie_id, entry.id]));
    submission = {
      surveyId: data.surveyId,
      authenticatedUserId: data.userId,
      ownerMode: 'user',
      voterId: null,
      guestDisplayName: null,
      ranks: data.ranks.map((rank) => ({ rank: rank.rank, optionId: entryByMovie.get(rank.movieId) ?? rank.movieId })),
    };
  } else {
    submission = data;
  }

  const { error } = await admin.rpc('submit_ballot', {
    p_survey_id: submission.surveyId,
    p_authenticated_user_id: submission.authenticatedUserId,
    p_owner_mode: submission.ownerMode,
    p_voter_id: submission.voterId,
    p_guest_display_name: submission.guestDisplayName,
    p_ranks: submission.ranks,
  });
  if (error) throw error;
}

export async function removeBallotOption(surveyId: string, optionId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('remove_ballot_option', {
    p_survey_id: surveyId,
    p_survey_entry_id: optionId,
  });
  if (error) throw error;
  return data || 0;
}

export async function removeBallotMovie(surveyId: string, movieId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: entry } = await admin
    .from('survey_entries')
    .select('id')
    .eq('survey_id', surveyId)
    .eq('movie_id', movieId)
    .single();
  return entry ? removeBallotOption(surveyId, entry.id) : 0;
}

export async function getBallotChangeLogs(
  surveyId: string
): Promise<Array<BallotChangeLog & { userName: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ballot_change_logs')
    .select('*, profiles!user_id(display_name), surveys!survey_id(is_anonymous)')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false });
  return (data || []).map((log: any) => ({
    ...log,
    userName: getBallotDisplayName({
      owner_mode: log.owner_mode,
      guest_display_name: log.owner_label,
      profile_display_name: log.profiles?.display_name,
    }, log.surveys?.is_anonymous ?? false),
  }));
}
