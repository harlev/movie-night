import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllBallots, getParticipantBallot } from '@/lib/queries/ballots';
import { getUserById } from '@/lib/queries/profiles';
import { calculateStandings, getPointsBreakdown } from '@/lib/services/scoring';
import SurveyVotingClient from './SurveyVotingClient';
import { getSurveyGuestSessionIdHash } from '@/lib/utils/surveyGuest.server';

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guestSessionIdHash = await getSurveyGuestSessionIdHash(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const survey = await getSurveyById(id);
  if (!survey || survey.state === 'draft') {
    notFound();
  }

  const [entries, userBallot, allBallots, profile] = await Promise.all([
    getSurveyEntries(survey.id),
    getParticipantBallot({
      surveyId: survey.id,
      userId: user?.id ?? null,
      guestSessionIdHash,
    }),
    getAllBallots(survey.id),
    user ? getUserById(user.id) : Promise.resolve(null),
  ]);

  // Calculate standings
  const standings = calculateStandings(
    allBallots.map((b) => ({
      ranks: b.ranks.map((r) => ({ rank: r.rank, movieId: r.movieId })),
    })),
    entries.map((e) => ({
      id: e.movie.id,
      title: e.movie.title,
      tmdbId: e.movie.tmdb_id,
      metadataSnapshot: e.movie.metadata_snapshot,
    })),
    survey.max_rank_n
  );

  const pointsBreakdown = getPointsBreakdown(survey.max_rank_n);

  // Serialize data for client
  const clientEntries = entries.map((e) => ({
    movieId: e.movie_id,
    movie: {
      id: e.movie.id,
      title: e.movie.title,
      metadata_snapshot: e.movie.metadata_snapshot,
    },
  }));

  const clientBallotRanks = userBallot?.ranks.map((r) => ({
    rank: r.rank,
    movieId: r.movie_id,
  })) || null;

  const clientAllBallots = allBallots.map((b) => ({
    user: b.user,
    ranks: b.ranks.map((r) => ({
      rank: r.rank,
      movieId: r.movieId,
      movieTitle: r.movieTitle,
    })),
  }));

  return (
    <SurveyVotingClient
      survey={{
        id: survey.id,
        title: survey.title,
        description: survey.description,
        state: survey.state,
        maxRankN: survey.max_rank_n,
        closesAt: survey.closes_at,
      }}
      entries={clientEntries}
      userBallotRanks={clientBallotRanks}
      allBallots={clientAllBallots}
      standings={standings}
      pointsBreakdown={pointsBreakdown}
      hasExistingBallot={!!userBallot}
      userRole={profile?.role}
      isLoggedIn={!!user}
      currentGuestDisplayName={userBallot?.guest_display_name ?? null}
    />
  );
}
