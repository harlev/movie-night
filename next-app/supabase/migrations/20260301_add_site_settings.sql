create table if not exists public.site_settings (
  id text primary key,
  next_movie_night_override_date date,
  next_movie_id text references public.movies(id),
  next_movie_source_survey_id text references public.surveys(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton_id check (id = 'main')
);

insert into public.site_settings (id, next_movie_night_override_date)
values (
  'main',
  (select next_movie_night_override_date from public.site_banners where id = 'main')
)
on conflict (id) do update
set next_movie_night_override_date = coalesce(excluded.next_movie_night_override_date, public.site_settings.next_movie_night_override_date);

alter table public.site_settings enable row level security;

create policy "site_settings_select" on public.site_settings
  for select to authenticated using (true);

create policy "site_settings_admin_insert" on public.site_settings
  for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "site_settings_admin_update" on public.site_settings
  for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

alter table public.site_banners
drop column if exists next_movie_night_override_date;

alter table public.admin_logs drop constraint if exists admin_logs_target_type_check;
alter table public.admin_logs add constraint admin_logs_target_type_check
  check (target_type in ('user', 'movie', 'survey', 'invite', 'poll', 'suggestion', 'banner', 'setting'));
