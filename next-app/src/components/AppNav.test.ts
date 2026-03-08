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
    source.includes('absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center pointer-events-none sm:hidden'),
    true
  );
  assert.equal(source.includes('text-[2rem] font-display font-bold leading-none'), true);
});
