'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { AdminLog, BallotChangeLog, Survey } from '@/lib/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface LogsClientProps {
  adminLogs: (AdminLog & { actorName: string })[];
  ballotLogs: (BallotChangeLog & { userName: string })[];
  surveys: Survey[];
  selectedTab: string;
  selectedSurveyId: string | null;
}

export default function LogsClient({
  adminLogs,
  ballotLogs,
  surveys,
  selectedTab,
  selectedSurveyId,
}: LogsClientProps) {
  const router = useRouter();

  function handleSurveyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/admin/logs?tab=ballots&surveyId=${value}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Activity Logs</h1>
        <p className="text-[var(--color-text-muted)] mt-1">View admin actions and ballot changes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        <a
          href="/admin/logs?tab=admin"
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === 'admin'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Admin Logs
        </a>
        <a
          href="/admin/logs?tab=ballots"
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === 'ballots'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Ballot Changes
        </a>
      </div>

      {selectedTab === 'admin' ? (
        <>
          {adminLogs.length > 0 ? (
            <div className="bg-[var(--color-surface)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--color-surface-elevated)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {adminLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--color-surface-elevated)]/50">
                      <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                        {log.actorName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-[var(--color-surface-elevated)] text-[var(--color-text)]">
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        {log.target_type}: {log.target_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                        {log.details ? (
                          <code className="bg-[var(--color-surface-elevated)] px-1 rounded">
                            {JSON.stringify(log.details)}
                          </code>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
              <p className="text-[var(--color-text-muted)]">No admin activity yet.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Ballot Change Logs */}
          <div className="bg-[var(--color-surface)] rounded-lg p-4 mb-4">
            <label htmlFor="surveySelect" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Select Survey
            </label>
            <select
              id="surveySelect"
              onChange={handleSurveyChange}
              defaultValue={selectedSurveyId || ''}
              className="w-full max-w-xs px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            >
              <option value="">Choose a survey...</option>
              {surveys.map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.title} ({survey.state})
                </option>
              ))}
            </select>
          </div>

          {selectedSurveyId ? (
            ballotLogs.length > 0 ? (
              <div className="bg-[var(--color-surface)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--color-surface-elevated)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Changes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {ballotLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--color-surface-elevated)]/50">
                        <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                          {log.userName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              log.reason === 'movie_removed'
                                ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                                : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            }`}
                          >
                            {formatAction(log.reason)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                          {log.new_ranks && log.new_ranks.length > 0
                            ? `${log.new_ranks.length} rank(s)`
                            : 'Empty ballot'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
                <p className="text-[var(--color-text-muted)]">No ballot changes for this survey.</p>
              </div>
            )
          ) : (
            <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
              <p className="text-[var(--color-text-muted)]">Select a survey to view ballot changes.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
