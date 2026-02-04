import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAllInvites, expireInvite, createAdminLog } from '$lib/server/db/queries';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		return { invites: [] };
	}

	const db = getDb(platform.env.DB);
	const allInvites = await getAllInvites(db);

	// Get creator and used-by names
	const invitesWithNames = await Promise.all(
		allInvites.map(async (invite) => {
			const [creator] = await db
				.select({ displayName: users.displayName })
				.from(users)
				.where(eq(users.id, invite.createdBy));

			let usedByName = null;
			if (invite.usedBy) {
				const [usedByUser] = await db
					.select({ displayName: users.displayName })
					.from(users)
					.where(eq(users.id, invite.usedBy));
				usedByName = usedByUser?.displayName;
			}

			return {
				...invite,
				creatorName: creator?.displayName || 'Unknown',
				usedByName
			};
		})
	);

	return { invites: invitesWithNames };
};

export const actions: Actions = {
	expire: async ({ request, platform, locals }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const inviteId = formData.get('inviteId')?.toString();

		if (!inviteId) {
			return fail(400, { error: 'Invalid request' });
		}

		await expireInvite(db, inviteId);

		await createAdminLog(db, {
			actorId: locals.user.id,
			action: 'invite_expired',
			targetType: 'invite',
			targetId: inviteId
		});

		return { success: true, message: 'Invite expired' };
	}
};
