import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('next config uses a stable turbopack root path', () => {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  const source = readFileSync(configPath, 'utf8');

  assert.equal(source.includes('turbopack'), true);
  assert.equal(source.includes('root: process.cwd()'), false);
});
