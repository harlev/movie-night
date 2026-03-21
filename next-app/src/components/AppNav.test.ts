import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('AppNav derives a mobile survey header title from the document title on non-simple survey routes', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("pathname.startsWith('/survey/')"), true);
  assert.equal(source.includes("import { usePathname, useSearchParams } from 'next/navigation';"), true);
  assert.equal(source.includes("const hideMobileSurveyTitle ="), true);
  assert.equal(source.includes("document.title.replace(/\\s*-\\s*Movie Night$/, '')"), true);
  assert.equal(source.includes('!hideMobileSurveyTitle'), true);
  assert.equal(source.includes('aria-label="Current survey"'), true);
  assert.equal(source.includes('relative flex h-16 items-center'), true);
  assert.equal(source.includes('sm:hidden flex-1 min-w-0 px-2 pointer-events-none'), true);
  assert.equal(source.includes('block truncate text-center text-sm font-display font-bold leading-tight'), true);
});

test('AppNav suppresses the mobile survey header title on the /simple survey flow', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("const view = searchParams.get('view');"), true);
  assert.equal(source.includes("pathname.endsWith('/simple')"), true);
  assert.equal(source.includes("view === 'results'"), true);
  assert.equal(source.includes("if (!pathname.startsWith('/survey/') || hideMobileSurveyTitle)"), true);
  assert.equal(source.includes('const showMobileSurveyTitle ='), true);
  assert.equal(source.includes('!hideMobileSurveyTitle &&'), true);
  assert.equal(source.includes('mobileSurveyTitle &&'), true);
  assert.equal(source.includes('!mobileMenuOpen;'), true);
});

test('AppNav uses a dedicated mobile logo while keeping the desktop logo unchanged', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('src="/logo-mobile.png"'), true);
  assert.equal(source.includes('src="/logo-mobile.jpeg"'), false);
  assert.equal(source.includes('src="/logo-mobile.svg"'), false);
  assert.equal(source.includes('className="relative flex h-16 items-center"'), true);
  assert.equal(source.includes('className="flex justify-between h-20 sm:h-16"'), false);
  assert.equal(source.includes('className="h-16 w-auto block sm:hidden"'), true);
  assert.equal(source.includes('src="/logo.png"'), true);
  assert.equal(source.includes('className="hidden h-14 w-auto sm:block"'), true);
});

test('AppNav adds Feedback as a top-level destination and moves desktop account actions into an avatar menu', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("{ href: '/feedback', label: 'Feedback' }"), true);
  assert.equal(source.includes('const [accountMenuOpen, setAccountMenuOpen] = useState(false);'), true);
  assert.equal(source.includes('aria-label="Open account menu"'), true);
  assert.equal(source.includes('aria-haspopup="menu"'), true);
  assert.equal(source.includes('className="text-[var(--color-text-muted)] text-sm"'), false);
});

test('AppNav separates desktop navigation and account controls into distinct header zones', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('className="flex min-w-0 items-center sm:flex-1"'), true);
  assert.equal(source.includes('className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-1"'), true);
  assert.equal(
    source.includes(
      'className="hidden sm:ml-6 sm:flex sm:flex-none sm:items-center sm:border-l sm:border-[var(--color-border)]/50 sm:pl-6"'
    ),
    true
  );
  assert.equal(source.includes('className="hidden sm:flex sm:items-center"'), false);
});
