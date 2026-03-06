import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('mobile text-entry form controls keep a 16px font size to prevent iOS zoom', () => {
  const globalStyles = readSource('src/app/globals.css');

  assert.equal(globalStyles.includes('@media (max-width: 640px)'), true);
  assert.equal(globalStyles.includes("input[type='text']"), true);
  assert.equal(globalStyles.includes("input[type='search']"), true);
  assert.equal(globalStyles.includes("input[type='email']"), true);
  assert.equal(globalStyles.includes('textarea,'), true);
  assert.equal(globalStyles.includes('font-size: 16px;'), true);
});
