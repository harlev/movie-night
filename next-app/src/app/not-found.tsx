import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-[var(--color-text)]">404</h1>
      <p className="mt-4 text-lg text-[var(--color-text-muted)]">
        Page Not Found
      </p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
