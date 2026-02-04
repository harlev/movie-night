import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getSurveyById, getSurveyEntries, getAllBallots, getBallot } from '$lib/server/db/queries';
import { calculateStandings, getPointsBreakdown } from '$lib/server/services/scoring';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	if (!platform?.env.DB) {
		throw error(500, 'Database not configured');
	}

	if (!locals.user) {
		throw error(401, 'Not authenticated');
	}

	const db = getDb(platform.env.DB);
	const survey = await getSurveyById(db, params.id);

	if (!survey) {
		throw error(404, 'Survey not found');
	}

	// Only show frozen surveys in history (or redirect live to voting page)
	if (survey.state === 'draft') {
		throw error(404, 'Survey not found');
	}

	if (survey.state === 'live') {
		// Could redirect to /survey/[id] but for now just show it
	}

	const entries = await getSurveyEntries(db, survey.id);
	const userBallot = await getBallot(db, survey.id, locals.user.id);
	const allBallots = await getAllBallots(db, survey.id);

	// Calculate final standings
	const standings = calculateStandings(
		allBallots.map((b) => ({ ranks: b.ranks })),
		entries.map((e) => ({
			id: e.movie.id,
			title: e.movie.title,
			tmdbId: e.movie.tmdbId,
			metadataSnapshot: e.movie.metadataSnapshot
		})),
		survey.maxRankN
	);

	const pointsBreakdown = getPointsBreakdown(survey.maxRankN);

	return {
		survey,
		entries,
		userBallot,
		allBallots,
		standings,
		pointsBreakdown
	};
};
