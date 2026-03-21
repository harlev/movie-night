import Link from 'next/link';

export default function PublicSurveyNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/login" aria-label="Movie Night home" className="block">
            <img
              src="/logo-mobile.png"
              alt="Movie Night"
              className="h-16 w-auto block sm:hidden"
            />
            <img
              src="/logo.png"
              alt="Movie Night"
              className="hidden h-14 w-auto sm:block"
            />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  );
}
