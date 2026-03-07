import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Toast component supports warning variant and polite status semantics', () => {
  const filePath = path.join(process.cwd(), 'src/components/ui/Toast.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("warning: 'border-[var(--color-warning)]/40'"), true);
  assert.equal(source.includes('role="status"'), true);
  assert.equal(source.includes('aria-live="polite"'), true);
});
