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

test('SurveyVotingClient renders generic options, guest identity, and responder option controls', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/survey/[id]/SurveyVotingClient.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('optionId'), true);
  assert.equal(source.includes('imageUrl'), true);
  assert.equal(source.includes('name="guestName"'), true);
  assert.equal(source.includes('<OpenSurveyOptionForm'), true);
  assert.equal(source.includes('survey.allowResponderOptions'), true);
  assert.equal(source.includes('Open link'), true);
});

test('survey page conditionally enforces members-only access and resolves browser-owned ballots', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/app/(app)/survey/[id]/page.tsx'), 'utf8');

  assert.equal(source.includes('survey.members_only'), true);
  assert.equal(source.includes('redirect(`/login?next='), true);
  assert.equal(source.includes('getBallotByOwner'), true);
  assert.equal(source.includes("cookieStore.get('survey_voter_id')"), true);
  assert.equal(source.includes('getSurveyChoices'), true);
});
