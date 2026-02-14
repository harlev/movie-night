import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import SettingsForm from './SettingsForm';

export const metadata: Metadata = {
  title: 'Settings - Movie Night',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getUserById(user.id);
  if (!profile) redirect('/login');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Manage your profile
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20 p-6">
        <SettingsForm displayName={profile.display_name} email={profile.email} />
      </div>
    </div>
  );
}
