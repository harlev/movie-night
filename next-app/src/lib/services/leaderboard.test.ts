import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('leaderboard ignores guest survey ballots', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'src/lib/services/leaderboard.ts'),
    'utf8'
  );

  assert.equal(source.includes("if (ballot.user.mode !== 'identified') continue;"), true);
});
