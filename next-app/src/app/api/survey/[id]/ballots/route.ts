import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById } from '@/lib/queries/surveys';
import { getAllBallots } from '@/lib/queries/ballots';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const survey = await getSurveyById(id);

  if (!survey || survey.state === 'draft') {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  }

  const allBallots = await getAllBallots(survey.id);

  return NextResponse.json({
    ballots: allBallots.map((b) => ({
      user: b.user,
      ranks: b.ranks,
      updatedAt: b.ballot.updated_at,
    })),
    lastUpdated: new Date().toISOString(),
  });
}
