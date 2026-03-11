import { createClient } from '@/lib/supabase/server';

export interface SiteSettings {
  id: 'main';
  next_movie_night_override_date: string | null;
  next_movie_night_number: number | null;
  next_movie_id: string | null;
  next_movie_source_survey_id: string | null;
  updated_at: string;
  next_movie: {
    id: string;
    title: string;
    metadata_snapshot: {
      posterPath: string | null;
    } | null;
  } | null;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select(
      'id, next_movie_night_override_date, next_movie_night_number, next_movie_id, next_movie_source_survey_id, updated_at, movies!next_movie_id(id, title, metadata_snapshot)'
    )
    .eq('id', 'main')
    .maybeSingle();

  if (error) {
    console.error('Failed to load site settings:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    next_movie: (data as any).movies ?? null,
  } as SiteSettings;
}
