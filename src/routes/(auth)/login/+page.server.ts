import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getUserByEmail, createSession } from '$lib/server/db/queries';
import { verifyPassword, createAccessToken, generateRefreshToken } from '$lib/server/auth';
import { isValidEmail } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		if (!platform?.env.DB || !platform?.env.JWT_SECRET) {
			return fail(500, { error: 'Server configuration error', email: '' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'Invalid email format', email });
		}

		const user = await getUserByEmail(db, email);
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		if (user.status === 'disabled') {
			return fail(400, { error: 'Your account has been disabled', email });
		}

		const validPassword = await verifyPassword(password, user.passwordHash);
		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Create tokens
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
		const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await createSession(db, user.id, refreshToken, refreshExpires);

		// Set cookies
		cookies.set('access_token', accessToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 15 * 60 // 15 minutes
		});

		cookies.set('refresh_token', refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 // 30 days
		});

		throw redirect(302, '/dashboard');
	}
};
