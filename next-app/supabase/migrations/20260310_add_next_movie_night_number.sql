alter table public.site_settings
add column if not exists next_movie_night_number integer;

alter table public.site_settings
drop constraint if exists site_settings_next_movie_night_number_check;

alter table public.site_settings
add constraint site_settings_next_movie_night_number_check
check (next_movie_night_number is null or next_movie_night_number >= 1);

update public.site_settings
set next_movie_night_number = 64
where id = 'main'
  and next_movie_night_number is null;
