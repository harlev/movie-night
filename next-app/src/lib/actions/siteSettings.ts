'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createAdminLog } from '@/lib/queries/admin';
import { getUserById } from '@/lib/queries/profiles';

export async function updateNextMovieNightOverrideAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const mode = formData.get('mode') === 'clear' ? 'clear' : 'set';
  const overrideDateRaw = (formData.get('overrideDate') as string | null)?.trim() ?? '';
  const overrideDate =
    mode === 'clear'
      ? null
      : /^\d{4}-\d{2}-\d{2}$/.test(overrideDateRaw)
        ? overrideDateRaw
        : null;

  if (mode === 'set' && !overrideDate) {
    return { error: 'Please choose a valid override date' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: updateError } = await admin.from('site_settings').upsert(
    {
      id: 'main',
      next_movie_night_override_date: overrideDate,
      updated_by: user.id,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (updateError) {
    console.error('Failed to update next movie night override:', updateError);
    return { error: 'Failed to update next movie night settings' };
  }

  await createAdminLog({
    actorId: user.id,
    action: mode === 'clear' ? 'next_movie_night_override_cleared' : 'next_movie_night_override_set',
    targetType: 'setting',
    targetId: 'main',
    details: {
      overrideDate,
    },
  });

  revalidatePath('/admin/site-settings');
  revalidatePath('/dashboard');

  return {
    success: true,
    message:
      mode === 'clear'
        ? 'Next movie night override cleared'
        : 'Next movie night override saved',
  };
}

export async function updateNextMovieNightNumberAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const numberRaw = (formData.get('nextMovieNightNumber') as string | null)?.trim() ?? '';
  const parsedNumber = Number.parseInt(numberRaw, 10);

  if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
    return { error: 'Please enter a valid movie night number (1 or greater)' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: updateError } = await admin.from('site_settings').upsert(
    {
      id: 'main',
      next_movie_night_number: parsedNumber,
      updated_by: user.id,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (updateError) {
    console.error('Failed to update next movie night number:', updateError);
    return { error: 'Failed to update next movie night number' };
  }

  await createAdminLog({
    actorId: user.id,
    action: 'next_movie_night_number_set',
    targetType: 'setting',
    targetId: 'main',
    details: {
      nextMovieNightNumber: parsedNumber,
    },
  });

  revalidatePath('/admin/site-settings');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: 'Next movie night number saved',
  };
}

export async function updateNextMovieSelectionAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getUserById(user.id);
  if (!profile || profile.role !== 'admin') return { error: 'Admin access required' };

  const mode = formData.get('mode') === 'clear' ? 'clear' : 'set';
  const movieIdRaw = (formData.get('movieId') as string | null)?.trim() ?? '';

  if (mode === 'set' && !movieIdRaw) {
    return { error: 'Please select a movie' };
  }

  const admin = createAdminClient();
  let selectedMovie: { id: string; title: string } | null = null;

  if (mode === 'set') {
    const { data: movie, error: movieError } = await admin
      .from('movies')
      .select('id, title')
      .eq('id', movieIdRaw)
      .eq('hidden', false)
      .maybeSingle();

    if (movieError) {
      console.error('Failed to validate next movie selection:', movieError);
      return { error: 'Failed to validate selected movie' };
    }
    if (!movie) {
      return { error: 'Selected movie was not found' };
    }

    selectedMovie = movie;
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin.from('site_settings').upsert(
    {
      id: 'main',
      next_movie_id: mode === 'clear' ? null : selectedMovie?.id ?? null,
      next_movie_source_survey_id: null,
      updated_by: user.id,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (updateError) {
    console.error('Failed to update next movie selection:', updateError);
    return { error: 'Failed to update next movie selection' };
  }

  await createAdminLog({
    actorId: user.id,
    action: mode === 'clear' ? 'next_movie_cleared' : 'next_movie_set_manual',
    targetType: 'setting',
    targetId: 'main',
    details: {
      movieId: selectedMovie?.id ?? null,
      movieTitle: selectedMovie?.title ?? null,
    },
  });

  revalidatePath('/admin/site-settings');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: mode === 'clear' ? 'Next movie cleared' : 'Next movie saved',
  };
}
