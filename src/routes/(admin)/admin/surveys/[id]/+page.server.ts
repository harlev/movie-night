import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import {
	getSurveyById,
	updateSurvey,
	updateSurveyState,
	deleteSurvey,
	getSurveyEntries,
	addSurveyEntry,
	removeSurveyEntry,
	getAllMovies,
	removeBallotMovie,
	getSurveyEntryByMovieId
} from '$lib/server/db/queries';
import { ballots, surveyEntries } from '$lib/server/db/schema';
import { eq, count, isNull, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform?.env.DB) {
		throw error(500, 'Database not configured');
	}

	const db = getDb(platform.env.DB);
	const survey = await getSurveyById(db, params.id);

	if (!survey) {
		throw error(404, 'Survey not found');
	}

	const entries = await getSurveyEntries(db, survey.id);
	const [ballotCount] = await db
		.select({ count: count() })
		.from(ballots)
		.where(eq(ballots.surveyId, survey.id));

	// Get all available movies (not hidden)
	const allMovies = await getAllMovies(db);

	// Filter out movies already in survey
	const entryMovieIds = new Set(entries.map((e) => e.movieId));
	const availableMovies = allMovies.filter((m) => !entryMovieIds.has(m.id));

	return {
		survey,
		entries,
		ballotCount: ballotCount.count,
		availableMovies
	};
};

export const actions: Actions = {
	updateInfo: async ({ request, params, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform.env.DB);
		const survey = await getSurveyById(db, params.id);

		if (!survey) {
			return fail(404, { error: 'Survey not found' });
		}

		if (survey.state !== 'draft') {
			return fail(400, { error: 'Can only edit draft surveys' });
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString()?.trim() || '';
		const description = formData.get('description')?.toString()?.trim() || '';
		const maxRankNStr = formData.get('maxRankN')?.toString() || '3';

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		const maxRankN = parseInt(maxRankNStr, 10);
		if (isNaN(maxRankN) || maxRankN < 1 || maxRankN > 10) {
			return fail(400, { error: 'Max rank must be between 1 and 10' });
		}

		await updateSurvey(db, params.id, {
			title,
			description: description || null,
			maxRankN
		});

		return { success: true, message: 'Survey updated' };
	},

	changeState: async ({ request, params, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const newState = formData.get('state')?.toString() as 'draft' | 'live' | 'frozen';

		if (!['draft', 'live', 'frozen'].includes(newState)) {
			return fail(400, { error: 'Invalid state' });
		}

		const survey = await getSurveyById(db, params.id);
		if (!survey) {
			return fail(404, { error: 'Survey not found' });
		}

		// Validate state transitions
		if (survey.state === 'frozen') {
			return fail(400, { error: 'Cannot change state of frozen survey' });
		}

		if (survey.state === 'draft' && newState === 'frozen') {
			return fail(400, { error: 'Cannot freeze a draft survey directly' });
		}

		if (newState === 'live') {
			// Check if there are movies in the survey
			const [entryCount] = await db
				.select({ count: count() })
				.from(surveyEntries)
				.where(and(eq(surveyEntries.surveyId, survey.id), isNull(surveyEntries.removedAt)));

			if (entryCount.count === 0) {
				return fail(400, { error: 'Cannot go live without any movies' });
			}
		}

		const result = await updateSurveyState(db, params.id, newState);

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return { success: true, message: `Survey is now ${newState}` };
	},

	addMovie: async ({ request, params, platform, locals }) => {
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

		if (survey.state === 'frozen') {
			return fail(400, { error: 'Cannot add movies to frozen survey' });
		}

		const formData = await request.formData();
		const movieId = formData.get('movieId')?.toString();

		if (!movieId) {
			return fail(400, { error: 'Movie ID required' });
		}

		try {
			await addSurveyEntry(db, {
				surveyId: params.id,
				movieId,
				addedBy: locals.user.id
			});
			return { success: true, message: 'Movie added' };
		} catch (e) {
			return fail(400, { error: 'Movie already in survey' });
		}
	},

	removeMovie: async ({ request, params, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform.env.DB);
		const survey = await getSurveyById(db, params.id);

		if (!survey) {
			return fail(404, { error: 'Survey not found' });
		}

		if (survey.state === 'frozen') {
			return fail(400, { error: 'Cannot remove movies from frozen survey' });
		}

		const formData = await request.formData();
		const entryId = formData.get('entryId')?.toString();
		const movieId = formData.get('movieId')?.toString();

		if (!entryId) {
			return fail(400, { error: 'Entry ID required' });
		}

		// If survey is live and movieId provided, handle ballot updates
		if (survey.state === 'live' && movieId) {
			const { affectedUsers } = await removeBallotMovie(db, survey.id, movieId);
			await removeSurveyEntry(db, entryId);
			return {
				success: true,
				message: `Movie removed. ${affectedUsers.length} ballot(s) affected.`
			};
		}

		await removeSurveyEntry(db, entryId);
		return { success: true, message: 'Movie removed' };
	},

	delete: async ({ params, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform.env.DB);
		const survey = await getSurveyById(db, params.id);

		if (!survey) {
			return fail(404, { error: 'Survey not found' });
		}

		if (survey.state !== 'draft') {
			return fail(400, { error: 'Can only delete draft surveys' });
		}

		await deleteSurvey(db, params.id);
		throw redirect(302, '/admin/surveys');
	}
};
