import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { generateId } from '@/lib/utils/id';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Auth routes: redirect to dashboard if already logged in
  const authRoutes = ['/login', '/signup'];
  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Bootstrap: always allow through
  if (pathname === '/bootstrap') {
    return supabaseResponse;
  }

  // App routes: redirect to login if not logged in
  const appRoutes = ['/dashboard', '/movies', '/survey', '/history', '/settings'];
  if (!user && appRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Admin routes: redirect if not logged in
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Role check is done in the admin layout server component
  }

  // Set voter cookie for /poll/* routes (Quick Polls)
  // Logged-in users always get their user ID as voter ID (consistent across devices).
  // Anonymous users get a random ID (created once, persisted via cookie).
  if (pathname.startsWith('/poll/')) {
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    };

    if (user) {
      // Always set to user ID so it stays in sync across devices
      if (request.cookies.get('qp_voter_id')?.value !== user.id) {
        supabaseResponse.cookies.set('qp_voter_id', user.id, cookieOpts);
      }
    } else if (!request.cookies.get('qp_voter_id')?.value) {
      supabaseResponse.cookies.set('qp_voter_id', generateId(), cookieOpts);
    }
  }

  return supabaseResponse;
}
