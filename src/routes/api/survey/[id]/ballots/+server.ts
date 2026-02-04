import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSurveyById, getAllBallots } from '$lib/server/db/queries';

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

	const allBallots = await getAllBallots(db, survey.id);

	return json({
		ballots: allBallots.map((b) => ({
			user: b.user,
			ranks: b.ranks,
			updatedAt: b.ballot.updatedAt
		})),
		lastUpdated: new Date().toISOString()
	});
};
