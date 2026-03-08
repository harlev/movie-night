import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SurveyVotingClient delegates mobile viewports to the compact survey client', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/survey/[id]/SurveyVotingClient.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import SimpleVotingClient from './simple/SimpleVotingClient';"), true);
  assert.equal(source.includes("window.matchMedia('(max-width: 767px)')"), true);
  assert.equal(source.includes('<SimpleVotingClient'), true);
  assert.equal(source.includes('Filter movies...'), false);
});
