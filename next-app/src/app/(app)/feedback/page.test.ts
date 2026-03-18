import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Feedback page uses lighter movie-night copy and thread hierarchy', () => {
  const filePath = path.join(process.cwd(), 'src/app/(app)/feedback/page.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes('For snacks, themes, movies, or anything else.'),
    true
  );
  assert.equal(
    source.includes('Share ideas, suggestions, and thoughts about movie night.'),
    false
  );
  assert.equal(source.includes('Threads'), true);
  assert.equal(source.includes('All threads'), false);
  assert.equal(source.includes('Sorted by recent activity by default.'), false);
  assert.equal(source.includes("actionLabel={profile?.role === 'viewer' ? 'Refresh' : 'Share a thought'}"), true);
  assert.equal(source.includes('No feedback yet'), false);
  assert.equal(source.includes('Leave Feedback'), false);
});
