create table public.feedback_threads (
  id text primary key,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_display_name_snapshot text not null,
  content text not null,
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index feedback_threads_created_at_idx on public.feedback_threads(created_at desc);

create table public.feedback_replies (
  id text primary key,
  thread_id text not null references public.feedback_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_display_name_snapshot text not null,
  content text not null,
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index feedback_replies_thread_id_idx on public.feedback_replies(thread_id);
create index feedback_replies_thread_created_at_idx
  on public.feedback_replies (thread_id, created_at asc);

alter table public.feedback_threads enable row level security;
alter table public.feedback_replies enable row level security;

create policy "feedback_threads_select" on public.feedback_threads for select to authenticated
  using (
    status = 'visible'
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
create policy "feedback_threads_insert" on public.feedback_threads for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'visible'
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
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
    author_id = auth.uid()
    and status = 'visible'
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
    and exists (
      select 1
      from public.feedback_threads
      where feedback_threads.id = feedback_replies.thread_id
        and (
          feedback_threads.status = 'visible'
          or (select role from public.profiles where id = auth.uid()) = 'admin'
        )
    )
  );
create policy "feedback_replies_admin_update" on public.feedback_replies for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

alter table public.admin_logs drop constraint if exists admin_logs_target_type_check;
alter table public.admin_logs add constraint admin_logs_target_type_check
  check (target_type in ('user', 'movie', 'survey', 'invite', 'poll', 'suggestion', 'banner', 'setting', 'budget', 'feedback'));
