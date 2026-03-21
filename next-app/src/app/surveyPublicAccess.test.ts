import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('app layout allows unauthenticated survey pages while keeping other app routes protected', () => {
  const source = readSource('src/app/(app)/layout.tsx');

  assert.equal(source.includes("const pathname = headersList.get('x-pathname') || '';"), true);
  assert.equal(source.includes("if (pathname.startsWith('/survey/')) {"), true);
  assert.equal(source.includes("import PublicSurveyNav from '@/components/PublicSurveyNav';"), true);
  assert.equal(source.includes('<PublicSurveyNav />'), true);
  assert.equal(source.includes('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'), true);
  assert.equal(source.includes("redirect('/login');"), true);
});

test('survey page resolves a participant ballot instead of hard-failing anonymous visitors', () => {
  const source = readSource('src/app/(app)/survey/[id]/page.tsx');

  assert.equal(source.includes('getParticipantBallot({'), true);
  assert.equal(source.includes('const guestSessionIdHash = await getSurveyGuestSessionIdHash(id);'), true);
  assert.equal(source.includes('if (!user) {\n    notFound();\n  }'), false);
});
