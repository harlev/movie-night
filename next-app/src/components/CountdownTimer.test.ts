import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('CountdownTimer full variant supports narrow mobile widths without horizontal overflow', () => {
  const filePath = path.join(process.cwd(), 'src/components/CountdownTimer.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes('inline-flex max-w-full flex-wrap items-center justify-center gap-1.5'),
    true
  );
  assert.equal(source.includes('px-2 sm:px-3'), true);
  assert.equal(source.includes('text-base sm:text-lg'), true);
});
