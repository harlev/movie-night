import { getAllBallots } from '@/lib/queries/ballots';
import { getAllSurveys, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllPolls, getPollMovies, getPollVotes } from '@/lib/queries/polls';
import { getAllUsers } from '@/lib/queries/profiles';
import { calculateStandings } from '@/lib/services/scoring';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  participationCount: number;
  oraclePointsEarned: number;
  oraclePointsPossible: number;
  accuracyPercent: number;
}

export async function getLeaderboardData(): Promise<{
  leaderboard: LeaderboardEntry[];
  totalCompletedEvents: number;
}> {
  const [allSurveys, allPolls, allProfiles] = await Promise.all([
    getAllSurveys(),
    getAllPolls(),
    getAllUsers(),
  ]);

  const frozenSurveys = allSurveys.filter((s) => s.state === 'frozen' && !s.archived);
  const closedPolls = allPolls.filter((p) => p.state === 'closed' && !p.archived);

  const totalCompletedEvents = frozenSurveys.length + closedPolls.length;

  if (totalCompletedEvents === 0) {
    return { leaderboard: [], totalCompletedEvents: 0 };
  }

  const profileIds = new Set(allProfiles.map((p) => p.id));
  const profileNameMap = new Map(allProfiles.map((p) => [p.id, p.display_name]));

  const userStats = new Map<
    string,
    {
      displayName: string;
      participationCount: number;
      oraclePointsEarned: number;
      oraclePointsPossible: number;
    }
  >();

  // ── Process Surveys ──
  for (const survey of frozenSurveys) {
    const [entries, ballots] = await Promise.all([
      getSurveyEntries(survey.id),
      getAllBallots(survey.id),
    ]);

    if (ballots.length === 0) continue;

    const movies = entries.map((e) => ({
      id: e.movie.id,
      title: e.movie.title,
      tmdbId: e.movie.tmdb_id,
      metadataSnapshot: e.movie.metadata_snapshot
        ? { posterPath: e.movie.metadata_snapshot.posterPath }
        : null,
    }));

    const ballotsForScoring = ballots.map((b) => ({
      ranks: b.ranks.map((r) => ({ rank: r.rank, movieId: r.movieId })),
    }));

    const standings = calculateStandings(ballotsForScoring, movies, survey.max_rank_n);

    const winnerIds = new Set(
      standings.filter((s) => s.position === 1).map((s) => s.movieId)
    );

    if (winnerIds.size === 0) continue;

    const maxRankN = survey.max_rank_n;

    for (const ballot of ballots) {
      const userId = ballot.user.id;

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          displayName: ballot.user.displayName,
          participationCount: 0,
          oraclePointsEarned: 0,
          oraclePointsPossible: 0,
        });
      }

      const stats = userStats.get(userId)!;
      stats.participationCount++;
      stats.oraclePointsPossible += maxRankN;

      let bestRankForWinner: number | null = null;
      for (const r of ballot.ranks) {
        if (winnerIds.has(r.movieId)) {
          if (bestRankForWinner === null || r.rank < bestRankForWinner) {
            bestRankForWinner = r.rank;
          }
        }
      }

      if (bestRankForWinner !== null && bestRankForWinner <= maxRankN) {
        stats.oraclePointsEarned += maxRankN - bestRankForWinner + 1;
      }
    }
  }

  // ── Process Polls ──
  for (const poll of closedPolls) {
    const [pollMovies, pollVotes] = await Promise.all([
      getPollMovies(poll.id),
      getPollVotes(poll.id),
    ]);

    if (pollVotes.length === 0) continue;

    const movies = pollMovies.map((m) => ({
      id: m.id,
      title: m.title,
      tmdbId: m.tmdb_id,
      metadataSnapshot: m.metadata_snapshot
        ? { posterPath: m.metadata_snapshot.posterPath }
        : null,
    }));

    const ballotsForScoring = pollVotes.map((v) => ({
      ranks: v.ranks.map((r) => ({ rank: r.rank, movieId: r.movieId })),
    }));

    const standings = calculateStandings(ballotsForScoring, movies, poll.max_rank_n);

    const winnerIds = new Set(
      standings.filter((s) => s.position === 1).map((s) => s.movieId)
    );

    if (winnerIds.size === 0) continue;

    const maxRankN = poll.max_rank_n;

    // Only count votes from authenticated users (voter_id matches a profile)
    for (const vote of pollVotes) {
      if (!profileIds.has(vote.voter_id)) continue;

      const userId = vote.voter_id;
      const displayName = profileNameMap.get(userId) || 'Unknown';

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          displayName,
          participationCount: 0,
          oraclePointsEarned: 0,
          oraclePointsPossible: 0,
        });
      }

      const stats = userStats.get(userId)!;
      stats.participationCount++;
      stats.oraclePointsPossible += maxRankN;

      let bestRankForWinner: number | null = null;
      for (const r of vote.ranks) {
        if (winnerIds.has(r.movieId)) {
          if (bestRankForWinner === null || r.rank < bestRankForWinner) {
            bestRankForWinner = r.rank;
          }
        }
      }

      if (bestRankForWinner !== null && bestRankForWinner <= maxRankN) {
        stats.oraclePointsEarned += maxRankN - bestRankForWinner + 1;
      }
    }
  }

  const leaderboard: LeaderboardEntry[] = Array.from(userStats.entries()).map(
    ([userId, stats]) => ({
      userId,
      displayName: stats.displayName,
      participationCount: stats.participationCount,
      oraclePointsEarned: stats.oraclePointsEarned,
      oraclePointsPossible: stats.oraclePointsPossible,
      accuracyPercent:
        stats.oraclePointsPossible > 0
          ? Math.round((stats.oraclePointsEarned / stats.oraclePointsPossible) * 1000) / 10
          : 0,
    })
  );

  // Sort: primary by accuracy %, secondary by participation count
  leaderboard.sort((a, b) => {
    if (b.accuracyPercent !== a.accuracyPercent) {
      return b.accuracyPercent - a.accuracyPercent;
    }
    return b.participationCount - a.participationCount;
  });

  return {
    leaderboard,
    totalCompletedEvents,
  };
}
