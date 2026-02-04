import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { deleteSession } from '$lib/server/db/queries';

export const load: PageServerLoad = async () => {
	throw redirect(302, '/login');
};

export const actions: Actions = {
	default: async ({ cookies, platform }) => {
		const refreshToken = cookies.get('refresh_token');

		if (refreshToken && platform?.env.DB) {
			const db = getDb(platform.env.DB);
			await deleteSession(db, refreshToken);
		}

		cookies.delete('access_token', { path: '/' });
		cookies.delete('refresh_token', { path: '/' });

		throw redirect(302, '/login');
	}
};
