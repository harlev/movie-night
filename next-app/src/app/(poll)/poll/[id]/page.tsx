import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getPollById, getPollMovies, getPollVotes, getPollVote } from '@/lib/queries/polls';
import { calculateStandings, getPointsBreakdown } from '@/lib/services/scoring';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import type { Metadata } from 'next';
import PollVotingClient from './PollVotingClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const poll = await getPollById(id);
  return {
    title: poll ? `${poll.title} - Movie Night Poll` : 'Poll Not Found',
  };
}

export default async function PollPage({ params }: PageProps) {
  const { id } = await params;
  const poll = await getPollById(id);

  if (!poll || poll.state === 'draft') {
    notFound();
  }

  const cookieStore = await cookies();
  const voterId = cookieStore.get('qp_voter_id')?.value || null;

  // Check if the visitor is a logged-in user
  let loggedInName = '';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await getUserById(user.id);
      if (profile?.display_name) {
        loggedInName = profile.display_name;
      }
    }
  } catch {
    // Not logged in — that's fine
  }

  const [movies, allVotes] = await Promise.all([
    getPollMovies(poll.id),
    getPollVotes(poll.id),
  ]);

  // Get this voter's existing vote
  let existingVote = null;
  if (voterId) {
    existingVote = await getPollVote(poll.id, voterId);
  }

  // Calculate standings
  const standings = calculateStandings(
    allVotes.map((v) => ({
      ranks: v.ranks as Array<{ rank: number; movieId: string }>,
    })),
    movies.map((m) => ({
      id: m.id,
      title: m.title,
      tmdbId: m.tmdb_id,
      metadataSnapshot: m.metadata_snapshot,
    })),
    poll.max_rank_n
  );

  const pointsBreakdown = getPointsBreakdown(poll.max_rank_n);

  // Serialize for client
  const clientMovies = movies.map((m) => ({
    id: m.id,
    title: m.title,
    metadata_snapshot: m.metadata_snapshot,
  }));

  const clientVoterRanks = existingVote
    ? (existingVote.ranks as Array<{ rank: number; movieId: string }>)
    : null;

  const clientAllVotes = allVotes.map((v) => ({
    voterName: v.voter_name || 'Anonymous',
    ranks: (v.ranks as Array<{ rank: number; movieId: string }>).map((r) => {
      const movie = movies.find((m) => m.id === r.movieId);
      return { rank: r.rank, movieId: r.movieId, movieTitle: movie?.title || 'Unknown' };
    }),
  }));

  return (
    <PollVotingClient
      poll={{
        id: poll.id,
        title: poll.title,
        description: poll.description,
        state: poll.state,
        maxRankN: poll.max_rank_n,
        closesAt: poll.closes_at,
      }}
      movies={clientMovies}
      voterRanks={clientVoterRanks}
      voterName={existingVote?.voter_name || loggedInName || ''}
      loggedInName={loggedInName}
      isLoggedIn={!!loggedInName}
      allVotes={clientAllVotes}
      standings={standings}
      pointsBreakdown={pointsBreakdown}
      hasExistingVote={!!existingVote}
    />
  );
}
