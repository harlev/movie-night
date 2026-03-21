import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('ballot queries surface rank-loading and admin mutation errors', () => {
  const filePath = path.join(process.cwd(), 'src/lib/queries/ballots.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("ensureNoError(error, 'Failed to fetch ballot ranks');"), true);
  assert.equal(
    source.includes("ensureNoError(error, 'Failed to load ballots for movie removal');"),
    true
  );
  assert.equal(
    source.includes("ensureNoError(deleteRankError, 'Failed to remove ballot movie rank');"),
    true
  );
  assert.equal(
    source.includes("ensureNoError(changeLogError, 'Failed to record ballot movie removal');"),
    true
  );
});
