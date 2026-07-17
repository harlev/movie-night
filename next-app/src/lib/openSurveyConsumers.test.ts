import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function source(file: string): string {
  return readFileSync(path.join(process.cwd(), file), 'utf8');
}

test('movie-night winner and leaderboard logic excludes open surveys', () => {
  assert.equal(source('src/lib/queries/movies.ts').includes(".eq('survey_type', 'movie')"), true);
  assert.equal(source('src/lib/services/leaderboard.ts').includes("s.survey_type === 'movie'"), true);
});

test('history and survey API use neutral survey choices', () => {
  for (const file of [
    'src/app/(app)/history/[id]/page.tsx',
    'src/app/api/survey/[id]/route.ts',
  ]) {
    assert.equal(source(file).includes('getSurveyChoices'), true, `${file} should load neutral choices`);
  }

  const history = source('src/app/(app)/history/page.tsx');
  assert.equal(history.includes("survey.survey_type === 'open' ? 'options' : 'movies'"), true);
  assert.equal(history.includes("cookieStore.get('survey_voter_id')"), true);
  assert.equal(history.includes('getBallotByOwner'), true);
  assert.equal(source('src/app/(app)/history/[id]/page.tsx').includes('getBallotByOwner'), true);
});
