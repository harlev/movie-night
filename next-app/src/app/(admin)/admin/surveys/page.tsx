import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAllSurveys, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllBallots } from '@/lib/queries/ballots';

export const metadata: Metadata = {
  title: 'Manage Surveys - Admin',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStateColor(state: string): string {
  switch (state) {
    case 'live':
      return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
    case 'frozen':
      return 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]';
    default:
      return 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]';
  }
}

export default async function AdminSurveysPage() {
  const allSurveys = await getAllSurveys();

  const surveysWithCounts = await Promise.all(
    allSurveys.map(async (survey) => {
      const entries = await getSurveyEntries(survey.id);
      const ballots = await getAllBallots(survey.id);
      return {
        ...survey,
        movieCount: entries.length,
        ballotCount: ballots.length,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Surveys</h1>
        <Link
          href="/admin/surveys/new"
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Create Survey
        </Link>
      </div>

      {surveysWithCounts.length > 0 ? (
        <div className="bg-[var(--color-surface)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-elevated)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Survey
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Movies
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Ballots
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {surveysWithCounts.map((survey) => (
                <tr key={survey.id} className="hover:bg-[var(--color-surface-elevated)]/50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{survey.title}</p>
                      {survey.description && (
                        <p className="text-sm text-[var(--color-text-muted)] truncate max-w-xs">
                          {survey.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStateColor(survey.state)}`}>
                        {survey.state}
                      </span>
                      {survey.archived && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                          archived
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-muted)]">
                    {survey.movieCount}
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-muted)]">
                    {survey.ballotCount}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                    {formatDate(survey.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/surveys/${survey.id}`}
                      className="text-[var(--color-primary)] hover:underline text-sm"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No surveys created yet.</p>
          <Link
            href="/admin/surveys/new"
            className="inline-block mt-3 text-[var(--color-primary)] hover:underline"
          >
            Create your first survey
          </Link>
        </div>
      )}
    </div>
  );
}
