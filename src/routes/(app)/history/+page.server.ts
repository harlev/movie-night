import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { surveys, ballots, surveyEntries } from '$lib/server/db/schema';
import { eq, count, desc, isNull, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform, locals }) => {
	if (!platform?.env.DB) {
		return { surveys: [] };
	}

	const db = getDb(platform.env.DB);

	// Get all frozen surveys
	const frozenSurveys = await db
		.select()
		.from(surveys)
		.where(eq(surveys.state, 'frozen'))
		.orderBy(desc(surveys.frozenAt));

	// Get counts for each survey
	const surveysWithStats = await Promise.all(
		frozenSurveys.map(async (survey) => {
			const [entryCount] = await db
				.select({ count: count() })
				.from(surveyEntries)
				.where(and(eq(surveyEntries.surveyId, survey.id), isNull(surveyEntries.removedAt)));

			const [ballotCount] = await db
				.select({ count: count() })
				.from(ballots)
				.where(eq(ballots.surveyId, survey.id));

			// Check if user participated
			const [userBallot] = await db
				.select()
				.from(ballots)
				.where(and(eq(ballots.surveyId, survey.id), eq(ballots.userId, locals.user!.id)));

			return {
				...survey,
				movieCount: entryCount.count,
				ballotCount: ballotCount.count,
				userParticipated: !!userBallot
			};
		})
	);

	// Also include the live survey if any
	const [liveSurvey] = await db.select().from(surveys).where(eq(surveys.state, 'live')).limit(1);

	return {
		surveys: surveysWithStats,
		liveSurvey: liveSurvey || null
	};
};
