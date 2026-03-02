# Site Settings + Next Movie Night Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace banner-only admin settings with a scalable Site Settings page and add manual Next Movie Night date override on top of automatic Wednesday behavior.

**Architecture:** Keep using the existing singleton `site_banners` row and extend it with a nullable override date. Move admin UI from `/admin/banner` to `/admin/site-settings` and split UI into Branding and Scheduling sections. Update dashboard date computation to use manual override first, otherwise auto Wednesday logic with Wednesday 8:00 PM Pacific cutoff.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase Postgres + RLS, Node `node:test` via `tsx`.

---

### Task 1: Add failing tests for scheduling behavior

**Files:**
- Modify: `src/lib/utils/nextMovieNight.test.ts`
- Modify: `src/app/(app)/dashboard/page.test.ts`

**Step 1: Write failing tests**
- Add tests for:
  - Wednesday before 8:00 PM PT => `Today!`
  - Wednesday at/after 8:00 PM PT => next Wednesday
  - Manual override date wins over automatic calculation

**Step 2: Run test to verify failure**
Run: `npx tsx --test "src/lib/utils/nextMovieNight.test.ts" "src/app/(app)/dashboard/page.test.ts"`
Expected: FAIL due missing new logic/API calls.

**Step 3: Write minimal implementation**
- Extend `nextMovieNight` utility API to return display string with override precedence and cutoff behavior.

**Step 4: Run test to verify pass**
Run same command.
Expected: PASS.

### Task 2: Add failing tests for admin route move and new scheduling controls

**Files:**
- Create: `src/app/(admin)/admin/site-settings/SiteSettingsClient.test.ts`

**Step 1: Write failing tests**
- Assert component includes banner controls and schedule override controls.
- Assert form action references for update/clear behavior.

**Step 2: Run tests to verify failure**
Run: `npx tsx --test "src/app/(admin)/admin/site-settings/SiteSettingsClient.test.ts"`
Expected: FAIL because file/component doesn’t exist.

**Step 3: Implement minimal page/component skeleton**
- Add new route + component at `/admin/site-settings`.

**Step 4: Re-run tests**
Expected: PASS.

### Task 3: Persist override in DB + actions/queries

**Files:**
- Create: `supabase/migrations/20260301_add_next_movie_night_override.sql`
- Modify: `supabase/schema.sql`
- Modify: `supabase/seed.sql`
- Modify: `src/lib/queries/siteBanner.ts`
- Modify: `src/lib/actions/siteBanner.ts`

**Step 1: Add migration + schema parity changes**
- Add nullable `next_movie_night_override_date date` to singleton settings table.

**Step 2: Add actions for scheduling**
- Add server action to set/clear override date with admin auth checks and dashboard revalidation.

**Step 3: Keep existing banner actions stable**
- Ensure banner upserts preserve override field.

**Step 4: Run focused tests**
Run: `npx tsx --test "src/lib/utils/nextMovieNight.test.ts"`
Expected: PASS.

### Task 4: Move admin route and sidebar

**Files:**
- Delete: `src/app/(admin)/admin/banner/page.tsx`
- Delete: `src/app/(admin)/admin/banner/BannerSettingsClient.tsx`
- Delete: `src/app/(admin)/admin/banner/BannerSettingsClient.test.ts`
- Create: `src/app/(admin)/admin/site-settings/page.tsx`
- Create: `src/app/(admin)/admin/site-settings/SiteSettingsClient.tsx`
- Modify: `src/components/AdminSidebar.tsx`

**Step 1: Move UI to site-settings route**
- Keep banner controls and add scheduling controls.

**Step 2: Replace sidebar entry**
- `Banner` -> `Site Settings` and `/admin/site-settings`.

**Step 3: Run tests**
Run: `npx tsx --test "src/app/(admin)/admin/site-settings/SiteSettingsClient.test.ts"`
Expected: PASS.

### Task 5: Wire dashboard display

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/lib/utils/nextMovieNight.ts`

**Step 1: Integrate override-aware display function**
- Compute label from settings row + auto fallback.

**Step 2: Verify dashboard tests**
Run: `npx tsx --test "src/app/(app)/dashboard/page.test.ts" "src/lib/utils/nextMovieNight.test.ts"`
Expected: PASS.

### Task 6: End-to-end verification (no push)

**Files:**
- N/A (verification)

**Step 1: Run full test suite**
Run: `npx tsx --test "src/**/*.test.ts"`
Expected: PASS.

**Step 2: Run production build**
Run: `npm run build`
Expected: PASS.

**Step 3: Apply local migration for manual QA**
Run: `supabase db push`
Expected: pending migration applied.

**Step 4: Keep changes local for user manual test**
- Do not push.

