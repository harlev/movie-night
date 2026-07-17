-- Generalize movie surveys into reusable movie/open surveys.

alter table public.surveys
  add column if not exists survey_type text not null default 'movie',
  add column if not exists allow_responder_options boolean not null default false,
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists members_only boolean not null default true;

alter table public.surveys drop constraint if exists surveys_survey_type_check;
alter table public.surveys add constraint surveys_survey_type_check
  check (survey_type in ('movie', 'open'));

alter table public.survey_entries
  alter column movie_id drop not null,
  alter column added_by drop not null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists image_path text,
  add column if not exists link_url text,
  add column if not exists created_by_mode text not null default 'admin',
  add column if not exists created_by_voter_id text;

alter table public.survey_entries drop constraint if exists survey_entries_created_by_mode_check;
alter table public.survey_entries add constraint survey_entries_created_by_mode_check
  check (created_by_mode in ('admin', 'responder'));
alter table public.survey_entries drop constraint if exists survey_entries_content_check;
alter table public.survey_entries add constraint survey_entries_content_check check (
  (movie_id is not null and title is null and created_by_mode = 'admin')
  or (movie_id is null and nullif(btrim(title), '') is not null)
);
alter table public.survey_entries drop constraint if exists survey_entries_creator_check;
alter table public.survey_entries add constraint survey_entries_creator_check check (
  (created_by_mode = 'admin' and added_by is not null and created_by_voter_id is null)
  or (created_by_mode = 'responder' and num_nonnulls(added_by, created_by_voter_id) = 1)
);

create unique index if not exists survey_entries_open_title_unique
  on public.survey_entries (survey_id, lower(btrim(title)))
  where movie_id is null and removed_at is null;

alter table public.ballots drop constraint if exists ballots_survey_id_user_id_key;
alter table public.ballots
  alter column user_id drop not null,
  add column if not exists owner_mode text not null default 'user',
  add column if not exists voter_id text,
  add column if not exists guest_display_name text;

alter table public.ballots drop constraint if exists ballots_owner_mode_check;
alter table public.ballots drop constraint if exists ballots_owner_identity_check;
alter table public.ballots drop constraint if exists ballots_owner_check;

-- Preserve ballots created by the previous guest-voting implementation.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ballots' and column_name = 'guest_session_id_hash'
  ) then
    execute $sql$
      update public.ballots
      set voter_id = guest_session_id_hash
      where owner_mode = 'guest' and voter_id is null
    $sql$;
  end if;
end $$;

update public.ballots set owner_mode = 'user' where owner_mode = 'identified';
update public.ballots
set guest_display_name = coalesce(nullif(btrim(guest_display_name), ''), 'Anonymous')
where owner_mode = 'guest';
alter table public.ballots alter column owner_mode set default 'user';
drop index if exists public.ballots_identified_owner_idx;
drop index if exists public.ballots_guest_owner_idx;
alter table public.ballots drop column if exists guest_session_id_hash;

alter table public.ballots add constraint ballots_owner_mode_check
  check (owner_mode in ('user', 'guest', 'anonymous'));
alter table public.ballots add constraint ballots_owner_check check (
  (owner_mode = 'user' and user_id is not null and voter_id is null and guest_display_name is null)
  or (owner_mode = 'guest' and user_id is null and voter_id is not null and nullif(btrim(guest_display_name), '') is not null)
  or (owner_mode = 'anonymous' and user_id is null and voter_id is not null and guest_display_name is null)
);

create unique index if not exists ballots_survey_user_unique
  on public.ballots (survey_id, user_id) where owner_mode = 'user';
create unique index if not exists ballots_survey_voter_unique
  on public.ballots (survey_id, voter_id) where owner_mode in ('guest', 'anonymous');

alter table public.ballot_ranks add column if not exists survey_entry_id text;

update public.ballot_ranks br
set survey_entry_id = se.id
from public.ballots b
join public.survey_entries se on se.survey_id = b.survey_id
where br.ballot_id = b.id
  and se.movie_id = br.movie_id
  and br.survey_entry_id is null;

do $$
begin
  if exists (select 1 from public.ballot_ranks where survey_entry_id is null) then
    raise exception 'Cannot migrate ballot ranks: one or more survey entries are missing';
  end if;
end $$;

alter table public.ballot_ranks alter column survey_entry_id set not null;
alter table public.ballot_ranks drop constraint if exists ballot_ranks_survey_entry_id_fkey;
alter table public.ballot_ranks add constraint ballot_ranks_survey_entry_id_fkey
  foreign key (survey_entry_id) references public.survey_entries(id);
alter table public.ballot_ranks alter column movie_id drop not null;
create unique index if not exists ballot_ranks_ballot_rank_unique
  on public.ballot_ranks (ballot_id, rank);
create unique index if not exists ballot_ranks_ballot_entry_unique
  on public.ballot_ranks (ballot_id, survey_entry_id);

alter table public.ballot_change_logs alter column user_id drop not null;
alter table public.ballot_change_logs
  add column if not exists owner_mode text not null default 'user',
  add column if not exists voter_id text,
  add column if not exists owner_label text;
alter table public.ballot_change_logs drop constraint if exists ballot_change_logs_owner_mode_check;
update public.ballot_change_logs set owner_mode = 'user' where owner_mode = 'identified';
update public.ballot_change_logs logs
set owner_label = coalesce(
  nullif(btrim(logs.owner_label), ''),
  (select nullif(btrim(p.display_name), '') from public.profiles p where p.id = logs.user_id),
  case when logs.owner_mode = 'anonymous' then 'Anonymous' when logs.owner_mode = 'guest' then 'Guest' else 'Unknown' end
)
where owner_label is null or nullif(btrim(owner_label), '') is null;
alter table public.ballot_change_logs alter column owner_mode set default 'user';
alter table public.ballot_change_logs alter column owner_label set not null;
alter table public.ballot_change_logs add constraint ballot_change_logs_owner_mode_check
  check (owner_mode in ('user', 'guest', 'anonymous'));

drop function if exists public.submit_ballot(text, uuid, jsonb);
create or replace function public.submit_ballot(
  p_survey_id text,
  p_authenticated_user_id uuid,
  p_owner_mode text,
  p_voter_id text,
  p_guest_display_name text,
  p_ranks jsonb
) returns void as $$
declare
  v_survey public.surveys%rowtype;
  v_ballot_id text;
  v_previous_ranks jsonb;
  v_rank record;
  v_user_role text;
  v_user_display_name text;
  v_owner_label text;
  v_rank_count integer;
begin
  select * into v_survey from public.surveys where id = p_survey_id for update;
  if not found then raise exception 'Survey not found'; end if;
  if v_survey.state <> 'live' or (v_survey.closes_at is not null and now() >= v_survey.closes_at) then
    raise exception 'Survey is not accepting votes';
  end if;

  if p_authenticated_user_id is not null then
    select role, display_name into v_user_role, v_user_display_name from public.profiles
    where id = p_authenticated_user_id and status = 'active';
    if v_user_role is null then raise exception 'Authenticated account is not active'; end if;
  end if;
  if v_survey.members_only and coalesce(v_user_role, 'viewer') not in ('admin', 'member') then
    raise exception 'This survey is limited to members';
  end if;
  if v_user_role = 'viewer' then raise exception 'Viewers cannot submit ballots'; end if;

  if v_survey.is_anonymous and p_owner_mode <> 'anonymous' then
    raise exception 'Anonymous survey requires anonymous ownership';
  end if;
  if not v_survey.is_anonymous and p_owner_mode = 'anonymous' then
    raise exception 'Named survey requires named ownership';
  end if;
  if p_owner_mode = 'user' and p_authenticated_user_id is null then
    raise exception 'Authenticated owner is required';
  end if;
  if p_owner_mode in ('guest', 'anonymous') and nullif(btrim(p_voter_id), '') is null then
    raise exception 'Voter identity is required';
  end if;
  if p_owner_mode = 'guest' and nullif(btrim(p_guest_display_name), '') is null then
    raise exception 'Guest display name is required';
  end if;
  v_owner_label := case
    when p_owner_mode = 'anonymous' then 'Anonymous'
    when p_owner_mode = 'guest' then btrim(p_guest_display_name)
    else coalesce(nullif(btrim(v_user_display_name), ''), 'Unknown')
  end;

  select count(*) into v_rank_count from jsonb_to_recordset(p_ranks) as x(rank integer, "optionId" text);
  if v_rank_count < 1 or v_rank_count > v_survey.max_rank_n then
    raise exception 'Invalid number of selections';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_ranks) as x(rank integer, "optionId" text)
    where x.rank < 1 or x.rank > v_survey.max_rank_n
       or not exists (
         select 1 from public.survey_entries se
         where se.id = x."optionId" and se.survey_id = p_survey_id and se.removed_at is null
       )
  ) then raise exception 'Invalid survey option or rank'; end if;
  if (select count(distinct rank) from jsonb_to_recordset(p_ranks) as x(rank integer, "optionId" text)) <> v_rank_count
    or (select count(distinct "optionId") from jsonb_to_recordset(p_ranks) as x(rank integer, "optionId" text)) <> v_rank_count then
    raise exception 'Duplicate rank or option';
  end if;

  if p_owner_mode = 'user' then
    select id into v_ballot_id from public.ballots
    where survey_id = p_survey_id and owner_mode = 'user' and user_id = p_authenticated_user_id;
  else
    select id into v_ballot_id from public.ballots
    where survey_id = p_survey_id and owner_mode = p_owner_mode and voter_id = p_voter_id;
  end if;

  if v_ballot_id is not null then
    select jsonb_agg(jsonb_build_object('rank', rank, 'optionId', survey_entry_id) order by rank)
      into v_previous_ranks from public.ballot_ranks where ballot_id = v_ballot_id;
    delete from public.ballot_ranks where ballot_id = v_ballot_id;
    update public.ballots set updated_at = now(), guest_display_name = case when p_owner_mode = 'guest' then btrim(p_guest_display_name) else null end
      where id = v_ballot_id;
  else
    v_ballot_id := gen_random_uuid()::text;
    insert into public.ballots (id, survey_id, user_id, owner_mode, voter_id, guest_display_name)
    values (
      v_ballot_id,
      p_survey_id,
      case when p_owner_mode = 'user' then p_authenticated_user_id else null end,
      p_owner_mode,
      case when p_owner_mode in ('guest', 'anonymous') then p_voter_id else null end,
      case when p_owner_mode = 'guest' then btrim(p_guest_display_name) else null end
    );
  end if;

  for v_rank in select * from jsonb_to_recordset(p_ranks) as x(rank integer, "optionId" text)
  loop
    insert into public.ballot_ranks (id, ballot_id, rank, survey_entry_id, movie_id)
    select gen_random_uuid()::text, v_ballot_id, v_rank.rank, se.id, se.movie_id
    from public.survey_entries se where se.id = v_rank."optionId";
  end loop;

  insert into public.ballot_change_logs (id, survey_id, user_id, owner_mode, voter_id, owner_label, previous_ranks, new_ranks, reason)
  values (
    gen_random_uuid()::text,
    p_survey_id,
    case when p_owner_mode = 'user' then p_authenticated_user_id else null end,
    p_owner_mode,
    case when p_owner_mode in ('guest', 'anonymous') then p_voter_id else null end,
    v_owner_label,
    v_previous_ranks,
    p_ranks,
    'user_update'
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.remove_ballot_option(
  p_survey_id text,
  p_survey_entry_id text
) returns integer as $$
declare
  v_ballot record;
  v_current_ranks jsonb;
  v_new_ranks jsonb;
  v_affected integer := 0;
begin
  for v_ballot in
    select distinct b.* from public.ballots b
    join public.ballot_ranks br on br.ballot_id = b.id
    where b.survey_id = p_survey_id and br.survey_entry_id = p_survey_entry_id
  loop
    select jsonb_agg(jsonb_build_object('rank', rank, 'optionId', survey_entry_id) order by rank)
      into v_current_ranks from public.ballot_ranks where ballot_id = v_ballot.id;
    delete from public.ballot_ranks where ballot_id = v_ballot.id and survey_entry_id = p_survey_entry_id;
    update public.ballot_ranks set rank = rank + 1000 where ballot_id = v_ballot.id;
    with ordered as (
      select id, row_number() over (order by rank)::integer as next_rank
      from public.ballot_ranks where ballot_id = v_ballot.id
    )
    update public.ballot_ranks br set rank = ordered.next_rank from ordered where br.id = ordered.id;
    select jsonb_agg(jsonb_build_object('rank', rank, 'optionId', survey_entry_id) order by rank)
      into v_new_ranks from public.ballot_ranks where ballot_id = v_ballot.id;
    insert into public.ballot_change_logs (id, survey_id, user_id, owner_mode, voter_id, owner_label, previous_ranks, new_ranks, reason)
    values (
      gen_random_uuid()::text,
      p_survey_id,
      v_ballot.user_id,
      v_ballot.owner_mode,
      v_ballot.voter_id,
      case
        when v_ballot.owner_mode = 'anonymous' then 'Anonymous'
        when v_ballot.owner_mode = 'guest' then coalesce(nullif(btrim(v_ballot.guest_display_name), ''), 'Guest')
        else coalesce((select nullif(btrim(display_name), '') from public.profiles where id = v_ballot.user_id), 'Unknown')
      end,
      v_current_ranks,
      v_new_ranks,
      'movie_removed'
    );
    v_affected := v_affected + 1;
  end loop;
  return v_affected;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.finalize_expired_surveys()
returns setof text as $$
  update public.surveys
  set state = 'frozen', frozen_at = coalesce(frozen_at, closes_at, now()), updated_at = now()
  where state = 'live' and closes_at is not null and closes_at <= now()
  returning id;
$$ language sql security definer set search_path = public;

revoke execute on function public.submit_ballot(text, uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_ballot(text, uuid, text, text, text, jsonb) to service_role;
revoke execute on function public.remove_ballot_option(text, text) from public, anon, authenticated;
grant execute on function public.remove_ballot_option(text, text) to service_role;
revoke execute on function public.finalize_expired_surveys() from public, anon, authenticated;
grant execute on function public.finalize_expired_surveys() to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'survey-option-images',
  'survey-option-images',
  true,
  2000000,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "surveys_public_select" on public.surveys;
create policy "surveys_public_select" on public.surveys for select to anon
  using (members_only = false and state <> 'draft');
drop policy if exists "survey_entries_public_select" on public.survey_entries;
create policy "survey_entries_public_select" on public.survey_entries for select to anon
  using (removed_at is null and exists (
    select 1 from public.surveys s
    where s.id = survey_entries.survey_id and s.members_only = false and s.state <> 'draft'
  ));
