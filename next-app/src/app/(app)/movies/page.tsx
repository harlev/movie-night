import { getAllMovies } from '@/lib/queries/movies';
import { getUserById } from '@/lib/queries/profiles';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import MoviesGrid from './MoviesGrid';

export const metadata: Metadata = {
  title: 'Movies - Movie Night',
};

export default async function MoviesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [movies, profile] = await Promise.all([
    getAllMovies(),
    user ? getUserById(user.id) : null,
  ]);

  return <MoviesGrid movies={movies} userRole={profile?.role} />;
}
