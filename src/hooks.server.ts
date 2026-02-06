import type { Handle } from '@sveltejs/kit';
import { verifyAccessToken, createAccessToken, generateRefreshToken } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import {
	getSessionByRefreshToken,
	getUserById,
	deleteSession,
	createSession
} from '$lib/server/db/queries';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const authHeader = event.request.headers.get('Authorization');
	const cookieToken = event.cookies.get('access_token');
	const token = authHeader?.replace('Bearer ', '') || cookieToken;

	if (token && event.platform?.env.JWT_SECRET) {
		const payload = await verifyAccessToken(token, event.platform.env.JWT_SECRET);
		if (payload) {
			event.locals.user = {
				id: payload.sub,
				email: payload.email,
				displayName: payload.displayName,
				role: payload.role
			};
		}
	}

	// Silent refresh: if no valid access token, try refresh token
	if (!event.locals.user && event.platform?.env.DB && event.platform?.env.JWT_SECRET) {
		const refreshToken = event.cookies.get('refresh_token');
		if (refreshToken) {
			try {
				const db = getDb(event.platform.env.DB);

				// Look up session by refresh token
				const session = await getSessionByRefreshToken(db, refreshToken);
				if (!session) {
					// Token not in DB (rotated or revoked)
					event.cookies.delete('access_token', { path: '/' });
					event.cookies.delete('refresh_token', { path: '/' });
				} else if (new Date(session.expiresAt) < new Date()) {
					// Refresh token expired — clean up
					await deleteSession(db, refreshToken);
					event.cookies.delete('access_token', { path: '/' });
					event.cookies.delete('refresh_token', { path: '/' });
				} else {
					// Session valid — verify user still active
					const user = await getUserById(db, session.userId);
					if (!user || user.status === 'disabled') {
						// User gone or disabled — reject refresh
						await deleteSession(db, refreshToken);
						event.cookies.delete('access_token', { path: '/' });
						event.cookies.delete('refresh_token', { path: '/' });
					} else {
						// Mint new access token
						const newAccessToken = await createAccessToken(
							{
								sub: user.id,
								email: user.email,
								displayName: user.displayName,
								role: user.role
							},
							event.platform.env.JWT_SECRET
						);

						// Rotate refresh token (delete old, create new)
						const newRefreshToken = generateRefreshToken();
						const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

						await deleteSession(db, refreshToken);
						await createSession(db, user.id, newRefreshToken, refreshExpires);

						// Set new cookies
						event.cookies.set('access_token', newAccessToken, {
							path: '/',
							httpOnly: true,
							secure: true,
							sameSite: 'lax',
							maxAge: 60 * 60 // 1 hour
						});

						event.cookies.set('refresh_token', newRefreshToken, {
							path: '/',
							httpOnly: true,
							secure: true,
							sameSite: 'lax',
							maxAge: 30 * 24 * 60 * 60 // 30 days
						});

						// Populate user
						event.locals.user = {
							id: user.id,
							email: user.email,
							displayName: user.displayName,
							role: user.role
						};
					}
				}
			} catch {
				// Transient DB error — clear cookies, user goes to login
				event.cookies.delete('access_token', { path: '/' });
				event.cookies.delete('refresh_token', { path: '/' });
			}
		}
	}

	// Protected routes check
	const pathname = event.url.pathname;

	// Auth routes - redirect to dashboard if already logged in
	if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
		if (event.locals.user) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/dashboard' }
			});
		}
	}

	// App routes - require authentication
	if (
		pathname.startsWith('/dashboard') ||
		pathname.startsWith('/survey') ||
		pathname.startsWith('/movies') ||
		pathname.startsWith('/history')
	) {
		if (!event.locals.user) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/login' }
			});
		}
	}

	// Admin routes - require admin role
	if (pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/login' }
			});
		}
		if (event.locals.user.role !== 'admin') {
			return new Response(null, {
				status: 302,
				headers: { Location: '/dashboard' }
			});
		}
	}

	return resolve(event);
};
