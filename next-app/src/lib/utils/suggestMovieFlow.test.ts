import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSuggestedMovieHref, getSuggestionAcceptedToast } from './suggestMovieFlow';

test('buildSuggestedMovieHref creates movie details URL with suggestion flag', () => {
  assert.equal(buildSuggestedMovieHref('movie_123'), '/movies/movie_123?suggested=1');
});

test('getSuggestionAcceptedToast returns the expected confirmation text', () => {
  assert.equal(
    getSuggestionAcceptedToast(),
    'Your suggestion has been accepted. You can nominate it now.'
  );
});
