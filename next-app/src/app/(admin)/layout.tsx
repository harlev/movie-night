import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import { logout } from '@/lib/actions/auth';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getUserById(user.id);

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Navigation */}
      <nav className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <img src="/logo.png" alt="Movie Night" className="h-14" />
              </Link>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded">
                Admin
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Back to App
              </Link>
              <span className="text-[var(--color-text-muted)] text-sm">{profile.display_name}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <AdminSidebar />

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
