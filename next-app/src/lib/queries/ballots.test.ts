import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getBallotDisplayName } from './ballots';

test('ballot queries use generic entries and hide anonymous identities', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/lib/queries/ballots.ts'), 'utf8');

  assert.equal(source.includes('survey_entry_id'), true);
  assert.equal(source.includes('optionId'), true);
  assert.equal(getBallotDisplayName({ owner_mode: 'guest', guest_display_name: ' Pat ' }, false), 'Pat');
  assert.equal(getBallotDisplayName({ owner_mode: 'anonymous', guest_display_name: null }, true), 'Anonymous');
  assert.equal(
    getBallotDisplayName({ owner_mode: 'user', guest_display_name: null, profile_display_name: 'Alex' }, true),
    'Anonymous'
  );
});
