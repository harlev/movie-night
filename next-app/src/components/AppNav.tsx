'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logout } from '@/lib/actions/auth';

interface AppNavProps {
  user: {
    displayName: string;
    role: string;
    email?: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/movies', label: 'Movies' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/history', label: 'History' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initial = name.charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
      {initial}
    </div>
  );
}

export default function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileSurveyTitle, setMobileSurveyTitle] = useState('');
  const view = searchParams.get('view');
  const hideMobileSurveyTitle =
    pathname.endsWith('/simple') && /^\/survey\/[^/]+\/simple$/.test(pathname) && view === 'results';

  useEffect(() => {
    if (!pathname.startsWith('/survey/') || hideMobileSurveyTitle) {
      setMobileSurveyTitle('');
      return;
    }

    setMobileSurveyTitle(document.title.replace(/\s*-\s*Movie Night$/, ''));
  }, [hideMobileSurveyTitle, pathname]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const showMobileSurveyTitle =
    pathname.startsWith('/survey/') &&
    !hideMobileSurveyTitle &&
    mobileSurveyTitle &&
    !mobileMenuOpen;

  return (
    <nav className="bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center">
          <div className="flex min-w-0 items-center sm:flex-1">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" aria-label="Movie Night home" className="block">
                <img src="/logo-mobile.png" alt="Movie Night" className="h-16 w-auto block sm:hidden" />
                <img src="/logo.png" alt="Movie Night" className="hidden h-14 w-auto sm:block" />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--color-primary)] rounded-full" />
                    )}
                  </Link>
                );
              })}
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'text-[var(--color-warning)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Admin
                  {pathname.startsWith('/admin') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--color-warning)] rounded-full" />
                  )}
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:flex-none sm:items-center sm:border-l sm:border-[var(--color-border)]/50 sm:pl-6">
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((current) => !current)}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] px-2.5 py-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} />
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-xl shadow-black/30"
                >
                  <div className="border-b border-[var(--color-border)]/50 px-4 py-3">
                    <p className="text-sm font-medium text-[var(--color-text)]">{user.displayName}</p>
                    {user.email ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{user.email}</p>
                    ) : null}
                  </div>

                  <div className="p-2">
                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>

                    <form action={logout}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h8v14H3z" />
                        </svg>
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showMobileSurveyTitle && (
            <div className="sm:hidden flex-1 min-w-0 px-2 pointer-events-none">
              <span
                aria-label="Current survey"
                className="block truncate text-center text-sm font-display font-bold leading-tight text-[var(--color-text)]"
              >
                {mobileSurveyTitle}
              </span>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="ml-auto flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[var(--color-border)]/50 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-[var(--color-border)]/50">
            <div className="px-4 flex items-center gap-3">
              <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} />
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {user.displayName}
                </p>
                {user.email && (
                  <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                )}
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                  pathname === '/settings'
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                }`}
              >
                Settings
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
