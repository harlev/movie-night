import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import {
	getUserByEmail,
	createUser,
	createSession,
	validateInviteCode,
	markInviteUsed
} from '$lib/server/db/queries';
import { createAccessToken, generateRefreshToken } from '$lib/server/auth';
import { isValidEmail, isValidPassword, isValidDisplayName } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	const inviteCode = url.searchParams.get('code') || '';
	return { inviteCode };
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		if (!platform?.env.DB || !platform?.env.JWT_SECRET) {
			return fail(500, { error: 'Server configuration error' });
		}

		const db = getDb(platform.env.DB);
		const formData = await request.formData();
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';
		const displayName = formData.get('displayName')?.toString() || '';
		const inviteCode = formData.get('inviteCode')?.toString() || '';

		// Validate invite code first
		const inviteValidation = await validateInviteCode(db, inviteCode);
		if (!inviteValidation.valid || !inviteValidation.invite) {
			return fail(400, {
				error: inviteValidation.error || 'Invalid invite code',
				email,
				displayName,
				inviteCode
			});
		}

		// Validate fields
		if (!email || !password || !displayName) {
			return fail(400, { error: 'All fields are required', email, displayName, inviteCode });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'Invalid email format', email, displayName, inviteCode });
		}

		const passwordValidation = isValidPassword(password);
		if (!passwordValidation.valid) {
			return fail(400, { error: passwordValidation.error, email, displayName, inviteCode });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', email, displayName, inviteCode });
		}

		const nameValidation = isValidDisplayName(displayName);
		if (!nameValidation.valid) {
			return fail(400, { error: nameValidation.error, email, displayName, inviteCode });
		}

		// Check if email already exists
		const existingUser = await getUserByEmail(db, email);
		if (existingUser) {
			return fail(400, { error: 'An account with this email already exists', displayName, inviteCode });
		}

		// Create user
		const user = await createUser(db, {
			email,
			password,
			displayName
		});

		// Mark invite as used
		await markInviteUsed(db, inviteValidation.invite.id, user.id);

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
		const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

		await createSession(db, user.id, refreshToken, refreshExpires);

		// Set cookies
		cookies.set('access_token', accessToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 15 * 60
		});

		cookies.set('refresh_token', refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60
		});

		throw redirect(302, '/dashboard');
	}
};
