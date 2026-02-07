import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getUserByEmail } from '$lib/server/db/queries';
import { passwordResetTokens } from '$lib/server/db/schema';
import { generateId } from '$lib/utils';
import { hashToken } from '$lib/server/auth';
import { isValidEmail } from '$lib/utils';
import { sendEmail, buildPasswordResetEmail } from '$lib/server/services/email';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Server configuration error' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const email = formData.get('email')?.toString() || '';

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'Invalid email format' });
		}

		const user = await getUserByEmail(db, email);

		// Always return success to prevent email enumeration
		if (!user) {
			return { success: true };
		}

		// Generate reset token
		const token = crypto.getRandomValues(new Uint8Array(32));
		const tokenString = Array.from(token)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		const tokenHash = await hashToken(tokenString);

		// Store token (expires in 1 hour)
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
		await db.insert(passwordResetTokens).values({
			id: generateId(),
			userId: user.id,
			tokenHash,
			expiresAt: expiresAt.toISOString()
		});

		// Send reset email
		if (platform.env.EMAIL_API_KEY) {
			const resetUrl = `${new URL(request.url).origin}/reset-password/${tokenString}`;
			const { subject, html } = buildPasswordResetEmail(resetUrl);
			await sendEmail(platform.env.EMAIL_API_KEY, { to: email, subject, html });
		}

		return { success: true };
	}
};
