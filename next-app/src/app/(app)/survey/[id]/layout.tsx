import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const socialCrawlers = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot/i;

interface LayoutProps {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: survey } = await supabase
    .from('surveys')
    .select('title, description')
    .eq('id', id)
    .single();

  if (!survey) {
    return { title: 'Survey Not Found' };
  }

  return {
    title: `${survey.title} - Movie Night`,
    description: survey.description || 'Vote on movies for movie night!',
    openGraph: {
      title: survey.title,
      description: survey.description || 'Vote on movies for movie night!',
      type: 'website',
    },
  };
}

export default async function SurveyLayout({ children }: LayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For social crawlers without auth, render empty body so metadata is served
  // without triggering the page's notFound() (which would cause a 404 + noindex)
  if (!user) {
    const headersList = await headers();
    const ua = headersList.get('user-agent') || '';
    if (socialCrawlers.test(ua)) {
      return <></>;
    }
  }

  return children;
}
