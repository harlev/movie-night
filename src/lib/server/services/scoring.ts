export interface MovieScore {
	movieId: string;
	title: string;
	tmdbId: number;
	posterPath: string | null;
	totalPoints: number;
	rankCounts: number[]; // rankCounts[0] = rank 1 count, etc.
}

export interface Standing extends MovieScore {
	position: number;
	tied: boolean;
}

export function calculatePoints(rank: number, maxRankN: number): number {
	return maxRankN - rank + 1;
}

export function calculateStandings(
	ballots: Array<{
		ranks: Array<{ rank: number; movieId: string }>;
	}>,
	movies: Array<{
		id: string;
		title: string;
		tmdbId: number;
		metadataSnapshot: { posterPath: string | null } | null;
	}>,
	maxRankN: number
): Standing[] {
	const movieMap = new Map(movies.map((m) => [m.id, m]));

	// Initialize scores
	const scores = new Map<string, MovieScore>();
	for (const movie of movies) {
		scores.set(movie.id, {
			movieId: movie.id,
			title: movie.title,
			tmdbId: movie.tmdbId,
			posterPath: movie.metadataSnapshot?.posterPath || null,
			totalPoints: 0,
			rankCounts: new Array(maxRankN).fill(0)
		});
	}

	// Calculate points from all ballots
	for (const ballot of ballots) {
		for (const { rank, movieId } of ballot.ranks) {
			const score = scores.get(movieId);
			if (score && rank >= 1 && rank <= maxRankN) {
				score.totalPoints += calculatePoints(rank, maxRankN);
				score.rankCounts[rank - 1]++;
			}
		}
	}

	// Sort by points, then by tiebreakers
	const sortedScores = Array.from(scores.values()).sort((a, b) => {
		// Primary: total points (descending)
		if (b.totalPoints !== a.totalPoints) {
			return b.totalPoints - a.totalPoints;
		}

		// Tiebreakers: rank counts from rank 1 to rank N
		for (let i = 0; i < maxRankN; i++) {
			if (b.rankCounts[i] !== a.rankCounts[i]) {
				return b.rankCounts[i] - a.rankCounts[i];
			}
		}

		// Alphabetical by title
		const titleCompare = a.title.localeCompare(b.title);
		if (titleCompare !== 0) return titleCompare;

		// TMDb ID (ascending)
		return a.tmdbId - b.tmdbId;
	});

	// Assign positions with tie detection
	const standings: Standing[] = [];
	let currentPosition = 1;

	for (let i = 0; i < sortedScores.length; i++) {
		const score = sortedScores[i];
		const prevScore = i > 0 ? sortedScores[i - 1] : null;

		// Check if tied with previous
		const isTied =
			prevScore !== null &&
			score.totalPoints === prevScore.totalPoints &&
			score.rankCounts.every((c, idx) => c === prevScore.rankCounts[idx]);

		if (!isTied && i > 0) {
			currentPosition = i + 1;
		}

		// Check if tied with next
		const nextScore = i < sortedScores.length - 1 ? sortedScores[i + 1] : null;
		const tiedWithNext =
			nextScore !== null &&
			score.totalPoints === nextScore.totalPoints &&
			score.rankCounts.every((c, idx) => c === nextScore.rankCounts[idx]);

		standings.push({
			...score,
			position: currentPosition,
			tied: isTied || tiedWithNext
		});
	}

	return standings;
}

export function getPointsBreakdown(
	maxRankN: number
): Array<{ rank: number; points: number; label: string }> {
	const breakdown = [];
	for (let rank = 1; rank <= maxRankN; rank++) {
		breakdown.push({
			rank,
			points: calculatePoints(rank, maxRankN),
			label: `Rank ${rank}`
		});
	}
	return breakdown;
}
