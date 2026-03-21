import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import AppNav from '@/components/AppNav';
import PublicSurveyNav from '@/components/PublicSurveyNav';

const socialCrawlers = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot/i;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const ua = headersList.get('user-agent') || '';
  const pathname = headersList.get('x-pathname') || '';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Let social media crawlers through so they can read OG meta tags
    if (socialCrawlers.test(ua)) {
      return <>{children}</>;
    }
    if (pathname.startsWith('/survey/')) {
      return (
        <div className="min-h-screen bg-[var(--color-background)] overflow-x-hidden">
          <PublicSurveyNav />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      );
    }
    redirect('/login');
  }

  const profile = await getUserById(user.id);

  if (!profile || profile.status === 'disabled') {
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-x-hidden">
      <AppNav
        user={{
          displayName: profile.display_name,
          role: profile.role,
          email: profile.email,
          avatarUrl: user.user_metadata?.avatar_url,
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
