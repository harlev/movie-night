import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('SurveyDetailClient uses shared Toast component for MoviePicker warnings', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.tsx'
  );
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes("import Toast from '@/components/ui/Toast';"), true);
  assert.equal(source.includes('<Toast'), true);
  assert.equal(source.includes('message={warningToast}'), true);
  assert.equal(source.includes('variant="warning"'), true);
  assert.equal(
    source.includes(
      'fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-[var(--color-warning)]/40'
    ),
    false
  );
});
