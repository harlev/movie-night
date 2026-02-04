import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { users, movies, surveys, ballots } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		return {
			stats: {
				totalUsers: 0,
				activeUsers: 0,
				totalMovies: 0,
				totalSurveys: 0,
				liveSurvey: null
			}
		};
	}

	const db = getDb(platform.env.DB);

	const [userCount] = await db.select({ count: count() }).from(users);
	const [activeUserCount] = await db
		.select({ count: count() })
		.from(users)
		.where(eq(users.status, 'active'));
	const [movieCount] = await db.select({ count: count() }).from(movies);
	const [surveyCount] = await db.select({ count: count() }).from(surveys);
	const [liveSurvey] = await db.select().from(surveys).where(eq(surveys.state, 'live')).limit(1);

	let liveSurveyStats = null;
	if (liveSurvey) {
		const [ballotCount] = await db
			.select({ count: count() })
			.from(ballots)
			.where(eq(ballots.surveyId, liveSurvey.id));
		liveSurveyStats = {
			...liveSurvey,
			ballotCount: ballotCount.count
		};
	}

	return {
		stats: {
			totalUsers: userCount.count,
			activeUsers: activeUserCount.count,
			totalMovies: movieCount.count,
			totalSurveys: surveyCount.count,
			liveSurvey: liveSurveyStats
		}
	};
};
