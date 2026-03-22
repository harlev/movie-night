'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { upsertBallot } from '@/lib/queries/ballots';
import { getUserById } from '@/lib/queries/profiles';
import { getSurveyGuestSessionIdHash } from '@/lib/utils/surveyGuest.server';

function getSimpleSurveySuccessRedirect(
  surveyId: string,
  successRedirect: string | null
): string | null {
  if (!successRedirect) {
    return null;
  }

  const [pathname, search = ''] = successRedirect.split('?');
  const expectedPathname = `/survey/${surveyId}/simple`;
  if (pathname !== expectedPathname) {
    return null;
  }

  const params = new URLSearchParams(search);
  const view = params.get('view');
  const page = params.get('page');
  const submitted = params.get('submitted');
  if (view !== 'results' || page || submitted !== '1') {
    return null;
  }

  return `${expectedPathname}?view=results&submitted=1`;
}

export async function submitBallotAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const surveyId = formData.get('surveyId') as string;
  const ranksJson = formData.get('ranks') as string;
  const successRedirect = formData.get('successRedirect') as string | null;
  const rawSubmissionMode = formData.get('submissionMode') as string | null;
  const guestDisplayName = (formData.get('guestDisplayName') as string | null)?.trim() || null;
  const guestSessionIdHash = await getSurveyGuestSessionIdHash(surveyId);

  if (rawSubmissionMode && rawSubmissionMode !== 'identified' && rawSubmissionMode !== 'guest_named') {
    return { error: 'Invalid submission mode' };
  }

  const submissionMode = rawSubmissionMode ?? 'identified';

  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'live') return { error: 'Survey is not accepting votes' };
  const validatedSuccessRedirect = getSimpleSurveySuccessRedirect(
    surveyId,
    successRedirect
  );

  if (!ranksJson) return { error: 'No ballot submitted' };

  let ranks: Array<{ rank: number; movieId: string }>;
  try {
    ranks = JSON.parse(ranksJson);
  } catch {
    return { error: 'Invalid ballot data' };
  }

  if (!Array.isArray(ranks)) return { error: 'Invalid ballot format' };

  const validRanks = ranks.filter(
    (r) => typeof r.rank === 'number' && r.rank >= 1 && r.rank <= survey.max_rank_n && r.movieId
  );

  const rankNumbers = validRanks.map((r) => r.rank);
  if (new Set(rankNumbers).size !== rankNumbers.length) return { error: 'Duplicate rank positions not allowed' };

  const movieIds = validRanks.map((r) => r.movieId);
  if (new Set(movieIds).size !== movieIds.length) return { error: 'Cannot rank the same movie twice' };

  const entries = await getSurveyEntries(surveyId);
  const validMovieIds = new Set(entries.map((e) => e.movie_id));
  for (const { movieId } of validRanks) {
    if (!validMovieIds.has(movieId)) return { error: 'Invalid movie in ballot' };
  }

  if (submissionMode === 'guest_named') {
    if (!guestDisplayName) {
      return { error: 'Enter your name to vote as guest' };
    }
  }

  try {
    if (submissionMode === 'identified') {
      if (!user) {
        return { error: 'Please sign in to submit with an account' };
      }

      const profile = await getUserById(user.id);
      if (profile?.role === 'viewer') return { error: 'Viewers cannot submit ballots' };

      await upsertBallot({
        surveyId: survey.id,
        ownerMode: 'identified',
        userId: user.id,
        identifiedDisplayName: profile?.display_name || null,
        guestDisplayName: null,
        guestSessionIdHash: null,
        ranks: validRanks,
      });
    } else if (submissionMode === 'guest_named') {
      if (!guestSessionIdHash) {
        return { error: 'Guest voting requires cookies to stay enabled' };
      }

      await upsertBallot({
        surveyId: survey.id,
        ownerMode: 'guest',
        userId: null,
        identifiedDisplayName: null,
        guestDisplayName: submissionMode === 'guest_named' ? guestDisplayName : null,
        guestSessionIdHash,
        ranks: validRanks,
      });
    } else {
      return { error: 'Invalid submission mode' };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Failed to save ballot',
    };
  }

  revalidatePath(`/survey/${surveyId}`);
  revalidatePath(`/survey/${surveyId}/simple`);
  revalidatePath('/dashboard');

  if (validatedSuccessRedirect) {
    redirect(validatedSuccessRedirect);
  }

  return { success: true };
}
