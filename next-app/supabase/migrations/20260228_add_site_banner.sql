create table public.site_banners (
  id text primary key,
  image_path text,
  enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_banners_singleton_id check (id = 'main')
);

insert into public.site_banners (id, enabled)
values ('main', false)
on conflict (id) do nothing;

alter table public.site_banners enable row level security;

create policy "site_banners_select" on public.site_banners
  for select to authenticated using (true);

create policy "site_banners_admin_insert" on public.site_banners
  for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "site_banners_admin_update" on public.site_banners
  for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

update storage.buckets
set
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'site-assets';

alter table public.admin_logs drop constraint if exists admin_logs_target_type_check;
alter table public.admin_logs add constraint admin_logs_target_type_check
  check (target_type in ('user', 'movie', 'survey', 'invite', 'poll', 'suggestion', 'banner'));
