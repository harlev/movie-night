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
