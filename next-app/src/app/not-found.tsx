import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center animate-fade-in-up">
        <h1 className="text-6xl font-display font-bold text-[var(--color-text)]">404</h1>
        <p className="mt-4 text-xl font-display italic text-[var(--color-text-muted)]">
          Scene Not Found
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          This page seems to have left the theater.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[var(--color-primary-dark)] active:scale-[0.97] shadow-md shadow-[var(--color-primary)]/20"
        >
          Back to the Lobby
        </Link>
      </div>
    </div>
  );
}
