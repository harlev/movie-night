import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSuggestMovieHref, parseSuggestMovieQuery } from './suggestSearch';

test('buildSuggestMovieHref returns suggest page path when query is empty', () => {
  assert.equal(buildSuggestMovieHref(''), '/movies/suggest');
  assert.equal(buildSuggestMovieHref('   '), '/movies/suggest');
});

test('buildSuggestMovieHref appends encoded query when present', () => {
  assert.equal(
    buildSuggestMovieHref('The Matrix Revolutions'),
    '/movies/suggest?query=The+Matrix+Revolutions'
  );
});

test('parseSuggestMovieQuery reads and trims query from search params', () => {
  const params = new URLSearchParams({
    query: '  Inception  ',
  });
  assert.equal(parseSuggestMovieQuery(params), 'Inception');
});

test('parseSuggestMovieQuery returns empty string when missing query', () => {
  const params = new URLSearchParams();
  assert.equal(parseSuggestMovieQuery(params), '');
});
