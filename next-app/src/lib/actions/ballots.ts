'use server';

import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { submitBallot } from '@/lib/queries/ballots';

export async function submitBallotAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const surveyId = formData.get('surveyId') as string;
  const ranksJson = formData.get('ranks') as string;

  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'live') return { error: 'Survey is not accepting votes' };

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

  await submitBallot({ surveyId: survey.id, userId: user.id, ranks: validRanks });
  return { success: true };
}
