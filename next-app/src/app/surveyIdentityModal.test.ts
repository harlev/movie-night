import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('survey identity modal reuses the login picker with a simple skip-login path', () => {
  const filePath = path.join(
    process.cwd(),
    'src/components/SurveyIdentityModal.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('Finish submitting your ballot'), true);
  assert.equal(source.includes('Log in, enter a name, or continue as guest.'), true);
  assert.equal(source.includes('or continue as guest'), true);
  assert.equal(source.includes('Your name'), true);
  assert.equal(source.includes('Your name (optional)'), false);
  assert.equal(source.includes('aria-hidden="true"'), true);
  assert.equal(source.includes('disabled={!guestDisplayName.trim()}'), true);
  assert.equal(
    source.includes('enabled:hover:bg-[var(--color-surface-elevated)]'),
    true
  );
  assert.equal(source.includes('Vote as guest'), true);
  assert.equal(source.includes('<AuthMethodPicker'), true);
  assert.equal(source.includes('Log in or create account'), false);
  assert.equal(source.includes('Continue anonymously'), false);
});
