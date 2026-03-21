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

  assert.equal(schema.includes('create table public.feedback_threads'), true);
  assert.equal(schema.includes('create table public.feedback_replies'), true);
  assert.equal(schema.includes('author_display_name_snapshot text not null'), true);
  assert.equal(schema.includes("status text not null default 'visible' check (status in ('visible', 'hidden'))"), true);

  assert.equal(seed.includes('create table if not exists public.feedback_threads'), true);
  assert.equal(seed.includes('create table if not exists public.feedback_replies'), true);
  assert.equal(seed.includes('author_display_name_snapshot text not null'), true);
  assert.equal(seed.includes("status text not null default 'visible' check (status in ('visible', 'hidden'))"), true);

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
});

test('feedback schema updates admin logs to accept feedback targets', () => {
  const schema = readSupabaseFile('schema.sql');
  const seed = readSupabaseFile('seed.sql');
  const migration = readSupabaseFile(path.join('migrations', '20260316_add_feedback.sql'));

  assert.equal(schema.includes("'feedback'"), true);
  assert.equal(seed.includes("'feedback'"), true);
  assert.equal(migration.includes("'feedback'"), true);
});

test('survey ballot schema supports identified and guest owners in schema, seed, and migration', () => {
  const schema = readSupabaseFile('schema.sql');
  const seed = readSupabaseFile('seed.sql');
  const migration = readSupabaseFile(
    path.join('migrations', '20260320_add_guest_survey_ballots.sql')
  );

  assert.equal(schema.includes("owner_mode text not null default 'identified'"), true);
  assert.equal(schema.includes("check (owner_mode in ('identified', 'guest'))"), true);
  assert.equal(schema.includes('guest_display_name text'), true);
  assert.equal(schema.includes('guest_session_id_hash text'), true);
  assert.equal(
    schema.includes('create unique index ballots_identified_owner_idx on public.ballots(survey_id, user_id) where user_id is not null;'),
    true
  );
  assert.equal(
    schema.includes('create unique index ballots_guest_owner_idx on public.ballots(survey_id, guest_session_id_hash) where guest_session_id_hash is not null;'),
    true
  );

  assert.equal(seed.includes("owner_mode text not null default 'identified'"), true);
  assert.equal(seed.includes('guest_display_name text'), true);
  assert.equal(seed.includes('guest_session_id_hash text'), true);
  assert.equal(
    seed.includes('create unique index if not exists ballots_guest_owner_idx on public.ballots(survey_id, guest_session_id_hash) where guest_session_id_hash is not null;'),
    true
  );
  assert.equal(schema.includes('create or replace function public.submit_ballot('), false);
  assert.equal(schema.includes('create or replace function public.remove_ballot_movie('), false);
  assert.equal(seed.includes('create or replace function public.submit_ballot('), false);
  assert.equal(seed.includes('create or replace function public.remove_ballot_movie('), false);

  assert.equal(migration.includes('alter table public.ballots add column if not exists owner_mode text'), true);
  assert.equal(migration.includes('add column if not exists guest_display_name text'), true);
  assert.equal(migration.includes('add column if not exists guest_session_id_hash text'), true);
  assert.equal(migration.includes('ballots_guest_owner_idx'), true);
  assert.equal(migration.includes('drop function if exists public.submit_ballot(text, uuid, jsonb);'), true);
  assert.equal(migration.includes('drop function if exists public.remove_ballot_movie(text, text);'), true);
});
