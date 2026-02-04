import type { Handle } from '@sveltejs/kit';
import { verifyAccessToken } from '$lib/server/auth';

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
