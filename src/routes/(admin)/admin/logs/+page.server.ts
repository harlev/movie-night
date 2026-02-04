import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAdminLogs, getBallotChangeLogs } from '$lib/server/db/queries';
import { surveys } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform, url }) => {
	if (!platform?.env.DB) {
		return { adminLogs: [], ballotLogs: [], surveys: [] };
	}

	const db = getDb(platform.env.DB);
	const tab = url.searchParams.get('tab') || 'admin';
	const surveyId = url.searchParams.get('surveyId');

	// Get admin logs
	const adminLogs = await getAdminLogs(db, { limit: 100 });

	// Get all surveys for ballot log filter
	const allSurveys = await db.select().from(surveys).orderBy(desc(surveys.createdAt));

	// Get ballot change logs (optionally filtered by survey)
	let ballotLogs: Awaited<ReturnType<typeof getBallotChangeLogs>> = [];
	if (tab === 'ballots' && surveyId) {
		ballotLogs = await getBallotChangeLogs(db, surveyId);
	}

	return {
		adminLogs,
		ballotLogs,
		surveys: allSurveys,
		selectedTab: tab,
		selectedSurveyId: surveyId
	};
};
