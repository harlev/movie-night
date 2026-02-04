import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSurveyById, getSurveyEntries, getAllBallots } from '$lib/server/db/queries';
import { calculateStandings } from '$lib/server/services/scoring';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	if (!platform?.env.DB) {
		throw error(500, 'Database not configured');
	}

	if (!locals.user) {
		throw error(401, 'Not authenticated');
	}

	const db = getDb(platform.env.DB);
	const survey = await getSurveyById(db, params.id);

	if (!survey || survey.state === 'draft') {
		throw error(404, 'Survey not found');
	}

	const entries = await getSurveyEntries(db, survey.id);
	const allBallots = await getAllBallots(db, survey.id);

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

	return json({
		survey: {
			id: survey.id,
			state: survey.state,
			updatedAt: survey.updatedAt
		},
		ballotCount: allBallots.length,
		standings,
		lastUpdated: new Date().toISOString()
	});
};
