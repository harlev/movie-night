import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createUser, createSession } from '$lib/server/db/queries';
import { createAccessToken, generateRefreshToken } from '$lib/server/auth';
import { isValidEmail, isValidPassword, isValidDisplayName } from '$lib/utils';
import { count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		return { canBootstrap: false };
	}

	const db = getDb(platform.env.DB);
	const [userCount] = await db.select({ count: count() }).from(users);

	// Only allow bootstrap if no users exist
	if (userCount.count > 0) {
		throw redirect(302, '/login');
	}

	return { canBootstrap: true };
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured (D1 binding missing)' });
		}
		if (!platform?.env.JWT_SECRET) {
			return fail(500, { error: 'JWT_SECRET not configured' });
		}

		const db = getDb(platform.env.DB);

		// Double-check no users exist
		const [userCount] = await db.select({ count: count() }).from(users);
		if (userCount.count > 0) {
			return fail(400, { error: 'Bootstrap is no longer available' });
		}

		const formData = await request.formData();
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';
		const displayName = formData.get('displayName')?.toString() || '';

		if (!email || !password || !displayName) {
			return fail(400, { error: 'All fields are required', email, displayName });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'Invalid email format', email, displayName });
		}

		const passwordValidation = isValidPassword(password);
		if (!passwordValidation.valid) {
			return fail(400, { error: passwordValidation.error, email, displayName });
		}

		const nameValidation = isValidDisplayName(displayName);
		if (!nameValidation.valid) {
			return fail(400, { error: nameValidation.error, email, displayName });
		}

		// Create admin user
		const user = await createUser(db, {
			email,
			password,
			displayName,
			role: 'admin'
		});

		// Create session and log them in
		const accessToken = await createAccessToken(
			{
				sub: user.id,
				email: user.email,
				displayName: user.displayName,
				role: user.role
			},
			platform.env.JWT_SECRET
		);

		const refreshToken = generateRefreshToken();
		const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

		await createSession(db, user.id, refreshToken, refreshExpires);

		cookies.set('access_token', accessToken, {
			path: '/',
			httpOnly: true,
			secure: false, // Allow HTTP for local dev
			sameSite: 'lax',
			maxAge: 15 * 60
		});

		cookies.set('refresh_token', refreshToken, {
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60
		});

		throw redirect(302, '/dashboard');
	}
};
