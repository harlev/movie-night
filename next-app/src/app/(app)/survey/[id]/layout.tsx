import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

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

export default function SurveyLayout({ children }: LayoutProps) {
  return children;
}
