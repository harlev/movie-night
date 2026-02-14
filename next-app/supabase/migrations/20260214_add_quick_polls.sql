-- Quick Polls: lightweight shareable ranked-choice polls (no auth required to vote)

-- Poll metadata + state machine (draft → live → closed)
create table public.quick_polls (
  id text primary key,
  title text not null,
  description text,
  state text not null default 'draft' check (state in ('draft', 'live', 'closed')),
  max_rank_n integer not null default 3,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index quick_polls_state_idx on public.quick_polls(state);

-- Self-contained TMDb movie snapshots (NOT linked to main movies table)
create table public.quick_poll_movies (
  id text primary key,
  poll_id text not null references public.quick_polls(id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  metadata_snapshot jsonb,
  created_at timestamptz not null default now(),
  unique(poll_id, tmdb_id)
);

-- One row per voter per poll, ranks stored as JSONB
create table public.quick_poll_votes (
  id text primary key,
  poll_id text not null references public.quick_polls(id) on delete cascade,
  voter_id text not null,
  voter_name text,
  ranks jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(poll_id, voter_id)
);

-- Enable RLS
alter table public.quick_polls enable row level security;
alter table public.quick_poll_movies enable row level security;
alter table public.quick_poll_votes enable row level security;

-- RLS Policies for quick_polls: admins manage, authenticated read
create policy "quick_polls_select" on public.quick_polls for select to authenticated using (true);
create policy "quick_polls_insert" on public.quick_polls for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "quick_polls_update" on public.quick_polls for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "quick_polls_delete" on public.quick_polls for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- RLS Policies for quick_poll_movies: admins manage, authenticated read
create policy "quick_poll_movies_select" on public.quick_poll_movies for select to authenticated using (true);
create policy "quick_poll_movies_insert" on public.quick_poll_movies for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "quick_poll_movies_delete" on public.quick_poll_movies for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- RLS Policies for quick_poll_votes: all access through admin client (service role) since voters are anonymous
-- No direct policies for anon/authenticated — service role bypasses RLS

-- Update admin_logs target_type constraint to include 'poll'
alter table public.admin_logs drop constraint admin_logs_target_type_check;
alter table public.admin_logs add constraint admin_logs_target_type_check
  check (target_type in ('user', 'movie', 'survey', 'invite', 'poll'));
