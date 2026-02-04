import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAllSurveys } from '$lib/server/db/queries';
import { surveyEntries, ballots } from '$lib/server/db/schema';
import { eq, count, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		return { surveys: [] };
	}

	const db = getDb(platform.env.DB);
	const allSurveys = await getAllSurveys(db);

	// Get counts for each survey
	const surveysWithCounts = await Promise.all(
		allSurveys.map(async (survey) => {
			const [entryCount] = await db
				.select({ count: count() })
				.from(surveyEntries)
				.where(eq(surveyEntries.surveyId, survey.id));

			const [ballotCount] = await db
				.select({ count: count() })
				.from(ballots)
				.where(eq(ballots.surveyId, survey.id));

			return {
				...survey,
				movieCount: entryCount.count,
				ballotCount: ballotCount.count
			};
		})
	);

	return { surveys: surveysWithCounts };
};
