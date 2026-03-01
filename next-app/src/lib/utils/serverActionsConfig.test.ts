import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('next config sets serverActions bodySizeLimit to allow banner uploads', () => {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  const source = readFileSync(configPath, 'utf8');

  assert.equal(
    /bodySizeLimit\s*:\s*['"]6mb['"]/.test(source),
    true
  );
});
