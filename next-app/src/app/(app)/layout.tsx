import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import AppNav from '@/components/AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getUserById(user.id);

  if (!profile || profile.status === 'disabled') {
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppNav
        user={{
          displayName: profile.display_name,
          role: profile.role,
          email: profile.email,
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
