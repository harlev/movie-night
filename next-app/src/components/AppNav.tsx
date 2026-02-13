'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/actions/auth';

interface AppNavProps {
  user: {
    displayName: string;
    role: string;
    email?: string;
  };
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/movies', label: 'Movies' },
  { href: '/history', label: 'History' },
];

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
      {initial}
    </div>
  );
}

export default function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <img src="/logo.png" alt="Movie Night" className="h-14" />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
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

          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            <UserAvatar name={user.displayName} />
            <span className="text-[var(--color-text-muted)] text-sm">
              {user.displayName}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors ml-2"
              >
                Logout
              </button>
            </form>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
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
              <UserAvatar name={user.displayName} />
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {user.displayName}
                </p>
                {user.email && (
                  <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                )}
              </div>
            </div>
            <div className="mt-3 px-2">
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
