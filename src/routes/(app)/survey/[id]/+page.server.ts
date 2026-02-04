import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import {
	getSurveyById,
	getSurveyEntries,
	getBallot,
	getAllBallots,
	submitBallot
} from '$lib/server/db/queries';
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

	if (survey.state === 'draft') {
		throw error(404, 'Survey not found');
	}

	const entries = await getSurveyEntries(db, survey.id);
	const userBallot = await getBallot(db, survey.id, locals.user.id);
	const allBallots = await getAllBallots(db, survey.id);

	// Calculate standings
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

export const actions: Actions = {
	submit: async ({ request, params, platform, locals }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const survey = await getSurveyById(db, params.id);

		if (!survey) {
			return fail(404, { error: 'Survey not found' });
		}

		if (survey.state !== 'live') {
			return fail(400, { error: 'Survey is not accepting votes' });
		}

		const formData = await request.formData();
		const ranksJson = formData.get('ranks')?.toString();

		if (!ranksJson) {
			return fail(400, { error: 'No ballot submitted' });
		}

		let ranks: Array<{ rank: number; movieId: string }>;
		try {
			ranks = JSON.parse(ranksJson);
		} catch {
			return fail(400, { error: 'Invalid ballot data' });
		}

		// Validate ranks
		if (!Array.isArray(ranks)) {
			return fail(400, { error: 'Invalid ballot format' });
		}

		// Check for valid rank numbers
		const validRanks = ranks.filter(
			(r) => typeof r.rank === 'number' && r.rank >= 1 && r.rank <= survey.maxRankN && r.movieId
		);

		// Check for duplicate ranks
		const rankNumbers = validRanks.map((r) => r.rank);
		if (new Set(rankNumbers).size !== rankNumbers.length) {
			return fail(400, { error: 'Duplicate rank positions not allowed' });
		}

		// Check for duplicate movies
		const movieIds = validRanks.map((r) => r.movieId);
		if (new Set(movieIds).size !== movieIds.length) {
			return fail(400, { error: 'Cannot rank the same movie twice' });
		}

		// Verify movies are in survey
		const entries = await getSurveyEntries(db, survey.id);
		const validMovieIds = new Set(entries.map((e) => e.movieId));

		for (const { movieId } of validRanks) {
			if (!validMovieIds.has(movieId)) {
				return fail(400, { error: 'Invalid movie in ballot' });
			}
		}

		await submitBallot(db, {
			surveyId: survey.id,
			userId: locals.user.id,
			ranks: validRanks
		});

		return { success: true };
	}
};
