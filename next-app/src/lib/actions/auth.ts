'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isValidEmail, isValidDisplayName } from '@/lib/utils/validation';
import { validateInviteCode } from '@/lib/queries/invites';

// --- Cookie helpers ---

async function setPendingSignupCookie(data: { inviteCode: string; displayName: string }) {
  const cookieStore = await cookies();
  cookieStore.set('pending_signup', JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
}

async function setPendingBootstrapCookie(data: { displayName: string }) {
  const cookieStore = await cookies();
  cookieStore.set('pending_bootstrap', JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
}

// --- Validate invite (signup step 1) ---

export async function validateInviteAndSetCookie(prevState: any, formData: FormData) {
  const inviteCode = formData.get('inviteCode') as string;
  const displayName = formData.get('displayName') as string;

  if (!inviteCode || !displayName) {
    return { error: 'All fields are required', inviteCode, displayName };
  }

  const nameValidation = isValidDisplayName(displayName);
  if (!nameValidation.valid) {
    return { error: nameValidation.error, inviteCode, displayName };
  }

  const inviteValidation = await validateInviteCode(inviteCode);
  if (!inviteValidation.valid || !inviteValidation.invite) {
    return { error: inviteValidation.error || 'Invalid invite code', inviteCode, displayName };
  }

  await setPendingSignupCookie({ inviteCode, displayName });

  return { success: true, inviteCode, displayName };
}

// --- Validate bootstrap (bootstrap step 1) ---

export async function validateBootstrapAndSetCookie(prevState: any, formData: FormData) {
  const displayName = formData.get('displayName') as string;

  if (!displayName) {
    return { error: 'Display name is required', displayName };
  }

  const nameValidation = isValidDisplayName(displayName);
  if (!nameValidation.valid) {
    return { error: nameValidation.error, displayName };
  }

  const admin = createAdminClient();
  const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true });
  if (count && count > 0) {
    return { error: 'Bootstrap is no longer available' };
  }

  await setPendingBootstrapCookie({ displayName });

  return { success: true, displayName };
}

// --- Magic link (email OTP) ---

export async function sendMagicLink(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const flow = formData.get('flow') as string;

  if (!email) return { error: 'Email is required' };
  if (!isValidEmail(email)) return { error: 'Invalid email format' };

  // For login flow: check if user is disabled
  if (flow === 'login') {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('status')
      .eq('email', email.toLowerCase())
      .single();
    if (profile?.status === 'disabled') {
      return { error: 'Your account has been disabled' };
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: 'Failed to send magic link. Please try again.' };
  }

  return { success: true };
}

// --- OAuth sign-in (Google) ---

export async function signInWithOAuth() {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: 'Failed to initiate sign-in. Please try again.' };
  }

  redirect(data.url);
}

// --- Logout ---

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
