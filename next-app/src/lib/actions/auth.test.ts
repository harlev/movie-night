import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('auth actions persist the pending redirect target for survey auth handoff', () => {
  const filePath = path.join(process.cwd(), 'src/lib/actions/auth.ts');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("cookieStore.set('pending_auth_redirect', next, {"), true);
  assert.equal(source.includes("cookieStore.delete('pending_auth_redirect');"), true);
  assert.equal(source.includes('await setPendingAuthRedirectCookie(next || null);'), true);
});

test('auth picker starts the survey auth-resume flow for magic links too', () => {
  const filePath = path.join(process.cwd(), 'src/components/AuthMethodPicker.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('<form\n        action={formAction}\n        onSubmit={() => {'), true);
  assert.equal(source.includes('onAuthStart?.();'), true);
});
