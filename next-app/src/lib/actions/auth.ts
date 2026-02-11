'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { isValidEmail, isValidPassword, isValidDisplayName } from '@/lib/utils/validation';
import { validateInviteCode, recordInviteUse } from '@/lib/queries/invites';

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required', email };
  }

  if (!isValidEmail(email)) {
    return { error: 'Invalid email format', email };
  }

  // Check if user is disabled (use admin client since user isn't authenticated yet, RLS would block)
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('status').eq('email', email.toLowerCase()).single();
  if (profile?.status === 'disabled') {
    return { error: 'Your account has been disabled', email };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: 'Invalid email or password', email };
  }

  return { success: true };
}

export async function signup(prevState: any, formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const displayName = formData.get('displayName') as string;
  const inviteCode = formData.get('inviteCode') as string;

  // Validate invite code first
  const inviteValidation = await validateInviteCode(inviteCode);
  if (!inviteValidation.valid || !inviteValidation.invite) {
    return { error: inviteValidation.error || 'Invalid invite code', email, displayName, inviteCode };
  }

  if (!email || !password || !displayName) {
    return { error: 'All fields are required', email, displayName, inviteCode };
  }

  if (!isValidEmail(email)) {
    return { error: 'Invalid email format', email, displayName, inviteCode };
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error, email, displayName, inviteCode };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match', email, displayName, inviteCode };
  }

  const nameValidation = isValidDisplayName(displayName);
  if (!nameValidation.valid) {
    return { error: nameValidation.error, email, displayName, inviteCode };
  }

  // Create user via admin (auto-confirms email, triggers profile creation)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (createError) {
    if (createError.message.includes('already')) {
      return { error: 'An account with this email already exists', displayName, inviteCode };
    }
    return { error: createError.message, email, displayName, inviteCode };
  }

  // Ensure profile exists (trigger may not be set up yet)
  const { data: existingProfile } = await admin.from('profiles').select('id').eq('id', newUser.user.id).single();
  if (!existingProfile) {
    await admin.from('profiles').insert({
      id: newUser.user.id,
      email: email.toLowerCase(),
      display_name: displayName,
      role: 'member',
      status: 'active',
    });
  }

  // Record invite usage
  await recordInviteUse(inviteValidation.invite.id, newUser.user.id);

  // Sign in the new user
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  return { success: true };
}

export async function bootstrap(prevState: any, formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;

  if (!email || !password || !displayName) {
    return { error: 'All fields are required', email, displayName };
  }

  if (!isValidEmail(email)) {
    return { error: 'Invalid email format', email, displayName };
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error, email, displayName };
  }

  const nameValidation = isValidDisplayName(displayName);
  if (!nameValidation.valid) {
    return { error: nameValidation.error, email, displayName };
  }

  // Double-check no users exist
  const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true });
  if (count && count > 0) {
    return { error: 'Bootstrap is no longer available' };
  }

  // Create admin user
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: 'admin' },
  });

  if (createError) {
    return { error: createError.message, email, displayName };
  }

  // Ensure profile exists (trigger may not be set up yet)
  const { data: existingProfile } = await admin.from('profiles').select('id').eq('id', newUser.user.id).single();
  if (!existingProfile) {
    await admin.from('profiles').insert({
      id: newUser.user.id,
      email: email.toLowerCase(),
      display_name: displayName,
      role: 'admin',
      status: 'active',
    });
  }

  // Sign in
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: `Account created but sign-in failed: ${signInError.message}`, email, displayName };
  }

  return { success: true };
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  if (!email) return { error: 'Email is required' };
  if (!isValidEmail(email)) return { error: 'Invalid email format' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  // Always return success to prevent email enumeration
  return { success: true };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: 'Failed to reset password. The link may have expired.' };
  }

  redirect('/login?reset=success');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
