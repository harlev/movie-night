import Link from 'next/link';

type IconType = 'movies' | 'surveys' | 'comments' | 'search' | 'ballots';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

const icons: Record<IconType, React.ReactNode> = {
  movies: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="8" width="40" height="32" rx="3" />
      <path d="M4 16h40M4 32h40" />
      <path d="M12 8v8M12 32v8M36 8v8M36 32v8" />
      <path d="M20 20l8 4-8 4V20z" fill="currentColor" />
    </svg>
  ),
  surveys: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
      <rect x="8" y="4" width="32" height="40" rx="3" />
      <path d="M16 16h16M16 24h12M16 32h8" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      <circle cx="12" cy="24" r="1.5" fill="currentColor" />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" />
    </svg>
  ),
  comments: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
      <path d="M8 10h32a2 2 0 012 2v20a2 2 0 01-2 2H16l-8 6V12a2 2 0 012-2z" />
      <path d="M16 20h16M16 26h10" />
    </svg>
  ),
  search: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="20" cy="20" r="12" />
      <path d="M29 29l10 10" strokeLinecap="round" />
    </svg>
  ),
  ballots: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
      <rect x="8" y="6" width="32" height="36" rx="3" />
      <path d="M16 18l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 30h16M16 36h10" />
    </svg>
  ),
};

export default function EmptyState({ icon = 'movies', title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-[var(--color-text-muted)]/50 mb-4">
        {icons[icon]}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.97]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
