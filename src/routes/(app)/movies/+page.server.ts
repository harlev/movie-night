import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAllMovies } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		return { movies: [] };
	}

	const db = getDb(platform.env.DB);
	const movies = await getAllMovies(db);

	return { movies };
};
