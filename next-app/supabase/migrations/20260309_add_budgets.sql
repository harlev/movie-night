create table if not exists public.budgets (
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

create unique index if not exists budgets_single_open_idx
  on public.budgets (status)
  where status = 'open';

create table if not exists public.budget_lifecycle_events (
  id text primary key,
  budget_id text not null references public.budgets(id) on delete cascade,
  event_type text not null check (event_type in ('opened', 'closed', 'reopened')),
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists budget_lifecycle_events_budget_id_idx
  on public.budget_lifecycle_events (budget_id, created_at desc);

alter table public.budgets enable row level security;
alter table public.budget_lifecycle_events enable row level security;

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

alter table public.admin_logs drop constraint if exists admin_logs_target_type_check;
alter table public.admin_logs add constraint admin_logs_target_type_check
  check (target_type in ('user', 'movie', 'survey', 'invite', 'poll', 'suggestion', 'banner', 'setting', 'budget'));
