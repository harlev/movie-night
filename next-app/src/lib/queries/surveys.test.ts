import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { mapSurveyEntryToChoice } from './surveys';

test('movie and open entries map to one neutral survey choice shape', () => {
  const movieChoice = mapSurveyEntryToChoice(
    {
      id: 'entry-movie',
      survey_id: 'survey',
      movie_id: 'movie',
      title: null,
      description: null,
      image_path: null,
      link_url: null,
      created_by_mode: 'admin',
    },
    {
      id: 'movie',
      title: 'Arrival',
      tmdb_id: 329865,
      metadata_snapshot: { posterPath: '/arrival.jpg' },
      watched: false,
      watched_at: null,
    },
    'https://db.example'
  );
  const openChoice = mapSurveyEntryToChoice(
    {
      id: 'entry-open',
      survey_id: 'survey',
      movie_id: null,
      title: 'Tacos',
      description: 'The truck on Main',
      image_path: 'survey/option.webp',
      link_url: 'https://example.com/menu',
      created_by_mode: 'responder',
    },
    null,
    'https://db.example'
  );

  assert.equal(movieChoice.id, 'entry-movie');
  assert.equal(movieChoice.title, 'Arrival');
  assert.equal(movieChoice.movie?.id, 'movie');
  assert.equal(openChoice.title, 'Tacos');
  assert.equal(openChoice.imageUrl, 'https://db.example/storage/v1/object/public/survey-option-images/survey/option.webp');
  assert.equal(openChoice.createdByMode, 'responder');
});

test('survey queries expose generic creation, option, cleanup, and finalization operations', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/lib/queries/surveys.ts'), 'utf8');

  assert.equal(source.includes('survey_type: data.surveyType'), true);
  assert.equal(source.includes('allow_responder_options: data.allowResponderOptions'), true);
  assert.equal(source.includes('export async function addOpenSurveyOption'), true);
  assert.equal(source.includes('export async function removeSurveyOption'), true);
  assert.equal(source.includes("storage.from('survey-option-images').remove"), true);
  assert.equal(source.includes("rpc('finalize_expired_surveys')"), true);
});
