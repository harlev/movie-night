import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllBallots } from '@/lib/queries/ballots';
import { calculateStandings } from '@/lib/services/scoring';

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

  const entries = await getSurveyEntries(survey.id);
  const allBallots = await getAllBallots(survey.id);

  const standings = calculateStandings(
    allBallots.map((b) => ({ ranks: b.ranks })),
    entries.map((e) => ({
      id: e.movie.id,
      title: e.movie.title,
      tmdbId: e.movie.tmdb_id,
      metadataSnapshot: e.movie.metadata_snapshot,
    })),
    survey.max_rank_n
  );

  return NextResponse.json({
    survey: {
      id: survey.id,
      state: survey.state,
      updatedAt: survey.updated_at,
    },
    ballotCount: allBallots.length,
    standings,
    lastUpdated: new Date().toISOString(),
  });
}
