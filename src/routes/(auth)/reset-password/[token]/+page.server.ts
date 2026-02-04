import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { passwordResetTokens, users } from '$lib/server/db/schema';
import { hashToken, hashPassword } from '$lib/server/auth';
import { isValidPassword } from '$lib/utils';
import { eq, and, gt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform?.env.DB) {
		return { valid: false };
	}

	const db = getDb(platform.env.DB);
	const tokenHash = await hashToken(params.token);

	const [resetToken] = await db
		.select()
		.from(passwordResetTokens)
		.where(
			and(
				eq(passwordResetTokens.tokenHash, tokenHash),
				gt(passwordResetTokens.expiresAt, new Date().toISOString())
			)
		);

	return { valid: !!resetToken };
};

export const actions: Actions = {
	default: async ({ request, params, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Server configuration error' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const password = formData.get('password')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';

		// Validate token
		const tokenHash = await hashToken(params.token);
		const [resetToken] = await db
			.select()
			.from(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.tokenHash, tokenHash),
					gt(passwordResetTokens.expiresAt, new Date().toISOString())
				)
			);

		if (!resetToken) {
			return fail(400, { error: 'Invalid or expired reset link' });
		}

		// Validate password
		const passwordValidation = isValidPassword(password);
		if (!passwordValidation.valid) {
			return fail(400, { error: passwordValidation.error });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		// Update password
		const newPasswordHash = await hashPassword(password);
		await db
			.update(users)
			.set({
				passwordHash: newPasswordHash,
				updatedAt: new Date().toISOString()
			})
			.where(eq(users.id, resetToken.userId));

		// Delete the used token
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

		throw redirect(302, '/login?reset=success');
	}
};
