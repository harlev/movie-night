'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { submitBallot } from '@/lib/queries/ballots';
import { getUserById } from '@/lib/queries/profiles';
import { finalizeExpiredSurveys, getSurveyById, getSurveyChoices } from '@/lib/queries/surveys';
import { createClient } from '@/lib/supabase/server';
import { resolveSurveyBallotOwner } from '@/lib/utils/surveyAccess';
import { isSurveyClosed } from '@/lib/utils/surveyConfig';

type BallotActionState = { error?: string; success?: boolean; message?: string };

function getSimpleSurveySuccessRedirect(surveyId: string, successRedirect: string | null): string | null {
  if (!successRedirect) return null;
  const [pathname, search = ''] = successRedirect.split('?');
  const expectedPathname = `/survey/${surveyId}/simple`;
  if (pathname !== expectedPathname) return null;
  const params = new URLSearchParams(search);
  if (params.get('view') !== 'results' || params.get('page') || params.get('submitted') !== '1') return null;
  return `${expectedPathname}?view=results&submitted=1`;
}

export async function submitBallotAction(
  _prevState: BallotActionState | null,
  formData: FormData
): Promise<BallotActionState> {
  const surveyId = String(formData.get('surveyId') ?? '');
  const ranksJson = String(formData.get('ranks') ?? '');
  const successRedirect = formData.get('successRedirect') as string | null;
  const guestName = String(formData.get('guestName') ?? '').trim() || null;
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'live' || isSurveyClosed({ state: survey.state, closesAt: survey.closes_at })) {
    await finalizeExpiredSurveys();
    return { error: 'Survey is not accepting votes' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getUserById(user.id) : null;
  const cookieStore = await cookies();
  const owner = resolveSurveyBallotOwner({
    membersOnly: survey.members_only,
    isAnonymous: survey.is_anonymous,
    userId: user?.id ?? null,
    userRole: profile?.role ?? null,
    voterId: cookieStore.get('survey_voter_id')?.value ?? null,
    guestName,
  });
  if ('error' in owner) return owner;
  if (!ranksJson) return { error: 'No ballot submitted' };

  let rawRanks: Array<{ rank: number; optionId?: string; movieId?: string }>;
  try {
    rawRanks = JSON.parse(ranksJson);
  } catch {
    return { error: 'Invalid ballot data' };
  }
  if (!Array.isArray(rawRanks) || rawRanks.length === 0) return { error: 'Please select at least one option' };
  if (rawRanks.length > survey.max_rank_n) return { error: 'Too many selections' };

  const choices = await getSurveyChoices(surveyId);
  const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
  const choicesByMovieId = new Map(
    choices.filter((choice) => choice.movie).map((choice) => [choice.movie!.id, choice])
  );
  const ranks: Array<{ rank: number; optionId: string }> = [];
  for (const rawRank of rawRanks) {
    const choice = rawRank.optionId
      ? choicesById.get(rawRank.optionId)
      : rawRank.movieId
        ? choicesByMovieId.get(rawRank.movieId)
        : null;
    if (!choice || !Number.isInteger(rawRank.rank) || rawRank.rank < 1 || rawRank.rank > survey.max_rank_n) {
      return { error: 'Invalid option in ballot' };
    }
    ranks.push({ rank: rawRank.rank, optionId: choice.id });
  }

  const rankNumbers = ranks.map((rank) => rank.rank);
  if (new Set(rankNumbers).size !== rankNumbers.length) return { error: 'Duplicate rank positions not allowed' };
  const optionIds = ranks.map((rank) => rank.optionId);
  if (new Set(optionIds).size !== optionIds.length) return { error: 'Cannot rank the same option twice' };

  await submitBallot({ surveyId, ...owner, ranks });
  revalidatePath(`/survey/${surveyId}`);
  revalidatePath(`/survey/${surveyId}/simple`);
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath('/dashboard');

  const validatedSuccessRedirect = getSimpleSurveySuccessRedirect(surveyId, successRedirect);
  if (survey.survey_type === 'movie' && validatedSuccessRedirect) redirect(validatedSuccessRedirect);
  return { success: true, message: 'Ballot submitted!' };
}
