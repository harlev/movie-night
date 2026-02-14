import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateInviteCode, recordInviteUse } from '@/lib/queries/invites';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

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
    .select('id, status')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    // Existing user — check if disabled
    if (existingProfile.status === 'disabled') {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=account_disabled`);
    }
    // Clear any stale cookies
    cookieStore.delete('pending_signup');
    cookieStore.delete('pending_bootstrap');
    return NextResponse.redirect(`${origin}/dashboard`);
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
        return NextResponse.redirect(`${origin}/dashboard`);
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
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch {
      // Invalid cookie data, fall through
    }
    cookieStore.delete('pending_signup');
  }

  // No profile, no valid cookie: unauthorized signup
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/signup?error=no_invite`);
}
