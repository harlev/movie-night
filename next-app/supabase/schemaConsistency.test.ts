import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSupabaseFile = (fileName: string) =>
  readFileSync(path.join(process.cwd(), 'supabase', fileName), 'utf8');

test('survey schema defines closes_at for app queries', () => {
  const schema = readSupabaseFile('schema.sql');
  const seed = readSupabaseFile('seed.sql');

  assert.equal(schema.includes('closes_at timestamptz'), true);
  assert.equal(seed.includes('closes_at timestamptz'), true);
});

test('quick poll seed includes scheduled closes_at support', () => {
  const seed = readSupabaseFile('seed.sql');
  const migration = readSupabaseFile(path.join('migrations', '20260307_add_closes_at_columns.sql'));

  assert.equal(seed.includes('closes_at timestamptz'), true);
  assert.equal(migration.includes('alter table public.quick_polls'), true);
  assert.equal(migration.includes('add column if not exists closes_at timestamptz'), true);
});
