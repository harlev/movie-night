import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getMovieById, getMovieComments, createMovieComment } from '$lib/server/db/queries';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform?.env.DB) {
		throw error(500, 'Database not configured');
	}

	const db = getDb(platform.env.DB);
	const movie = await getMovieById(db, params.id);

	if (!movie) {
		throw error(404, 'Movie not found');
	}

	if (movie.hidden) {
		throw error(404, 'Movie not found');
	}

	// Get suggester info
	const [suggester] = await db
		.select({ displayName: users.displayName })
		.from(users)
		.where(eq(users.id, movie.suggestedBy));

	// Get comments
	const comments = await getMovieComments(db, movie.id);

	return {
		movie,
		suggestedByName: suggester?.displayName || 'Unknown',
		comments
	};
};

export const actions: Actions = {
	comment: async ({ request, params, platform, locals }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const content = formData.get('content')?.toString()?.trim() || '';

		if (!content) {
			return fail(400, { error: 'Comment cannot be empty' });
		}

		if (content.length > 1000) {
			return fail(400, { error: 'Comment must be less than 1000 characters' });
		}

		await createMovieComment(db, {
			movieId: params.id,
			userId: locals.user.id,
			content
		});

		return { success: true };
	}
};
