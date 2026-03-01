import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const DASHBOARD_PAGE_PATH = path.join(process.cwd(), 'src/app/(app)/dashboard/page.tsx');

test('dashboard header uses Next Movie Night label', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('Next Movie Night:'), true);
  assert.equal(source.includes('Now Showing'), false);
});

test('dashboard header renders computed next movie night date', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('const nextMovieNightDateLabel = getNextMovieNightDateLabel();'), true);
  assert.equal(source.includes('{nextMovieNightDateLabel}'), true);
});
