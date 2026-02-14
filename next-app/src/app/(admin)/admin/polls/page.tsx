import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPolls, getPollMovies, getPollVoteCount } from '@/lib/queries/polls';

export const metadata: Metadata = {
  title: 'Quick Polls - Admin',
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
    case 'closed':
      return 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]';
    default:
      return 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]';
  }
}

export default async function AdminPollsPage() {
  const allPolls = await getAllPolls();

  const pollsWithCounts = await Promise.all(
    allPolls.map(async (poll) => {
      const movies = await getPollMovies(poll.id);
      const voteCount = await getPollVoteCount(poll.id);
      return {
        ...poll,
        movieCount: movies.length,
        voteCount,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Quick Polls</h1>
        <Link
          href="/admin/polls/new"
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Poll
        </Link>
      </div>

      {pollsWithCounts.length > 0 ? (
        <div className="bg-[var(--color-surface)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-elevated)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Poll
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Movies
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {pollsWithCounts.map((poll) => (
                <tr key={poll.id} className="hover:bg-[var(--color-surface-elevated)]/50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{poll.title}</p>
                      {poll.description && (
                        <p className="text-sm text-[var(--color-text-muted)] truncate max-w-xs">
                          {poll.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStateColor(poll.state)}`}>
                      {poll.state}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-muted)]">
                    {poll.movieCount}
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-muted)]">
                    {poll.voteCount}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                    {formatDate(poll.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/polls/${poll.id}`}
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
          <p className="text-[var(--color-text-muted)]">No quick polls created yet.</p>
          <Link
            href="/admin/polls/new"
            className="inline-block mt-3 text-[var(--color-primary)] hover:underline"
          >
            Create your first poll
          </Link>
        </div>
      )}
    </div>
  );
}
