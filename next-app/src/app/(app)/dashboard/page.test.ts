import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const DASHBOARD_PAGE_PATH = path.join(process.cwd(), 'src/app/(app)/dashboard/page.tsx');

test('dashboard header uses Next Movie Night label', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('Next Movie Night'), true);
  assert.equal(source.includes('Now Showing'), false);
  assert.equal(source.includes('<h1 className="sr-only">Dashboard</h1>'), true);
  assert.equal(source.includes('Welcome back to F.C Movie Night'), false);
});

test('dashboard header renders computed next movie night date from site settings', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('const nextMovieNightDateLabel = getNextMovieNightLabel({'), true);
  assert.equal(source.includes('overrideDate: siteSettings?.next_movie_night_override_date ?? null'), true);
  assert.equal(source.includes('{nextMovieNightDateLabel}'), true);
});

test('dashboard header uses a unified next movie night card instead of separate next movie panel', () => {
  const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

  assert.equal(source.includes('const nextMovie = siteSettings?.next_movie ?? null;'), true);
  assert.equal(source.includes('Next up'), false);
  assert.equal(source.includes('Selected from the latest completed survey'), false);
  assert.equal(/>\s*Next Movie\s*</.test(source), false);
  assert.equal(source.includes('md:grid-cols-[minmax(0,1fr)_auto]'), true);
  assert.equal(source.includes('md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]'), false);
  assert.equal(source.includes('href={`/movies/${nextMovie.id}`}'), true);
  assert.equal(source.includes('aria-label={`View details for ${nextMovie.title}`}'), true);
  assert.equal(source.includes('focus-visible:ring-[var(--color-primary)]/60'), true);
  assert.equal(source.includes('alt={`Poster for ${nextMovie.title}`}'), true);
  assert.equal(source.includes('{nextMovie && ('), false);
});
