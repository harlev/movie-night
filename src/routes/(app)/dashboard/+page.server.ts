import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { surveys, movies, ballots, surveyEntries, users } from '$lib/server/db/schema';
import { eq, count, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform, locals }) => {
	if (!platform?.env.DB) {
		return {
			liveSurvey: null,
			recentMovies: [],
			stats: { totalMovies: 0, totalUsers: 0, surveysCompleted: 0 }
		};
	}

	const db = getDb(platform.env.DB);

	// Get live survey
	const [liveSurvey] = await db.select().from(surveys).where(eq(surveys.state, 'live')).limit(1);

	let surveyData = null;
	if (liveSurvey) {
		// Get entry count for live survey
		const [entryCount] = await db
			.select({ count: count() })
			.from(surveyEntries)
			.where(and(eq(surveyEntries.surveyId, liveSurvey.id), isNull(surveyEntries.removedAt)));

		// Check if user has voted
		const [userBallot] = await db
			.select()
			.from(ballots)
			.where(and(eq(ballots.surveyId, liveSurvey.id), eq(ballots.userId, locals.user!.id)));

		surveyData = {
			...liveSurvey,
			movieCount: entryCount.count,
			hasVoted: !!userBallot
		};
	}

	// Get recent movies (last 5, not hidden)
	const recentMovies = await db
		.select({
			id: movies.id,
			title: movies.title,
			tmdbId: movies.tmdbId,
			metadataSnapshot: movies.metadataSnapshot,
			createdAt: movies.createdAt
		})
		.from(movies)
		.where(eq(movies.hidden, false))
		.orderBy(movies.createdAt)
		.limit(5);

	// Get stats
	const [movieCount] = await db
		.select({ count: count() })
		.from(movies)
		.where(eq(movies.hidden, false));

	const [userCount] = await db
		.select({ count: count() })
		.from(users)
		.where(eq(users.status, 'active'));

	const [surveyCount] = await db
		.select({ count: count() })
		.from(surveys)
		.where(eq(surveys.state, 'frozen'));

	return {
		liveSurvey: surveyData,
		recentMovies,
		stats: {
			totalMovies: movieCount.count,
			totalUsers: userCount.count,
			surveysCompleted: surveyCount.count
		}
	};
};
