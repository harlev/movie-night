import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('survey finalization uses a protected hourly GitHub Actions schedule instead of Vercel cron', () => {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  const workflow = readFileSync(
    path.join(process.cwd(), '..', '.github', 'workflows', 'finalize-surveys.yml'),
    'utf8'
  );

  assert.equal(existsSync(vercelConfigPath), false);
  assert.equal(workflow.includes("cron: '0 * * * *'"), true);
  assert.equal(workflow.includes('workflow_dispatch:'), true);
  assert.equal(workflow.includes('secrets.PRODUCTION_URL'), true);
  assert.equal(workflow.includes('secrets.CRON_SECRET'), true);
  assert.equal(workflow.includes('Authorization: Bearer'), true);
});
