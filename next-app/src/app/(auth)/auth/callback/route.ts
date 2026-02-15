import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateInviteCode, recordInviteUse } from '@/lib/queries/invites';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Sanitize: only allow relative paths
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const admin = createAdminClient();
  const cookieStore = await cookies();

  // Check if user already has a profile
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, status, display_name')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    // Existing user — check if disabled
    if (existingProfile.status === 'disabled') {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=account_disabled`);
    }

    // The DB trigger may have created this profile with an email-prefix name.
    // If we have a better display name from cookies or OAuth metadata, update it.
    let betterName: string | null = null;

    const bootstrapCookie = cookieStore.get('pending_bootstrap');
    if (bootstrapCookie) {
      try {
        const { displayName } = JSON.parse(bootstrapCookie.value);
        if (displayName?.trim()) betterName = displayName.trim();
      } catch { /* ignore */ }
    }

    if (!betterName) {
      const signupCookie = cookieStore.get('pending_signup');
      if (signupCookie) {
        try {
          const { displayName } = JSON.parse(signupCookie.value);
          if (displayName?.trim()) betterName = displayName.trim();
        } catch { /* ignore */ }
      }
    }

    if (!betterName) {
      const fullName = user.user_metadata?.full_name?.trim();
      if (fullName && fullName.includes(' ')) {
        betterName = fullName;
      }
    }

    // Only update if we found a better name AND the current one looks like
    // a trigger default (email prefix) rather than a user-chosen name.
    const emailPrefix = user.email!.split('@')[0];
    if (betterName && existingProfile.display_name === emailPrefix) {
      await admin
        .from('profiles')
        .update({ display_name: betterName })
        .eq('id', user.id);
    }

    // Clear any stale cookies
    cookieStore.delete('pending_signup');
    cookieStore.delete('pending_bootstrap');
    return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`);
  }

  // --- New user: needs profile provisioning ---

  // Check for bootstrap cookie
  const bootstrapCookie = cookieStore.get('pending_bootstrap');
  if (bootstrapCookie) {
    try {
      const { displayName } = JSON.parse(bootstrapCookie.value);
      const resolvedName = displayName?.trim() || user.email!.split('@')[0];

      // Verify profiles table is still empty
      const { count } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!count || count === 0) {
        await admin.from('profiles').insert({
          id: user.id,
          email: user.email!.toLowerCase(),
          display_name: resolvedName,
          role: 'admin',
          status: 'active',
        });
        cookieStore.delete('pending_bootstrap');
        return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`);
      }
    } catch {
      // Invalid cookie data, fall through
    }
    cookieStore.delete('pending_bootstrap');
  }

  // Check for signup cookie
  const signupCookie = cookieStore.get('pending_signup');
  if (signupCookie) {
    try {
      const { inviteCode, displayName } = JSON.parse(signupCookie.value);
      const resolvedName = displayName?.trim() || user.email!.split('@')[0];

      // Re-validate invite code (could have expired)
      const inviteValidation = await validateInviteCode(inviteCode);
      if (inviteValidation.valid && inviteValidation.invite) {
        await admin.from('profiles').insert({
          id: user.id,
          email: user.email!.toLowerCase(),
          display_name: resolvedName,
          role: 'member',
          status: 'active',
        });
        await recordInviteUse(inviteValidation.invite.id, user.id);
        cookieStore.delete('pending_signup');
        return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`);
      }
    } catch {
      // Invalid cookie data, fall through
    }
    cookieStore.delete('pending_signup');
  }

  // New user arriving from a poll — auto-create profile (no invite needed)
  if (safeNext && safeNext.startsWith('/poll/')) {
    const emailPrefix = user.email!.split('@')[0];
    const fullName = user.user_metadata?.full_name?.trim();
    // Google OAuth provides a real full_name; magic link users may get a
    // generic default from Supabase (e.g. "user"), so only use full_name
    // if it looks like an actual name (contains a space, like "John Doe").
    const displayName = (fullName && fullName.includes(' '))
      ? fullName
      : emailPrefix;

    await admin.from('profiles').insert({
      id: user.id,
      email: user.email!.toLowerCase(),
      display_name: displayName,
      role: 'member',
      status: 'active',
    });

    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  // No profile, no valid cookie, not a poll signup: unauthorized signup
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/signup?error=no_invite`);
}
