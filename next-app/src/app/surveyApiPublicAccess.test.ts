import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('survey API routes no longer require auth for live or frozen surveys', () => {
  const routeSource = readFileSync(
    path.join(process.cwd(), 'src/app/api/survey/[id]/route.ts'),
    'utf8'
  );
  const ballotsRouteSource = readFileSync(
    path.join(process.cwd(), 'src/app/api/survey/[id]/ballots/route.ts'),
    'utf8'
  );

  assert.equal(routeSource.includes("return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });"), false);
  assert.equal(ballotsRouteSource.includes("return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });"), false);
  assert.equal(routeSource.includes("if (!survey || survey.state === 'draft') {"), true);
  assert.equal(ballotsRouteSource.includes("if (!survey || survey.state === 'draft') {"), true);
});
