import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { createMovie, getMovieByTmdbId } from '$lib/server/db/queries';
import { searchMovies, getMovieDetails, createMetadataSnapshot } from '$lib/server/services/tmdb';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	search: async ({ request, platform }) => {
		if (!platform?.env.TMDB_API_KEY) {
			return fail(500, { error: 'TMDb API not configured' });
		}

		const formData = await request.formData();
		const query = formData.get('query')?.toString() || '';

		if (!query || query.length < 2) {
			return fail(400, { error: 'Search query must be at least 2 characters' });
		}

		try {
			const result = await searchMovies(platform.env.TMDB_API_KEY, query);
			return { searchResults: result.movies, query };
		} catch (error) {
			console.error('TMDb search error:', error);
			return fail(500, { error: 'Failed to search movies' });
		}
	},

	suggest: async ({ request, platform, locals }) => {
		if (!platform?.env.DB || !platform?.env.TMDB_API_KEY) {
			return fail(500, { error: 'Server configuration error' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const tmdbIdStr = formData.get('tmdbId')?.toString();

		if (!tmdbIdStr) {
			return fail(400, { error: 'No movie selected' });
		}

		const tmdbId = parseInt(tmdbIdStr, 10);
		if (isNaN(tmdbId)) {
			return fail(400, { error: 'Invalid movie ID' });
		}

		// Check if already exists
		const existing = await getMovieByTmdbId(db, tmdbId);
		if (existing) {
			return fail(400, { error: 'This movie has already been suggested' });
		}

		// Get full details from TMDb
		try {
			const details = await getMovieDetails(platform.env.TMDB_API_KEY, tmdbId);
			if (!details) {
				return fail(404, { error: 'Movie not found' });
			}

			const movie = await createMovie(db, {
				tmdbId: details.id,
				title: details.title,
				metadataSnapshot: createMetadataSnapshot(details),
				suggestedBy: locals.user.id
			});

			throw redirect(302, `/movies/${movie.id}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			console.error('Error creating movie:', error);
			return fail(500, { error: 'Failed to suggest movie' });
		}
	}
};
