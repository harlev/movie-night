import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { createSurvey } from '$lib/server/db/queries';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured', title: '', description: '', maxRankN: '3' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();

		const title = formData.get('title')?.toString()?.trim() || '';
		const description = formData.get('description')?.toString()?.trim() || '';
		const maxRankNStr = formData.get('maxRankN')?.toString() || '3';

		if (!title) {
			return fail(400, { error: 'Title is required', title, description, maxRankN: maxRankNStr });
		}

		if (title.length > 100) {
			return fail(400, {
				error: 'Title must be less than 100 characters',
				title,
				description,
				maxRankN: maxRankNStr
			});
		}

		const maxRankN = parseInt(maxRankNStr, 10);
		if (isNaN(maxRankN) || maxRankN < 1 || maxRankN > 10) {
			return fail(400, {
				error: 'Max rank must be between 1 and 10',
				title,
				description,
				maxRankN: maxRankNStr
			});
		}

		const survey = await createSurvey(db, {
			title,
			description: description || undefined,
			maxRankN
		});

		throw redirect(302, `/admin/surveys/${survey.id}`);
	}
};
