import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('middleware keeps survey pages public while assigning a survey guest cookie', () => {
  const filePath = path.join(process.cwd(), 'src/lib/supabase/middleware.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes("const appRoutes = ['/dashboard', '/movies', '/history', '/settings'];"),
    true
  );
  assert.equal(source.includes("if (pathname.startsWith('/survey/')) {"), true);
  assert.equal(source.includes("'sv_guest_id'"), true);
});
