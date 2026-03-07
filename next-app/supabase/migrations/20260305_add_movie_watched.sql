alter table public.movies
add column if not exists watched boolean not null default false,
add column if not exists watched_at timestamptz;

create index if not exists movies_watched_idx on public.movies(watched);
