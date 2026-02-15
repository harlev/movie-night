import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPollById, getPollMovies, getPollVotes } from '@/lib/queries/polls';
import { getAllUsers } from '@/lib/queries/profiles';
import { calculateStandings } from '@/lib/services/scoring';
import PollDetailClient from './PollDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const poll = await getPollById(id);
  return {
    title: poll ? `${poll.title} - Admin` : 'Poll Not Found',
  };
}

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poll = await getPollById(id);

  if (!poll) {
    notFound();
  }

  const [movies, allVotes, users] = await Promise.all([
    getPollMovies(poll.id),
    getPollVotes(poll.id, true), // include disabled votes for admin
    getAllUsers(),
  ]);

  // Build a map of user ID -> email for registered voters
  const userEmailMap = new Map(users.map((u) => [u.id, u.email]));

  const enabledVotes = allVotes.filter((v) => !v.disabled);

  const standings = calculateStandings(
    enabledVotes.map((v) => ({
      ranks: (v.ranks as Array<{ rank: number; movieId: string }>),
    })),
    movies.map((m) => ({
      id: m.id,
      title: m.title,
      tmdbId: m.tmdb_id,
      metadataSnapshot: m.metadata_snapshot,
    })),
    poll.max_rank_n
  );

  const clientVotes = allVotes.map((v) => ({
    voteId: v.id,
    voterName: v.voter_name || 'Anonymous',
    voterEmail: userEmailMap.get(v.voter_id) || null,
    disabled: v.disabled,
    ranks: (v.ranks as Array<{ rank: number; movieId: string }>).map((r) => {
      const movie = movies.find((m) => m.id === r.movieId);
      return { rank: r.rank, movieId: r.movieId, movieTitle: movie?.title || 'Unknown' };
    }),
  }));

  return (
    <PollDetailClient
      poll={poll}
      movies={movies}
      voteCount={enabledVotes.length}
      votes={clientVotes}
      standings={standings}
    />
  );
}
