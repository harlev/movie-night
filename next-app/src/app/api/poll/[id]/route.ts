import { NextResponse } from 'next/server';
import { getPollById, getPollMovies, getPollVotes } from '@/lib/queries/polls';
import { calculateStandings } from '@/lib/services/scoring';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const poll = await getPollById(id);

  if (!poll || poll.state === 'draft') {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  const [movies, votes] = await Promise.all([
    getPollMovies(poll.id),
    getPollVotes(poll.id),
  ]);

  const standings = calculateStandings(
    votes.map((v) => ({
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

  const clientVotes = votes.map((v) => ({
    voterName: v.voter_name || 'Anonymous',
    ranks: (v.ranks as Array<{ rank: number; movieId: string }>).map((r) => {
      const movie = movies.find((m) => m.id === r.movieId);
      return { rank: r.rank, movieId: r.movieId, movieTitle: movie?.title || 'Unknown' };
    }),
  }));

  return NextResponse.json({
    standings,
    voteCount: votes.length,
    votes: clientVotes,
    state: poll.state,
    closesAt: poll.closes_at,
  });
}
