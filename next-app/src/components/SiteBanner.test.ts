import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SiteBanner uses a taller image height to reduce top/bottom clipping', () => {
  const filePath = path.join(process.cwd(), 'src/components/SiteBanner.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes('className="h-24 w-full object-cover object-center sm:h-28 lg:h-32"'),
    true
  );
});
