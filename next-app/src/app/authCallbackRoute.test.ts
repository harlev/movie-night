import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('auth callback treats survey returns like poll returns for lightweight onboarding', () => {
  const filePath = path.join(process.cwd(), 'src/app/(auth)/auth/callback/route.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(
    source.includes("const cookieNext = cookieStore.get('pending_auth_redirect')?.value || null;"),
    true
  );
  assert.equal(
    source.includes('const safeNext = sanitizeNext(next) || sanitizeNext(cookieNext);'),
    true
  );
  assert.equal(
    source.includes("if (safeNext && (safeNext.startsWith('/poll/') || safeNext.startsWith('/survey/'))) {"),
    true
  );
  assert.equal(source.includes("return NextResponse.redirect(`${origin}${safeNext}`);"), true);
});
