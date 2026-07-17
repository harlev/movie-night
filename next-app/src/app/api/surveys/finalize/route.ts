import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { finalizeExpiredSurveys } from '@/lib/queries/surveys';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const surveyIds = await finalizeExpiredSurveys();
  for (const surveyId of surveyIds) {
    revalidatePath(`/survey/${surveyId}`);
    revalidatePath(`/admin/surveys/${surveyId}`);
  }
  revalidatePath('/admin/surveys');
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/leaderboard');

  return NextResponse.json({ finalized: surveyIds.length, surveyIds });
}
