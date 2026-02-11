import { createClient } from '@/lib/supabase/server';
import { getLiveSurvey } from '@/lib/queries/surveys';
import { getBallot } from '@/lib/queries/ballots';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Survey History - Movie Night',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all frozen surveys
  const { data: frozenSurveys } = await supabase
    .from('surveys')
    .select('*')
    .eq('state', 'frozen')
    .order('frozen_at', { ascending: false });

  // Get live survey
  const liveSurvey = await getLiveSurvey().catch(() => null);

  // Get stats for each frozen survey
  const surveysWithStats = await Promise.all(
    (frozenSurveys || []).map(async (survey) => {
      const { count: entryCount } = await supabase
        .from('survey_entries')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', survey.id)
        .is('removed_at', null);

      const { count: ballotCount } = await supabase
        .from('ballots')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', survey.id);

      let userParticipated = false;
      if (user) {
        const userBallot = await getBallot(survey.id, user.id);
        userParticipated = !!userBallot;
      }

      return {
        ...survey,
        movieCount: entryCount || 0,
        ballotCount: ballotCount || 0,
        userParticipated,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Survey History</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Browse past surveys and their results
        </p>
      </div>

      {liveSurvey && (
        <div className="bg-[var(--color-surface)] rounded-lg p-4 border border-[var(--color-success)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded">
                  Live
                </span>
                <span className="font-medium text-[var(--color-text)]">{liveSurvey.title}</span>
              </div>
            </div>
            <Link
              href={`/survey/${liveSurvey.id}`}
              className="text-[var(--color-primary)] hover:underline text-sm"
            >
              Vote Now
            </Link>
          </div>
        </div>
      )}

      {surveysWithStats.length > 0 ? (
        <div className="space-y-3">
          {surveysWithStats.map((survey) => (
            <Link
              key={survey.id}
              href={`/history/${survey.id}`}
              className="block bg-[var(--color-surface)] rounded-lg p-4 hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--color-text)]">{survey.title}</h3>
                  {survey.description && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      {survey.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span>{survey.movieCount} movies</span>
                    <span>{survey.ballotCount} votes</span>
                    <span>Frozen {formatDate(survey.frozen_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {survey.userParticipated ? (
                    <span className="px-2 py-1 text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] rounded">
                      Voted
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] rounded">
                      Did not vote
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No completed surveys yet.</p>
        </div>
      )}
    </div>
  );
}
