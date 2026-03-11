import assert from 'node:assert/strict';
import test from 'node:test';

test('parseNextMovieNightNumberInput accepts only strict positive integer strings', async () => {
  let parsingUtils: typeof import('./nextMovieNightNumber');

  try {
    parsingUtils = await import(new URL('./nextMovieNightNumber.ts', import.meta.url).href);
  } catch {
    assert.fail('Expected src/lib/utils/nextMovieNightNumber.ts to exist');
  }

  assert.equal(parsingUtils.parseNextMovieNightNumberInput('64'), 64);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput('0012'), 12);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput(' 9 '), 9);

  assert.equal(parsingUtils.parseNextMovieNightNumberInput(''), null);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput('0'), null);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput('-5'), null);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput('1.5'), null);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput('1e2'), null);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput('12abc'), null);
  assert.equal(parsingUtils.parseNextMovieNightNumberInput(null), null);
});
