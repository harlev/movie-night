import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('movie detail page renders a manual watched toggle button only for admins', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/movies/[id]/page.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('WatchedMovieButton'), true);
  assert.equal(source.includes("currentProfile?.role === 'admin'"), true);
});
