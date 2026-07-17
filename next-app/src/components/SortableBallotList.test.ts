import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('shared sortable ballot slots render either custom option images or movie posters', () => {
  for (const file of ['src/components/SortableBallotList.tsx', 'src/components/SortableBallotSlot.tsx']) {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8');
    assert.equal(source.includes('imageUrl?: string | null'), true, `${file} needs the neutral image field`);
    assert.equal(source.includes('movie.imageUrl'), true, `${file} needs to prefer custom option images`);
  }
});

test('empty ballot instructions are option-neutral', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/components/SortableBallotList.tsx'), 'utf8');
  assert.equal(source.includes('Select an option below'), true);
  assert.equal(source.includes('Tap an option below'), true);
});
