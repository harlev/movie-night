-- Profiles table (synced with auth.users via trigger)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invites table
create table public.invites (
  id text primary key,
  code text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired')),
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Invite uses
create table public.invite_uses (
  id text primary key,
  invite_id text not null references public.invites(id),
  user_id uuid not null references public.profiles(id),
  used_at timestamptz not null default now()
);

-- Movies table
create table public.movies (
  id text primary key,
  tmdb_id integer not null unique,
  title text not null,
  metadata_snapshot jsonb,
  suggested_by uuid not null references public.profiles(id),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Movie comments
create table public.movie_comments (
  id text primary key,
  movie_id text not null references public.movies(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Surveys table
create table public.surveys (
  id text primary key,
  title text not null,
  description text,
  state text not null default 'draft' check (state in ('draft', 'live', 'frozen')),
  max_rank_n integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  frozen_at timestamptz
);
create index surveys_state_idx on public.surveys(state);

-- Survey entries (movies in a survey)
create table public.survey_entries (
  id text primary key,
  survey_id text not null references public.surveys(id) on delete cascade,
  movie_id text not null references public.movies(id),
  added_by uuid not null references public.profiles(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(survey_id, movie_id)
);

-- Ballots table
create table public.ballots (
  id text primary key,
  survey_id text not null references public.surveys(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(survey_id, user_id)
);

-- Ballot ranks
create table public.ballot_ranks (
  id text primary key,
  ballot_id text not null references public.ballots(id) on delete cascade,
  rank integer not null,
  movie_id text not null references public.movies(id)
);

-- Ballot change logs
create table public.ballot_change_logs (
  id text primary key,
  survey_id text not null references public.surveys(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  previous_ranks jsonb,
  new_ranks jsonb,
  reason text not null check (reason in ('user_update', 'movie_removed', 'system')),
  created_at timestamptz not null default now()
);

-- Admin logs
create table public.admin_logs (
  id text primary key,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null check (target_type in ('user', 'movie', 'survey', 'invite')),
  target_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'display_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Custom JWT claims hook (include role in token)
-- Must be security definer so it can read profiles despite RLS
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb as $$
declare claims jsonb; user_role text; user_status text;
begin
  select role, status into user_role, user_status
  from public.profiles where id = (event->>'user_id')::uuid;
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role, 'member')));
  claims := jsonb_set(claims, '{user_status}', to_jsonb(coalesce(user_status, 'active')));
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$ language plpgsql security definer;

-- Grant permissions for the custom access token hook
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from anon, authenticated;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- RPC: submit ballot (atomic upsert + replace ranks + log change)
create or replace function public.submit_ballot(
  p_survey_id text,
  p_user_id uuid,
  p_ranks jsonb
) returns void as $$
declare
  v_ballot_id text;
  v_previous_ranks jsonb;
  v_rank record;
begin
  -- Check for existing ballot
  select id into v_ballot_id from public.ballots
  where survey_id = p_survey_id and user_id = p_user_id;

  if v_ballot_id is not null then
    -- Get previous ranks for change log
    select jsonb_agg(jsonb_build_object('rank', rank, 'movieId', movie_id))
    into v_previous_ranks
    from public.ballot_ranks where ballot_id = v_ballot_id;

    -- Delete existing ranks
    delete from public.ballot_ranks where ballot_id = v_ballot_id;

    -- Update ballot timestamp
    update public.ballots set updated_at = now() where id = v_ballot_id;
  else
    -- Create new ballot
    v_ballot_id := gen_random_uuid()::text;
    insert into public.ballots (id, survey_id, user_id) values (v_ballot_id, p_survey_id, p_user_id);
  end if;

  -- Insert new ranks
  for v_rank in select * from jsonb_to_recordset(p_ranks) as x(rank integer, "movieId" text)
  loop
    insert into public.ballot_ranks (id, ballot_id, rank, movie_id)
    values (gen_random_uuid()::text, v_ballot_id, v_rank.rank, v_rank."movieId");
  end loop;

  -- Log the change
  insert into public.ballot_change_logs (id, survey_id, user_id, previous_ranks, new_ranks, reason)
  values (gen_random_uuid()::text, p_survey_id, p_user_id, v_previous_ranks, p_ranks, 'user_update');
end;
$$ language plpgsql security definer;

-- RPC: remove ballot movie (remove movie from all ballots + log changes)
create or replace function public.remove_ballot_movie(
  p_survey_id text,
  p_movie_id text
) returns integer as $$
declare
  v_ballot record;
  v_current_ranks jsonb;
  v_new_ranks jsonb;
  v_affected integer := 0;
begin
  for v_ballot in
    select distinct b.id as ballot_id, b.user_id
    from public.ballots b
    inner join public.ballot_ranks br on b.id = br.ballot_id
    where b.survey_id = p_survey_id and br.movie_id = p_movie_id
  loop
    -- Get current ranks
    select jsonb_agg(jsonb_build_object('rank', rank, 'movieId', movie_id))
    into v_current_ranks
    from public.ballot_ranks where ballot_id = v_ballot.ballot_id;

    -- Delete the rank for this movie
    delete from public.ballot_ranks
    where ballot_id = v_ballot.ballot_id and movie_id = p_movie_id;

    -- Get new ranks
    select jsonb_agg(jsonb_build_object('rank', rank, 'movieId', movie_id))
    into v_new_ranks
    from public.ballot_ranks where ballot_id = v_ballot.ballot_id;

    -- Log the change
    insert into public.ballot_change_logs (id, survey_id, user_id, previous_ranks, new_ranks, reason)
    values (gen_random_uuid()::text, p_survey_id, v_ballot.user_id, v_current_ranks, v_new_ranks, 'movie_removed');

    v_affected := v_affected + 1;
  end loop;

  return v_affected;
end;
$$ language plpgsql security definer;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.invite_uses enable row level security;
alter table public.movies enable row level security;
alter table public.movie_comments enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_entries enable row level security;
alter table public.ballots enable row level security;
alter table public.ballot_ranks enable row level security;
alter table public.ballot_change_logs enable row level security;
alter table public.admin_logs enable row level security;

-- RLS Policies

-- Profiles: authenticated users can read all, update own
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());

-- Invites: authenticated users can read, admins can insert/update
create policy "invites_select" on public.invites for select to authenticated using (true);
create policy "invites_insert" on public.invites for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "invites_update" on public.invites for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Invite uses: authenticated can read
create policy "invite_uses_select" on public.invite_uses for select to authenticated using (true);
create policy "invite_uses_insert" on public.invite_uses for insert to authenticated with check (true);

-- Movies: authenticated can read non-hidden, insert own
create policy "movies_select" on public.movies for select to authenticated using (true);
create policy "movies_insert" on public.movies for insert to authenticated with check (suggested_by = auth.uid());
create policy "movies_update" on public.movies for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Movie comments: authenticated can read, insert own
create policy "movie_comments_select" on public.movie_comments for select to authenticated using (true);
create policy "movie_comments_insert" on public.movie_comments for insert to authenticated with check (user_id = auth.uid());

-- Surveys: authenticated can read, admins can manage
create policy "surveys_select" on public.surveys for select to authenticated using (true);
create policy "surveys_insert" on public.surveys for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "surveys_update" on public.surveys for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "surveys_delete" on public.surveys for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Survey entries: authenticated can read, admins can manage
create policy "survey_entries_select" on public.survey_entries for select to authenticated using (true);
create policy "survey_entries_insert" on public.survey_entries for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "survey_entries_update" on public.survey_entries for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Ballots: authenticated can read all, insert/update own
create policy "ballots_select" on public.ballots for select to authenticated using (true);
create policy "ballots_insert" on public.ballots for insert to authenticated with check (user_id = auth.uid());
create policy "ballots_update" on public.ballots for update to authenticated using (user_id = auth.uid());

-- Ballot ranks: authenticated can read all, insert/delete own ballot's ranks
create policy "ballot_ranks_select" on public.ballot_ranks for select to authenticated using (true);
create policy "ballot_ranks_insert" on public.ballot_ranks for insert to authenticated with check (true);
create policy "ballot_ranks_delete" on public.ballot_ranks for delete to authenticated using (true);

-- Ballot change logs: authenticated can read
create policy "ballot_change_logs_select" on public.ballot_change_logs for select to authenticated using (true);
create policy "ballot_change_logs_insert" on public.ballot_change_logs for insert to authenticated with check (true);

-- Admin logs: admins can read and insert
create policy "admin_logs_select" on public.admin_logs for select to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "admin_logs_insert" on public.admin_logs for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
