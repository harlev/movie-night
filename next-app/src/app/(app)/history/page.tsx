import { createClient } from '@/lib/supabase/server';
import { getLiveSurvey } from '@/lib/queries/surveys';
import { getBallot } from '@/lib/queries/ballots';
import Link from 'next/link';
import type { Metadata } from 'next';
import EmptyState from '@/components/ui/EmptyState';

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

  // Get all frozen, non-archived surveys
  const { data: frozenSurveys } = await supabase
    .from('surveys')
    .select('*')
    .eq('state', 'frozen')
    .eq('archived', false)
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Survey History</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Browse past surveys and their results
        </p>
      </div>

      {liveSurvey && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-success)]/40 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-full border border-[var(--color-success)]/20">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5 animate-pulse" />
                  Live
                </span>
                <span className="font-medium text-[var(--color-text)]">{liveSurvey.title}</span>
              </div>
            </div>
            <Link
              href={`/survey/${liveSurvey.id}`}
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm transition-colors"
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
              className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl hover:border-[var(--color-primary)]/30 transition-all duration-200"
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
                    <span className="px-2.5 py-1 text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-full border border-[var(--color-success)]/20">
                      Voted
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] rounded-full">
                      Did not vote
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <EmptyState
            icon="surveys"
            title="No completed surveys"
            description="Completed surveys and their results will appear here."
          />
        </div>
      )}
    </div>
  );
}
