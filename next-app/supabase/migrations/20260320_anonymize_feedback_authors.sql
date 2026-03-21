alter table public.feedback_threads alter column author_id drop not null;
alter table public.feedback_threads alter column author_display_name_snapshot drop not null;
alter table public.feedback_replies alter column author_id drop not null;
alter table public.feedback_replies alter column author_display_name_snapshot drop not null;

update public.feedback_threads
set author_id = null, author_display_name_snapshot = null
where is_anonymous = true;

update public.feedback_replies
set author_id = null, author_display_name_snapshot = null
where is_anonymous = true;

alter table public.feedback_threads drop constraint if exists feedback_threads_identity_check;
alter table public.feedback_threads add constraint feedback_threads_identity_check
  check (
    (
      is_anonymous
      and author_id is null
      and author_display_name_snapshot is null
    )
    or (
      not is_anonymous
      and author_id is not null
      and author_display_name_snapshot is not null
    )
  );

alter table public.feedback_replies drop constraint if exists feedback_replies_identity_check;
alter table public.feedback_replies add constraint feedback_replies_identity_check
  check (
    (
      is_anonymous
      and author_id is null
      and author_display_name_snapshot is null
    )
    or (
      not is_anonymous
      and author_id is not null
      and author_display_name_snapshot is not null
    )
  );

drop policy if exists "feedback_threads_insert" on public.feedback_threads;
create policy "feedback_threads_insert" on public.feedback_threads for insert to authenticated
  with check (
    status = 'visible'
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
    and (
      (
        is_anonymous
        and author_id is null
        and author_display_name_snapshot is null
      )
      or (
        not is_anonymous
        and author_id = auth.uid()
        and author_display_name_snapshot is not null
      )
    )
  );

drop policy if exists "feedback_replies_insert" on public.feedback_replies;
create policy "feedback_replies_insert" on public.feedback_replies for insert to authenticated
  with check (
    status = 'visible'
    and (select role from public.profiles where id = auth.uid()) != 'viewer'
    and (
      (
        is_anonymous
        and author_id is null
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
        and (
          feedback_threads.status = 'visible'
          or (select role from public.profiles where id = auth.uid()) = 'admin'
        )
    )
  );
