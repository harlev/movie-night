import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getBallot, getAllBallots } from '@/lib/queries/ballots';
import { getUserById } from '@/lib/queries/profiles';
import { calculateStandings } from '@/lib/services/scoring';
import SimpleVotingClient from './SimpleVotingClient';

export default async function SimpleSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const survey = await getSurveyById(id);
  if (!survey || survey.state === 'draft') {
    notFound();
  }

  const [entries, userBallot, allBallots, profile] = await Promise.all([
    getSurveyEntries(survey.id),
    getBallot(survey.id, user.id),
    getAllBallots(survey.id),
    getUserById(user.id),
  ]);

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
    <SimpleVotingClient
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
      hasExistingBallot={!!userBallot}
      userRole={profile?.role}
    />
  );
}
