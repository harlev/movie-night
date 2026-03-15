import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('AppNav derives a mobile survey header title from the document title on survey routes', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("pathname.startsWith('/survey/')"), true);
  assert.equal(source.includes("document.title.replace(/\\s*-\\s*Movie Night$/, '')"), true);
  assert.equal(source.includes('aria-label="Current survey"'), true);
  assert.equal(source.includes('relative flex justify-between h-16'), true);
  assert.equal(
    source.includes('absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none sm:hidden'),
    true
  );
  assert.equal(source.includes('text-lg font-display font-bold leading-tight'), true);
});

test('AppNav uses a dedicated mobile logo while keeping the desktop logo unchanged', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('src="/logo-mobile.png"'), true);
  assert.equal(source.includes('src="/logo-mobile.jpeg"'), false);
  assert.equal(source.includes('src="/logo-mobile.svg"'), false);
  assert.equal(source.includes('className="relative flex justify-between h-16"'), true);
  assert.equal(source.includes('className="flex justify-between h-20 sm:h-16"'), false);
  assert.equal(source.includes('className="h-16 w-auto block sm:hidden"'), true);
  assert.equal(source.includes('src="/logo.png"'), true);
  assert.equal(source.includes('className="hidden h-14 w-auto sm:block"'), true);
});
