import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SurveyVotingClient keeps the regular survey experience on the non-/simple route', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/survey/[id]/SurveyVotingClient.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import SimpleVotingClient from './simple/SimpleVotingClient';"), false);
  assert.equal(source.includes("window.matchMedia('(max-width: 767px)')"), false);
  assert.equal(source.includes('<SimpleVotingClient'), false);
  assert.equal(source.includes('Filter movies...'), true);
  assert.equal(source.includes('SortableBallotList'), true);
  assert.equal(source.includes('Your Ballot'), true);
});
