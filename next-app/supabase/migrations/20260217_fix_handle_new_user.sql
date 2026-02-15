-- Fix handle_new_user trigger to use better display_name fallbacks.
-- Previously only checked raw_user_meta_data->>'display_name' and fell back to 'User'.
-- Google OAuth sets 'full_name'/'name', not 'display_name', so every OAuth user got 'User'.
-- New fallback chain: display_name → full_name → name → email prefix.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;
