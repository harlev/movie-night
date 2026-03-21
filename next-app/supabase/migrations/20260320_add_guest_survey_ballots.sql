alter table public.ballots
  drop constraint if exists ballots_survey_id_user_id_key;

alter table public.ballots add column if not exists owner_mode text,
  add column if not exists guest_display_name text,
  add column if not exists guest_session_id_hash text;

update public.ballots
set owner_mode = 'identified'
where owner_mode is null;

alter table public.ballots
  alter column owner_mode set default 'identified',
  alter column owner_mode set not null,
  alter column user_id drop not null;

alter table public.ballots
  drop constraint if exists ballots_owner_mode_check;

alter table public.ballots
  add constraint ballots_owner_mode_check
  check (owner_mode in ('identified', 'guest'));

alter table public.ballots
  drop constraint if exists ballots_owner_identity_check;

alter table public.ballots
  add constraint ballots_owner_identity_check
  check (
    (owner_mode = 'identified' and user_id is not null and guest_session_id_hash is null)
    or (owner_mode = 'guest' and user_id is null and guest_session_id_hash is not null)
  );

create unique index if not exists ballots_identified_owner_idx
  on public.ballots(survey_id, user_id)
  where user_id is not null;

create unique index if not exists ballots_guest_owner_idx
  on public.ballots(survey_id, guest_session_id_hash)
  where guest_session_id_hash is not null;

alter table public.ballot_change_logs
  add column if not exists owner_mode text,
  add column if not exists owner_label text;

update public.ballot_change_logs
set owner_mode = 'identified',
    owner_label = coalesce(
      (
        select display_name
        from public.profiles
        where profiles.id = ballot_change_logs.user_id
      ),
      'Unknown'
    )
where owner_mode is null
   or owner_label is null;

alter table public.ballot_change_logs
  alter column user_id drop not null,
  alter column owner_mode set default 'identified',
  alter column owner_mode set not null,
  alter column owner_label set not null;

alter table public.ballot_change_logs
  drop constraint if exists ballot_change_logs_owner_mode_check;

alter table public.ballot_change_logs
  add constraint ballot_change_logs_owner_mode_check
  check (owner_mode in ('identified', 'guest'));
