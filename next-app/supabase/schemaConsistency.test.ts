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

test('feedback schema and seed define thread/reply tables with snapshot names and moderation status', () => {
  const schema = readSupabaseFile('schema.sql');
  const seed = readSupabaseFile('seed.sql');
  const migration = readSupabaseFile(path.join('migrations', '20260316_add_feedback.sql'));
  const anonymityMigration = readSupabaseFile(
    path.join('migrations', '20260320_anonymize_feedback_authors.sql')
  );

  assert.equal(schema.includes('create table public.feedback_threads'), true);
  assert.equal(schema.includes('create table public.feedback_replies'), true);
  assert.equal(schema.includes('author_display_name_snapshot text,'), true);
  assert.equal(schema.includes('author_display_name_snapshot text not null'), false);
  assert.equal(schema.includes("status text not null default 'visible' check (status in ('visible', 'hidden'))"), true);
  assert.equal(schema.includes('constraint feedback_threads_identity_check check'), true);
  assert.equal(schema.includes('constraint feedback_replies_identity_check check'), true);
  assert.equal(schema.includes('with check (\n    and status = \'visible\''), false);

  assert.equal(seed.includes('-- Migration: 20260316_add_feedback.sql'), true);
  assert.equal(seed.includes('-- Migration: 20260320_anonymize_feedback_authors.sql'), true);
  assert.equal(seed.includes('create table if not exists public.feedback_threads'), true);
  assert.equal(seed.includes('create table if not exists public.feedback_replies'), true);
  assert.equal(seed.includes('author_display_name_snapshot text not null'), true);
  assert.equal(seed.includes('alter table public.feedback_threads alter column author_id drop not null;'), true);
  assert.equal(seed.includes('alter table public.feedback_replies alter column author_id drop not null;'), true);
  assert.equal(anonymityMigration.includes('update public.feedback_threads'), true);
  assert.equal(anonymityMigration.includes('update public.feedback_replies'), true);
  assert.equal(
    anonymityMigration.includes('set author_id = null, author_display_name_snapshot = null'),
    true
  );

  assert.equal(
    schema.includes('create policy "feedback_replies_select" on public.feedback_replies for select to authenticated'),
    true
  );
  assert.equal(
    schema.includes('and exists (') && schema.includes("feedback_threads.status = 'visible'"),
    true
  );
  assert.equal(
    seed.includes('create policy "feedback_replies_select" on public.feedback_replies for select to authenticated'),
    true
  );
  assert.equal(
    seed.includes('and exists (') && seed.includes("feedback_threads.status = 'visible'"),
    true
  );
  assert.equal(
    migration.includes('create policy "feedback_replies_select" on public.feedback_replies for select to authenticated'),
    true
  );
  assert.equal(
    migration.includes('and exists (') && migration.includes("feedback_threads.status = 'visible'"),
    true
  );
  assert.equal(
    schema.includes('create policy "feedback_replies_insert" on public.feedback_replies for insert to authenticated'),
    true
  );
  assert.equal(
    schema.includes("feedback_threads.id = feedback_replies.thread_id"),
    true
  );
  assert.equal(
    seed.includes("feedback_threads.id = feedback_replies.thread_id"),
    true
  );
  assert.equal(
    migration.includes("feedback_threads.id = feedback_replies.thread_id"),
    true
  );
  assert.equal(schema.includes('is_anonymous\n        and author_id is null'), true);
  assert.equal(seed.includes('is_anonymous\n        and author_id is null'), true);
  assert.equal(
    anonymityMigration.includes('alter table public.feedback_threads alter column author_id drop not null'),
    true
  );
  assert.equal(
    anonymityMigration.includes('alter table public.feedback_replies alter column author_id drop not null'),
    true
  );
});

test('feedback schema updates admin logs to accept feedback targets', () => {
  const schema = readSupabaseFile('schema.sql');
  const seed = readSupabaseFile('seed.sql');
  const migration = readSupabaseFile(path.join('migrations', '20260316_add_feedback.sql'));

  assert.equal(schema.includes("'feedback'"), true);
  assert.equal(seed.includes("'feedback'"), true);
  assert.equal(migration.includes("'feedback'"), true);
});
