import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/queries/profiles';
import SuggestMovieForm from './SuggestMovieForm';

export default async function SuggestMoviePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const profile = await getUserById(user.id);
    if (profile?.role === 'viewer') {
      redirect('/movies');
    }
  }

  return <SuggestMovieForm />;
}
