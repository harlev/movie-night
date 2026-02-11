import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers } from '@/lib/queries/profiles';
import { getAllMovies } from '@/lib/queries/movies';
import { getAllSurveys, getLiveSurvey } from '@/lib/queries/surveys';
import { getAllBallots } from '@/lib/queries/ballots';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Movie Night',
};

export default async function AdminDashboardPage() {
  const users = await getAllUsers();
  const movies = await getAllMovies();
  const surveys = await getAllSurveys();
  const activeUsers = users.filter((u) => u.status === 'active');

  let liveSurveyStats: { id: string; title: string; ballotCount: number } | null = null;
  const liveSurvey = await getLiveSurvey();
  if (liveSurvey) {
    const ballots = await getAllBallots(liveSurvey.id);
    liveSurveyStats = {
      id: liveSurvey.id,
      title: liveSurvey.title,
      ballotCount: ballots.length,
    };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Total Users</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{users.length}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Active Users</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{activeUsers.length}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Total Movies</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{movies.length}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Total Surveys</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{surveys.length}</p>
        </div>
      </div>

      {/* Live Survey Status */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Live Survey Status</h2>
        {liveSurveyStats ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-text)]">{liveSurveyStats.title}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {liveSurveyStats.ballotCount} ballots submitted
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded">
                Live
              </span>
              <Link
                href={`/admin/surveys/${liveSurveyStats.id}`}
                className="text-[var(--color-primary)] hover:underline text-sm"
              >
                Manage
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[var(--color-text-muted)]">No survey is currently live.</p>
            <Link
              href="/admin/surveys"
              className="inline-block mt-3 text-[var(--color-primary)] hover:underline text-sm"
            >
              Create or activate a survey
            </Link>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/surveys/new"
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Survey
          </Link>
          <Link
            href="/admin/invites/new"
            className="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors"
          >
            Generate Invite
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors"
          >
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}
