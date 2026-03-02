# Site Settings + Next Movie Night Design

## Goal
Move admin banner controls into a scalable Site Settings area and add admin control for Next Movie Night date with a safe automatic fallback.

## Approved Behavior
- Admin route becomes `/admin/site-settings`.
- Remove `/admin/banner` route entirely.
- Dashboard shows:
  - `Next Movie Night: Today!` on Wednesday before 8:00 PM Pacific.
  - Next Wednesday on Wednesday at/after 8:00 PM Pacific.
  - If admin sets an override date, use that date instead of automatic logic.
- Date display remains concise and consistent with existing dashboard styling.

## Architecture
- Keep singleton settings row in `site_banners` and extend it with `next_movie_night_override_date` (`date`, nullable).
- Reuse existing admin auth checks, action patterns, and `revalidatePath` flows used by banner actions.
- Expand `nextMovieNight` utility to produce display output with precedence order:
  1) manual override date
  2) automatic Wednesday logic with 8:00 PM Pacific cutoff.

## Data + Access
- Add migration for `next_movie_night_override_date`.
- Update `schema.sql` and `seed.sql` to keep base schema in sync.
- Use existing admin RLS policies on `site_banners` for updates.

## Admin UX
- New page title: Site Settings.
- Two sections/cards:
  - Branding (current banner upload/toggle UX)
  - Scheduling (override date set/clear controls)
- No redirect from `/admin/banner`; route is removed.

## Testing
- Unit tests for date logic including timezone/cutoff/override edge cases.
- File-level tests for new admin page/component path and schedule controls.
- Dashboard render/wiring tests for label + computed date output path.

