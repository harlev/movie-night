alter table public.surveys
  add column if not exists closes_at timestamptz;

alter table public.quick_polls
  add column if not exists closes_at timestamptz;
