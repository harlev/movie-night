alter table public.surveys add column archived boolean not null default false;
alter table public.quick_polls add column archived boolean not null default false;
