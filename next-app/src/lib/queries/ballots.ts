import { createAdminClient } from '@/lib/supabase/admin';
import type { Ballot, BallotRank, BallotChangeLog } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import {
  getSurveyBallotOwnerBadge,
  getSurveyBallotOwnerLabel,
} from '@/lib/utils/surveyBallotOwner';

type BallotWithRanks = Ballot & {
  ranks: (BallotRank & { movie: { id: string; title: string } })[];
};

type BallotListItem = {
  ballot: Ballot;
  user: {
    id: string;
    displayName: string;
    badge: string | null;
    mode: 'identified' | 'guest';
  };
  ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
};

type UpsertBallotInput = {
  surveyId: string;
  ownerMode: 'identified' | 'guest';
  userId: string | null;
  identifiedDisplayName: string | null;
  guestDisplayName: string | null;
  guestSessionIdHash: string | null;
  ranks: Array<{ rank: number; movieId: string }>;
};

function ensureNoError(
  error: { message: string } | null,
  context: string
): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function mapBallotOwnerLabel(ballot: any): string {
  return getSurveyBallotOwnerLabel({
    ownerMode: ballot.owner_mode,
    identifiedDisplayName: ballot.profiles?.display_name || null,
    guestDisplayName: ballot.guest_display_name || null,
  });
}

async function getBallotRanks(
  admin: ReturnType<typeof createAdminClient>,
  ballotId: string
): Promise<(BallotRank & { movie: { id: string; title: string } })[]> {
  const { data: ranks } = await admin
    .from('ballot_ranks')
    .select('*, movies!movie_id(id, title)')
    .eq('ballot_id', ballotId)
    .order('rank');

  return (ranks || []).map((rank: any) => ({
    ...rank,
    movie: rank.movies,
  }));
}

export async function getBallot(
  surveyId: string,
  userId: string
): Promise<BallotWithRanks | null> {
  const admin = createAdminClient();
  const { data: ballot } = await admin
    .from('ballots')
    .select('*')
    .eq('survey_id', surveyId)
    .eq('owner_mode', 'identified')
    .eq('user_id', userId)
    .maybeSingle();

  if (!ballot) return null;

  return {
    ...ballot,
    ranks: await getBallotRanks(admin, ballot.id),
  };
}

export async function getGuestBallot(
  surveyId: string,
  guestSessionIdHash: string
): Promise<BallotWithRanks | null> {
  const admin = createAdminClient();
  const { data: ballot } = await admin
    .from('ballots')
    .select('*')
    .eq('survey_id', surveyId)
    .eq('owner_mode', 'guest')
    .eq('guest_session_id_hash', guestSessionIdHash)
    .maybeSingle();

  if (!ballot) return null;

  return {
    ...ballot,
    ranks: await getBallotRanks(admin, ballot.id),
  };
}

export async function getParticipantBallot(data: {
  surveyId: string;
  userId?: string | null;
  guestSessionIdHash?: string | null;
}): Promise<BallotWithRanks | null> {
  if (data.userId) {
    const userBallot = await getBallot(data.surveyId, data.userId);
    if (userBallot) {
      return userBallot;
    }
  }

  if (data.guestSessionIdHash) {
    return getGuestBallot(data.surveyId, data.guestSessionIdHash);
  }

  return null;
}

export async function getAllBallots(
  surveyId: string
): Promise<BallotListItem[]> {
  const admin = createAdminClient();
  const { data: allBallots } = await admin
    .from('ballots')
    .select('*, profiles!user_id(id, display_name)')
    .eq('survey_id', surveyId)
    .order('created_at');

  if (!allBallots) return [];

  const result = await Promise.all(
    allBallots.map(async (b: any) => {
      const { data: ranks } = await admin
        .from('ballot_ranks')
        .select('rank, movie_id, movies!movie_id(title)')
        .eq('ballot_id', b.id)
        .order('rank');
      const ownerLabel = mapBallotOwnerLabel(b);
      const badge = getSurveyBallotOwnerBadge(b.owner_mode);

      return {
        ballot: {
          id: b.id,
          survey_id: b.survey_id,
          owner_mode: b.owner_mode,
          user_id: b.user_id,
          guest_display_name: b.guest_display_name,
          guest_session_id_hash: b.guest_session_id_hash,
          created_at: b.created_at,
          updated_at: b.updated_at,
        },
        user: {
          id: b.user_id || b.id,
          displayName: ownerLabel,
          badge,
          mode: b.owner_mode,
        },
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

export async function upsertBallot(data: UpsertBallotInput): Promise<void> {
  const admin = createAdminClient();
  let ballotId: string | null = null;
  let previousRanks: Array<{ rank: number; movieId: string }> | null = null;

  let ballotLookup = admin.from('ballots').select('id');
  ballotLookup = ballotLookup.eq('survey_id', data.surveyId);
  if (data.ownerMode === 'identified') {
    ballotLookup = ballotLookup.eq('owner_mode', 'identified').eq('user_id', data.userId);
  } else {
    ballotLookup = ballotLookup
      .eq('owner_mode', 'guest')
      .eq('guest_session_id_hash', data.guestSessionIdHash);
  }

  const { data: existingBallot, error: existingBallotError } =
    await ballotLookup.maybeSingle();
  ensureNoError(existingBallotError, 'Failed to load ballot');

  if (existingBallot) {
    ballotId = existingBallot.id;
    const { data: existingRanks, error: existingRanksError } = await admin
      .from('ballot_ranks')
      .select('rank, movie_id')
      .eq('ballot_id', ballotId)
      .order('rank');
    ensureNoError(existingRanksError, 'Failed to load existing ballot ranks');

    previousRanks = (existingRanks || []).map((rank: any) => ({
      rank: rank.rank,
      movieId: rank.movie_id,
    }));

    const { error: deleteRanksError } = await admin
      .from('ballot_ranks')
      .delete()
      .eq('ballot_id', ballotId);
    ensureNoError(deleteRanksError, 'Failed to clear existing ballot ranks');

    const { error: updateBallotError } = await admin
      .from('ballots')
      .update({
        owner_mode: data.ownerMode,
        user_id: data.userId,
        guest_display_name: data.guestDisplayName,
        guest_session_id_hash: data.guestSessionIdHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ballotId);
    ensureNoError(updateBallotError, 'Failed to update ballot');
  } else {
    ballotId = generateId();
    const { error: insertBallotError } = await admin.from('ballots').insert({
      id: ballotId,
      survey_id: data.surveyId,
      owner_mode: data.ownerMode,
      user_id: data.userId,
      guest_display_name: data.guestDisplayName,
      guest_session_id_hash: data.guestSessionIdHash,
    });
    ensureNoError(insertBallotError, 'Failed to create ballot');
  }

  if (data.ranks.length > 0) {
    const { error: insertRanksError } = await admin.from('ballot_ranks').insert(
      data.ranks.map((rank) => ({
        id: generateId(),
        ballot_id: ballotId,
        rank: rank.rank,
        movie_id: rank.movieId,
      }))
    );
    ensureNoError(insertRanksError, 'Failed to save ballot ranks');
  }

  const { error: changeLogError } = await admin.from('ballot_change_logs').insert({
    id: generateId(),
    survey_id: data.surveyId,
    user_id: data.userId,
    owner_mode: data.ownerMode,
    owner_label: getSurveyBallotOwnerLabel({
      ownerMode: data.ownerMode,
      identifiedDisplayName: data.identifiedDisplayName,
      guestDisplayName: data.guestDisplayName,
    }),
    previous_ranks: previousRanks,
    new_ranks: data.ranks,
    reason: 'user_update',
  });
  ensureNoError(changeLogError, 'Failed to record ballot change');
}

export async function removeBallotMovie(surveyId: string, movieId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: ballots } = await admin
    .from('ballots')
    .select('*, profiles!user_id(display_name), ballot_ranks(rank, movie_id)')
    .eq('survey_id', surveyId);

  let affected = 0;

  for (const ballot of ballots || []) {
    const ranks = (ballot.ballot_ranks || []) as Array<{
      rank: number;
      movie_id: string;
    }>;
    if (!ranks.some((rank) => rank.movie_id === movieId)) {
      continue;
    }

    const previousRanks = ranks.map((rank) => ({
      rank: rank.rank,
      movieId: rank.movie_id,
    }));
    const newRanks = previousRanks.filter((rank) => rank.movieId !== movieId);

    await admin
      .from('ballot_ranks')
      .delete()
      .eq('ballot_id', ballot.id)
      .eq('movie_id', movieId);
    await admin
      .from('ballots')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ballot.id);
    await admin.from('ballot_change_logs').insert({
      id: generateId(),
      survey_id: surveyId,
      user_id: ballot.user_id,
      owner_mode: ballot.owner_mode,
      owner_label: mapBallotOwnerLabel(ballot),
      previous_ranks: previousRanks,
      new_ranks: newRanks,
      reason: 'movie_removed',
    });

    affected += 1;
  }

  return affected;
}

export async function getBallotChangeLogs(
  surveyId: string
): Promise<(BallotChangeLog & { userName: string })[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('ballot_change_logs')
    .select('*')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false });
  return (data || []).map((l: any) => ({
    ...l,
    userName: l.owner_label || 'Unknown',
  }));
}
