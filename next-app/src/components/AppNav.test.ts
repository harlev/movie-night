import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('AppNav uses a dedicated mobile logo while keeping the desktop logo unchanged', () => {
  const filePath = path.join(process.cwd(), 'src/components/AppNav.tsx');
  const source = readFileSync(filePath, 'utf8');

  assert.equal(source.includes('src="/logo-mobile.png"'), true);
  assert.equal(source.includes('src="/logo-mobile.jpeg"'), false);
  assert.equal(source.includes('src="/logo-mobile.svg"'), false);
  assert.equal(source.includes('className="flex justify-between h-16"'), true);
  assert.equal(source.includes('className="flex justify-between h-20 sm:h-16"'), false);
  assert.equal(source.includes('className="h-16 w-auto block sm:hidden"'), true);
  assert.equal(source.includes('src="/logo.png"'), true);
  assert.equal(source.includes('className="hidden h-14 w-auto sm:block"'), true);
});
