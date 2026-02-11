import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getBallot, getAllBallots } from '@/lib/queries/ballots';
import { calculateStandings, getPointsBreakdown } from '@/lib/services/scoring';
import type { Metadata } from 'next';
import SurveyVotingClient from './SurveyVotingClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const survey = await getSurveyById(id);
  return {
    title: survey ? `${survey.title} - Movie Night` : 'Survey Not Found',
  };
}

export default async function SurveyPage({ params }: PageProps) {
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

  const [entries, userBallot, allBallots] = await Promise.all([
    getSurveyEntries(survey.id),
    getBallot(survey.id, user.id),
    getAllBallots(survey.id),
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
      }}
      entries={clientEntries}
      userBallotRanks={clientBallotRanks}
      allBallots={clientAllBallots}
      standings={standings}
      pointsBreakdown={pointsBreakdown}
      hasExistingBallot={!!userBallot}
    />
  );
}
