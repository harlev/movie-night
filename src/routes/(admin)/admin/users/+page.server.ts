import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAllUsers, updateUser, createAdminLog } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		return { users: [] };
	}

	const db = getDb(platform.env.DB);
	const users = await getAllUsers(db);

	return { users };
};

export const actions: Actions = {
	updateStatus: async ({ request, platform, locals }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const status = formData.get('status')?.toString() as 'active' | 'disabled';

		if (!userId || !['active', 'disabled'].includes(status)) {
			return fail(400, { error: 'Invalid request' });
		}

		// Prevent self-disable
		if (userId === locals.user.id && status === 'disabled') {
			return fail(400, { error: 'Cannot disable your own account' });
		}

		const user = await updateUser(db, userId, { status });

		if (!user) {
			return fail(404, { error: 'User not found' });
		}

		await createAdminLog(db, {
			actorId: locals.user.id,
			action: status === 'disabled' ? 'user_disabled' : 'user_enabled',
			targetType: 'user',
			targetId: userId,
			details: { newStatus: status }
		});

		return { success: true, message: `User ${status === 'disabled' ? 'disabled' : 'enabled'}` };
	},

	updateRole: async ({ request, platform, locals }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const role = formData.get('role')?.toString() as 'admin' | 'member';

		if (!userId || !['admin', 'member'].includes(role)) {
			return fail(400, { error: 'Invalid request' });
		}

		// Prevent self-demotion
		if (userId === locals.user.id && role === 'member') {
			return fail(400, { error: 'Cannot remove your own admin role' });
		}

		const user = await updateUser(db, userId, { role });

		if (!user) {
			return fail(404, { error: 'User not found' });
		}

		await createAdminLog(db, {
			actorId: locals.user.id,
			action: 'role_changed',
			targetType: 'user',
			targetId: userId,
			details: { newRole: role }
		});

		return { success: true, message: `User role updated to ${role}` };
	}
};
