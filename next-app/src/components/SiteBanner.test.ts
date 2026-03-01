import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SiteBanner supports mobile-specific art direction and aspect ratios', () => {
  const filePath = path.join(process.cwd(), 'src/components/SiteBanner.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('media="(max-width: 639px)"'), true);
  assert.equal(
    /aspect-\[4\/1\][\s\S]*sm:aspect-\[10\/1\]/.test(source),
    true
  );
});
