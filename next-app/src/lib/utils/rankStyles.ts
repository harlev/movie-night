export function getRankBadgeClasses(rank: number): string {
  if (rank === 1) return 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30';
  if (rank === 2) return 'bg-gray-300/20 text-gray-300 ring-1 ring-gray-300/30';
  if (rank === 3) return 'bg-orange-400/20 text-orange-400 ring-1 ring-orange-400/30';
  return 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]';
}

export function getRankOverlayClasses(rank: number): string {
  if (rank === 1) return 'text-yellow-500 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]';
  if (rank === 2) return 'text-gray-300 drop-shadow-[0_2px_8px_rgba(209,213,219,0.4)]';
  if (rank === 3) return 'text-orange-400 drop-shadow-[0_2px_8px_rgba(251,146,60,0.5)]';
  return 'text-[var(--color-text-muted)]';
}

export function getStandingBorderColor(position: number): string {
  if (position === 1) return 'border-l-yellow-500';
  if (position === 2) return 'border-l-gray-300';
  if (position === 3) return 'border-l-orange-400';
  return 'border-l-transparent';
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
