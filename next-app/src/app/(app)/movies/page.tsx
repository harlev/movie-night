import { getAllMovies, autoMarkPastDueSurveyWinnersAsWatched } from '@/lib/queries/movies';
import { getSuggestedMovies } from '@/lib/queries/suggestions';
import { getUserById } from '@/lib/queries/profiles';
import { createClient } from '@/lib/supabase/server';
import { getSiteBanner } from '@/lib/queries/siteBanner';
import type { Metadata } from 'next';
import SiteBanner from '@/components/SiteBanner';
import MoviesGrid from './MoviesGrid';

export const metadata: Metadata = {
  title: 'Movies - Movie Night',
};

export default async function MoviesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await autoMarkPastDueSurveyWinnersAsWatched();

  const [movies, profile, suggestions, siteBanner] = await Promise.all([
    getAllMovies(),
    user ? getUserById(user.id) : null,
    user ? getSuggestedMovies(user.id) : [],
    getSiteBanner(),
  ]);

  return (
    <div className="space-y-6">
      <SiteBanner banner={siteBanner} />
      <MoviesGrid
        movies={movies}
        userRole={profile?.role}
        suggestions={suggestions}
        currentUserId={user?.id}
      />
    </div>
  );
}
