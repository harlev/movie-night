import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getSurveyShareUrl, shareSurvey } from './ShareButton';

test('share button builds the canonical survey URL', () => {
  assert.equal(
    getSurveyShareUrl('survey 1', 'https://movies.example/survey/old?view=results'),
    'https://movies.example/survey/survey%201'
  );
});

test('native sharing is preferred over clipboard', async () => {
  const calls: string[] = [];
  const result = await shareSurvey({
    title: 'Dinner',
    url: 'https://movies.example/survey/1',
    navigatorLike: {
      share: async () => { calls.push('share'); },
      clipboard: { writeText: async () => { calls.push('clipboard'); } },
    },
  });

  assert.equal(result, 'shared');
  assert.deepEqual(calls, ['share']);
});

test('clipboard is the fallback when native sharing is unavailable', async () => {
  let copied = '';
  const result = await shareSurvey({
    title: 'Dinner',
    url: 'https://movies.example/survey/1',
    navigatorLike: { clipboard: { writeText: async (value) => { copied = value; } } },
  });

  assert.equal(result, 'copied');
  assert.equal(copied, 'https://movies.example/survey/1');
});

test('survey clients reuse the same share control', () => {
  const files = [
    'src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.tsx',
    'src/app/(app)/survey/[id]/SurveyVotingClient.tsx',
  ];
  for (const file of files) {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8');
    assert.equal(source.includes('<ShareButton'), true, `${file} should render ShareButton`);
  }
});

test('share control confirms native sharing and survey titles link to voting', () => {
  const shareSource = readFileSync(path.join(process.cwd(), 'src/components/ShareButton.tsx'), 'utf8');
  const listSource = readFileSync(path.join(process.cwd(), 'src/app/(admin)/admin/surveys/page.tsx'), 'utf8');

  assert.equal(shareSource.includes("'shared' | 'copied' | 'error'"), true);
  assert.equal(shareSource.includes("status === 'shared' ? 'Shared'"), true);
  assert.equal(listSource.includes('href={`/survey/${survey.id}`}'), true);
});
