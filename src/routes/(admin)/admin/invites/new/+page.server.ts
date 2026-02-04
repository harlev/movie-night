import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { createInvite, createAdminLog } from '$lib/server/db/queries';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform, locals }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const expiresInDaysStr = formData.get('expiresInDays')?.toString() || '7';

		const expiresInDays = parseInt(expiresInDaysStr, 10);
		if (isNaN(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
			return fail(400, { error: 'Expiration must be between 1 and 30 days' });
		}

		const invite = await createInvite(db, locals.user.id, expiresInDays);

		await createAdminLog(db, {
			actorId: locals.user.id,
			action: 'invite_created',
			targetType: 'invite',
			targetId: invite.id,
			details: { code: invite.code, expiresInDays }
		});

		return { success: true, invite };
	}
};
