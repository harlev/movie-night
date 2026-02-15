import { getLeaderboardData } from '@/lib/services/leaderboard';
import EmptyState from '@/components/ui/EmptyState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard - Movie Night',
};

function getRankBadgeClasses(position: number): string {
  if (position === 1) return 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30';
  if (position === 2) return 'bg-gray-300/20 text-gray-300 ring-1 ring-gray-300/30';
  if (position === 3) return 'bg-orange-400/20 text-orange-400 ring-1 ring-orange-400/30';
  return 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]';
}

export default async function LeaderboardPage() {
  const { leaderboard, totalCompletedEvents } = await getLeaderboardData();

  const totalParticipants = leaderboard.length;

  // Precompute positions accounting for ties
  const positions: number[] = [];
  let currentPosition = 1;
  for (let i = 0; i < leaderboard.length; i++) {
    if (i > 0) {
      const prev = leaderboard[i - 1];
      const curr = leaderboard[i];
      if (prev.accuracyPercent !== curr.accuracyPercent || prev.participationCount !== curr.participationCount) {
        currentPosition = i + 1;
      }
    }
    positions.push(currentPosition);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Leaderboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          See who picks the winners and who shows up to vote
        </p>
      </div>

      {leaderboard.length > 0 ? (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
              <p className="text-2xl font-bold text-[var(--color-text)]">{totalCompletedEvents}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Completed Events</p>
            </div>
            <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
              <p className="text-2xl font-bold text-[var(--color-text)]">{totalParticipants}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Total Participants</p>
            </div>
          </div>

          {/* Leaderboard table */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20 overflow-hidden">
            {/* Desktop header */}
            <div className="hidden sm:grid sm:grid-cols-[3.5rem_1fr_6rem_6rem_5.5rem] gap-4 px-4 py-3 border-b border-[var(--color-border)]/50 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              <span>Rank</span>
              <span>Member</span>
              <span className="text-right">Events</span>
              <span className="text-right">Oracle Pts</span>
              <span className="text-right">Accuracy</span>
            </div>

            <div className="divide-y divide-[var(--color-border)]/30">
              {leaderboard.map((entry, index) => {
                const position = positions[index];

                return (
                  <div
                    key={entry.userId}
                    className="px-4 py-3 hover:bg-[var(--color-surface-elevated)]/50 transition-colors"
                  >
                    {/* Desktop layout */}
                    <div className="hidden sm:grid sm:grid-cols-[3.5rem_1fr_6rem_6rem_5.5rem] gap-4 items-center">
                      <div>
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadgeClasses(position)}`}
                        >
                          {position}
                        </span>
                      </div>
                      <div className="font-medium text-[var(--color-text)] truncate">
                        {entry.displayName}
                      </div>
                      <div className="text-right text-sm text-[var(--color-text-muted)]">
                        {entry.participationCount}
                      </div>
                      <div className="text-right text-sm text-[var(--color-text-muted)]">
                        {entry.oraclePointsEarned}/{entry.oraclePointsPossible}
                      </div>
                      <div className="text-right text-sm font-semibold text-[var(--color-primary)]">
                        {entry.accuracyPercent}%
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${getRankBadgeClasses(position)}`}
                      >
                        {position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--color-text)] truncate">
                          {entry.displayName}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-text-muted)]">
                          <span>{entry.participationCount} events</span>
                          <span>{entry.oraclePointsEarned}/{entry.oraclePointsPossible} pts</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold text-[var(--color-primary)]">
                          {entry.accuracyPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scoring explanation */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">How Oracle Scoring Works</h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              For each completed survey or poll, you earn points based on how high you ranked the winning movie.
              If your #1 pick wins, you get maximum points. Lower picks earn fewer points.
              Movies you didn&apos;t rank score zero. Accuracy is your total oracle points as a percentage of the maximum possible.
              Poll votes only count for logged-in members.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
          <EmptyState
            icon="surveys"
            title="No leaderboard data yet"
            description="The leaderboard will populate once surveys are completed and results are in."
          />
        </div>
      )}
    </div>
  );
}
