-- Profiles table (synced with auth.users via trigger)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
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
  role text not null default 'member' check (role in ('member', 'viewer')),
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
  watched boolean not null default false,
  watched_at timestamptz,
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

-- Movie suggestions (for next week voting)
create table public.movie_suggestions (
  id text primary key,
  movie_id text not null references public.movies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(movie_id, user_id)
);
create index movie_suggestions_movie_id_idx on public.movie_suggestions(movie_id);
create index movies_watched_idx on public.movies(watched);

-- Surveys table
create table public.surveys (
  id text primary key,
  title text not null,
  description text,
  state text not null default 'draft' check (state in ('draft', 'live', 'frozen')),
  max_rank_n integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  frozen_at timestamptz,
  closes_at timestamptz
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
  owner_mode text not null default 'identified' check (owner_mode in ('identified', 'guest')),
  user_id uuid references public.profiles(id),
  guest_display_name text,
  guest_session_id_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ballots_owner_identity_check check (
    (owner_mode = 'identified' and user_id is not null and guest_session_id_hash is null)
    or (owner_mode = 'guest' and user_id is null and guest_session_id_hash is not null)
  )
);
create unique index ballots_identified_owner_idx on public.ballots(survey_id, user_id) where user_id is not null;
create unique index ballots_guest_owner_idx on public.ballots(survey_id, guest_session_id_hash) where guest_session_id_hash is not null;

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
  user_id uuid references public.profiles(id),
  owner_mode text not null default 'identified' check (owner_mode in ('identified', 'guest')),
  owner_label text not null,
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
  target_type text not null check (target_type in ('user', 'movie', 'survey', 'invite', 'poll', 'suggestion', 'banner', 'setting', 'budget', 'feedback')),
  target_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Site banner (singleton row)
create table public.site_banners (
  id text primary key,
  image_path text,
  mobile_image_path text,
  enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_banners_singleton_id check (id = 'main')
);
insert into public.site_banners (id, enabled) values ('main', false);

-- Site settings (singleton row)
create table public.site_settings (
  id text primary key,
  next_movie_night_override_date date,
  next_movie_night_number integer,
  next_movie_id text references public.movies(id),
  next_movie_source_survey_id text references public.surveys(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_next_movie_night_number_check check (next_movie_night_number is null or next_movie_night_number >= 1),
  constraint site_settings_singleton_id check (id = 'main')
);
insert into public.site_settings (id, next_movie_night_number)
values ('main', 64)
on conflict (id) do nothing;

create table public.budgets (
  id text primary key,
  initial_total_amount_cents integer not null check (initial_total_amount_cents >= 0),
  initial_current_amount_cents integer not null check (initial_current_amount_cents >= 0),
  total_amount_cents integer not null check (total_amount_cents >= 0),
  current_amount_cents integer not null check (current_amount_cents >= 0),
  venmo_url text not null,
  status text not null check (status in ('open', 'closed')),
  last_opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (initial_current_amount_cents <= initial_total_amount_cents),
  check (current_amount_cents <= total_amount_cents)
);
create unique index budgets_single_open_idx on public.budgets(status) where status = 'open';

create table public.budget_lifecycle_events (
  id text primary key,
  budget_id text not null references public.budgets(id) on delete cascade,
  event_type text not null check (event_type in ('opened', 'closed', 'reopened')),
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index budget_lifecycle_events_budget_id_idx
  on public.budget_lifecycle_events (budget_id, created_at desc);

create table public.feedback_threads (
  id text primary key,
  author_id uuid references public.profiles(id) on delete cascade,
  author_display_name_snapshot text,
  content text not null,
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by_author boolean not null default false,
  constraint feedback_threads_identity_check check (
    (
      is_anonymous
      and author_id is not null
      and author_display_name_snapshot is null
    )
    or (
      is_anonymous
      and author_id is null
      and author_display_name_snapshot is null
    )
    or (
      not is_anonymous
      and author_id is not null
      and author_display_name_snapshot is not null
    )
  )
);
create index feedback_threads_created_at_idx on public.feedback_threads(created_at desc);

create table public.feedback_replies (
  id text primary key,
  thread_id text not null references public.feedback_threads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  author_display_name_snapshot text,
  content text not null,
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint feedback_replies_identity_check check (
    (
      is_anonymous
      and author_id is not null
      and author_display_name_snapshot is null
    )
    or (
      is_anonymous
      and author_id is null
      and author_display_name_snapshot is null
    )
    or (
      not is_anonymous
      and author_id is not null
      and author_display_name_snapshot is not null
    )
  )
);
create index feedback_replies_thread_id_idx on public.feedback_replies(thread_id);
create index feedback_replies_thread_created_at_idx
  on public.feedback_replies (thread_id, created_at asc);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ),
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
alter table public.movie_suggestions enable row level security;
alter table public.admin_logs enable row level security;
alter table public.site_banners enable row level security;
alter table public.site_settings enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_lifecycle_events enable row level security;
alter table public.feedback_threads enable row level security;
alter table public.feedback_replies enable row level security;

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
create policy "movies_insert" on public.movies for insert to authenticated
  with check (suggested_by = auth.uid()
    and (select role from public.profiles where id = auth.uid()) != 'viewer');
create policy "movies_update" on public.movies for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Movie comments: authenticated can read, insert own
create policy "movie_comments_select" on public.movie_comments for select to authenticated using (true);
create policy "movie_comments_insert" on public.movie_comments for insert to authenticated
  with check (user_id = auth.uid()
    and (select role from public.profiles where id = auth.uid()) != 'viewer');

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
create policy "ballots_insert" on public.ballots for insert to authenticated
  with check (user_id = auth.uid()
    and (select role from public.profiles where id = auth.uid()) != 'viewer');
create policy "ballots_update" on public.ballots for update to authenticated using (user_id = auth.uid());

-- Ballot ranks: authenticated can read all, insert/delete own ballot's ranks
create policy "ballot_ranks_select" on public.ballot_ranks for select to authenticated using (true);
create policy "ballot_ranks_insert" on public.ballot_ranks for insert to authenticated with check (true);
create policy "ballot_ranks_delete" on public.ballot_ranks for delete to authenticated using (true);

-- Ballot change logs: authenticated can read
create policy "ballot_change_logs_select" on public.ballot_change_logs for select to authenticated using (true);
create policy "ballot_change_logs_insert" on public.ballot_change_logs for insert to authenticated with check (true);

-- Movie suggestions: authenticated can read, members/admins can insert own, users can delete own, admins can delete any
create policy "movie_suggestions_select" on public.movie_suggestions
  for select to authenticated using (true);
create policy "movie_suggestions_insert" on public.movie_suggestions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
  );
create policy "movie_suggestions_delete_own" on public.movie_suggestions
  for delete to authenticated
  using (user_id = auth.uid());
create policy "movie_suggestions_delete_admin" on public.movie_suggestions
  for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Admin logs: admins can read and insert
create policy "admin_logs_select" on public.admin_logs for select to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "admin_logs_insert" on public.admin_logs for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Site banners: authenticated users can read, admins can manage
create policy "site_banners_select" on public.site_banners for select to authenticated using (true);
create policy "site_banners_admin_insert" on public.site_banners for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "site_banners_admin_update" on public.site_banners for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Site settings: authenticated users can read, admins can manage
create policy "site_settings_select" on public.site_settings for select to authenticated using (true);
create policy "site_settings_admin_insert" on public.site_settings for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "site_settings_admin_update" on public.site_settings for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "budgets_select" on public.budgets for select to authenticated
  using (
    status = 'open'
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
create policy "budgets_admin_insert" on public.budgets for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "budgets_admin_update" on public.budgets for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "budget_lifecycle_events_select" on public.budget_lifecycle_events for select to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "budget_lifecycle_events_admin_insert" on public.budget_lifecycle_events for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "feedback_threads_select" on public.feedback_threads for select to authenticated
  using (
    status = 'visible'
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
create policy "feedback_threads_insert" on public.feedback_threads for insert to authenticated
  with check (
    status = 'visible'
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
    and (
      (
        is_anonymous
        and author_id = auth.uid()
        and author_display_name_snapshot is null
      )
      or (
        not is_anonymous
        and author_id = auth.uid()
        and author_display_name_snapshot is not null
      )
    )
  );
create policy "feedback_threads_admin_update" on public.feedback_threads for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "feedback_replies_select" on public.feedback_replies for select to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or (
      status = 'visible'
      and exists (
        select 1
        from public.feedback_threads
        where feedback_threads.id = feedback_replies.thread_id
          and feedback_threads.status = 'visible'
      )
    )
  );
create policy "feedback_replies_insert" on public.feedback_replies for insert to authenticated
  with check (
    status = 'visible'
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
    and (
      (
        is_anonymous
        and author_id = auth.uid()
        and author_display_name_snapshot is null
      )
      or (
        not is_anonymous
        and author_id = auth.uid()
        and author_display_name_snapshot is not null
      )
    )
    and exists (
      select 1
      from public.feedback_threads
      where feedback_threads.id = feedback_replies.thread_id
        and feedback_threads.deleted_at is null
        and (
          feedback_threads.status = 'visible'
          or (select role from public.profiles where id = auth.uid()) = 'admin'
        )
    )
  );
create policy "feedback_replies_admin_update" on public.feedback_replies for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
