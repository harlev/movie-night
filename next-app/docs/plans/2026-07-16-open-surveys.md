# Open Surveys Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reusable general-purpose surveys with custom options, public/member and anonymous/named response modes, automatic closing, and sharing without duplicating the existing movie-survey ballot flow.

**Architecture:** Generalize `surveys`, `survey_entries`, `ballots`, and `ballot_ranks` so movie and open surveys share one persistence and voting pipeline. Adapt both entry types into a neutral `SurveyChoice` view model consumed by the existing ballot hook, scoring, and result components; conditionally require authentication from survey settings and reconcile expired live surveys at every server boundary.

**Tech Stack:** Next.js 16 App Router, React 19 server actions, TypeScript, Supabase/PostgreSQL/RLS/Storage, Node test runner, Tailwind CSS.

---

### Task 1: Add neutral survey-domain types and validation

**Files:**
- Modify: `src/lib/types/index.ts`
- Create: `src/lib/utils/surveyConfig.ts`
- Create: `src/lib/utils/surveyConfig.test.ts`
- Modify: `src/lib/services/scoring.ts`
- Create: `src/lib/services/scoring.test.ts`

**Step 1: Write failing tests**

Cover these pure behaviors:

```ts
assert.deepEqual(SURVEY_SELECTION_SIZES, [1, 3, 5]);
assert.equal(validateSurveySelectionSize(1), 1);
assert.equal(validateSurveySelectionSize(7), null);
assert.equal(canDisableResponderOptions(1), false);
assert.equal(canDisableResponderOptions(2), true);
assert.equal(isSurveyClosed({ state: 'live', closesAt: past }, now), true);
assert.deepEqual(calculateStandings(ballots, choices, 3)[0].rankCounts, [1, 1, 0]);
```

Define `SurveyType`, `SurveyOwnerMode`, `SurveyChoice`, and entry/ballot types that use `optionId` instead of movie-specific identifiers. Keep compatibility aliases only at external boundaries that have not yet been migrated.

**Step 2: Run tests and verify failure**

Run: `node --test --import=tsx src/lib/utils/surveyConfig.test.ts src/lib/services/scoring.test.ts`

Expected: FAIL because the survey configuration utility and neutral scoring model do not exist.

**Step 3: Implement the pure domain layer**

Add constants for allowed new selection sizes, length limits, image MIME/byte limits, URL parsing restricted to `http:` and `https:`, close-boundary evaluation, and the two-admin-option rule. Rename scoring internals to choice-neutral names while retaining `movieId`/`posterPath` compatibility fields only if needed by existing callers during the transition.

**Step 4: Run tests and verify pass**

Run: `node --test --import=tsx src/lib/utils/surveyConfig.test.ts src/lib/services/scoring.test.ts`

Expected: PASS.

### Task 2: Migrate the database to generic survey entries and owners

**Files:**
- Create: `supabase/migrations/20260716_add_open_surveys.sql`
- Modify: `supabase/schema.sql`
- Modify: `supabase/seed.sql`
- Modify: `supabase/schemaConsistency.test.ts`

**Step 1: Write failing schema tests**

Assert that migration, canonical schema, and seed all define:

```sql
survey_type check (survey_type in ('movie', 'open'))
allow_responder_options boolean not null default false
is_anonymous boolean not null default false
members_only boolean not null default true
survey_entries.title text
ballot_ranks.survey_entry_id text
ballots.owner_mode
```

Also assert the migration backfills `ballot_ranks.survey_entry_id`, adds partial unique owner indexes, creates option-image storage configuration, and replaces `submit_ballot`/`remove_ballot_option` atomically.

**Step 2: Run the schema test and verify failure**

Run: `node --test --import=tsx supabase/schemaConsistency.test.ts`

Expected: FAIL on the missing open-survey schema.

**Step 3: Write the forward migration**

The migration must:

1. Add and backfill survey settings, with all existing surveys set to `movie`, non-anonymous, members-only, and responder additions disabled.
2. Make `survey_entries.movie_id` nullable and add custom option metadata, creator mode/profile/voter token, and active-entry constraints.
3. Add `ballot_ranks.survey_entry_id`, backfill it by joining ballot -> survey -> survey entry on the old movie ID, validate all ranks were mapped, then switch the foreign key/index while retaining the old column only as a compatibility safety column if required for a zero-downtime deployment.
4. Make `ballots.user_id` nullable; add `owner_mode`, `voter_id`, and `guest_display_name`; replace the old uniqueness constraint with partial indexes.
5. Replace ballot RPCs so they validate survey state/closing time, entry membership, rank bounds/uniqueness, and owner identity inside one transaction.
6. Add an idempotent `finalize_expired_surveys()` function.
7. Create a public `survey-option-images` bucket with MIME and byte limits plus narrowly scoped policies; store only generated paths.
8. Add RLS policies needed for public survey reads without granting public writes directly.

**Step 4: Mirror the final state**

Update `schema.sql` and `seed.sql` so new environments have the same columns, constraints, indexes, RPCs, RLS, and bucket setup.

**Step 5: Run schema tests**

Run: `node --test --import=tsx supabase/schemaConsistency.test.ts`

Expected: PASS.

### Task 3: Generalize survey and ballot queries

**Files:**
- Modify: `src/lib/queries/surveys.ts`
- Modify: `src/lib/queries/ballots.ts`
- Create: `src/lib/queries/surveys.test.ts`
- Modify: `src/lib/queries/ballots.test.ts`

**Step 1: Write failing query contract tests**

Test source/API contracts for:

- `createSurvey` accepting type/access/anonymity/responder settings.
- `getSurveyChoices` returning a neutral choice for movie and custom entries.
- admin and responder option insert functions recording the correct creator mode.
- option image cleanup after a failed insert or draft deletion.
- `getBallot`/`getAllBallots` resolving `survey_entry_id` and hiding names for anonymous surveys.
- `finalizeExpiredSurveys` calling the database function.
- preserving the pre-existing guest-ballot fallback assertions.

**Step 2: Run and verify failure**

Run: `node --test --import=tsx src/lib/queries/surveys.test.ts src/lib/queries/ballots.test.ts`

Expected: FAIL on missing generic queries.

**Step 3: Implement query adapters**

Create one `getSurveyChoices(surveyId)` query that loads entries and their optional movie relation, then maps each to:

```ts
{
  id: entry.id,
  title: entry.movie?.title ?? entry.title,
  description: entry.movie?.metadata_snapshot?.overview ?? entry.description,
  imageUrl: moviePosterUrl ?? storagePublicUrl,
  linkUrl: entry.link_url,
  movie: entry.movie ?? null,
  createdByMode: entry.created_by_mode,
}
```

Keep `getSurveyEntries` as a temporary movie-only wrapper for movie-night-specific callers. Update ballot queries to use entry IDs and to return `Anonymous` whenever the survey is anonymous, regardless of any owner fields.

**Step 4: Run tests**

Run: `node --test --import=tsx src/lib/queries/surveys.test.ts src/lib/queries/ballots.test.ts`

Expected: PASS.

### Task 4: Add server-authoritative survey and ballot actions

**Files:**
- Modify: `src/lib/actions/surveys.ts`
- Modify: `src/lib/actions/ballots.ts`
- Create: `src/lib/actions/surveys.test.ts`
- Modify: `src/lib/actions/ballots.test.ts`
- Modify: `src/lib/supabase/middleware.ts`

**Step 1: Write failing action tests**

Cover:

- creation defaults (`movie`, named, members-only) and open-survey settings;
- only 1/3/5 accepted for new or edited surveys;
- forcing responder additions when admin option count is below two;
- option title/description/link/image validation;
- responder additions only for live, open, opted-in, non-expired surveys;
- member-only enforcement;
- named public guest name requirement;
- anonymous submissions omitting profile/name;
- duplicate ranks/options rejected;
- voting and option insertion rejected at the exact closing timestamp;
- middleware issuing a stable `survey_voter_id` cookie without bypassing members-only checks.

**Step 2: Run and verify failure**

Run: `node --test --import=tsx src/lib/actions/surveys.test.ts src/lib/actions/ballots.test.ts src/lib/utils/serverActionsConfig.test.ts`

Expected: FAIL.

**Step 3: Implement actions**

Centralize `requireAdmin`, survey configuration parsing, current responder resolution, and close reconciliation. Add `addOpenSurveyOptionAction`, `removeOpenSurveyOptionAction`, `updateSurveySettingsAction`, and responder option submission. Update `submitBallotAction` to resolve the allowed owner, validate neutral option IDs, and call the generic atomic RPC. Preserve safe simple-survey redirects for movie surveys.

Upload images only after all cheap validation passes. If the database insert fails, delete the uploaded object. When deleting a draft custom option, remove its object after the database mutation succeeds.

**Step 4: Run action tests**

Run: `node --test --import=tsx src/lib/actions/surveys.test.ts src/lib/actions/ballots.test.ts src/lib/utils/serverActionsConfig.test.ts`

Expected: PASS.

### Task 5: Reuse the admin survey UI for both survey types

**Files:**
- Modify: `src/app/(admin)/admin/surveys/new/page.tsx`
- Modify: `src/app/(admin)/admin/surveys/page.tsx`
- Modify: `src/app/(admin)/admin/surveys/[id]/page.tsx`
- Modify: `src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.tsx`
- Create: `src/components/surveys/SurveySettingsFields.tsx`
- Create: `src/components/surveys/OpenSurveyOptionForm.tsx`
- Create: `src/components/surveys/SurveyChoiceCard.tsx`
- Modify: `src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.test.ts`
- Create: `src/app/(admin)/admin/surveys/new/page.test.ts`

**Step 1: Write failing UI contract tests**

Assert the create page provides movie/open type selection, shared 1/3/5 settings, and correct defaults. Assert the detail client branches only the entry editor/renderer while keeping common details, closing, state, ballots, archive, and sharing controls. Assert the responder-option toggle cannot be disabled below two admin options and includes explanatory text.

**Step 2: Run and verify failure**

Run: `node --test --import=tsx 'src/app/(admin)/admin/surveys/new/page.test.ts' 'src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.test.ts'`

Expected: FAIL.

**Step 3: Implement reusable admin components**

Extract shared settings fields from the creation and detail forms. Use the existing detail client shell and state controls for both types. Movie surveys retain the existing movie picker; open surveys render `OpenSurveyOptionForm` and compact `SurveyChoiceCard` items with title, description, fixed image, safe external link, creator label, and removal controls.

Update live-state eligibility so movie surveys still require a movie, while open surveys may go live with zero/one admin option only when responder additions are enabled.

**Step 4: Run UI tests**

Run: `node --test --import=tsx 'src/app/(admin)/admin/surveys/new/page.test.ts' 'src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.test.ts'`

Expected: PASS.

### Task 6: Generalize the voting UI and conditional access route

**Files:**
- Move/modify: `src/app/(app)/survey/[id]/*` to a route group that does not unconditionally redirect guests
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/(app)/survey/[id]/page.tsx`
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.tsx`
- Modify: `src/app/(app)/survey/[id]/simple/page.tsx`
- Modify: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx`
- Modify: `src/components/SortableBallotList.tsx`
- Modify: `src/components/SortableBallotSlot.tsx`
- Modify: `src/hooks/useBallot.ts`
- Create: `src/components/surveys/ResponderOptionForm.tsx`
- Create: `src/components/surveys/ResponderIdentityFields.tsx`
- Modify: relevant survey, simple survey, ballot hook, and layout tests

**Step 1: Write failing route/component tests**

Cover public access, member-only login return URLs, viewer restrictions, named guest input, anonymous identity messaging, responder option form visibility, neutral option rendering, fixed image sizing, links that do not trigger selection, and one-choice labels/slots.

**Step 2: Run the focused tests and verify failure**

Run the survey component, simple survey, hook, and voting layout tests with `node --test --import=tsx`.

Expected: FAIL.

**Step 3: Implement the shared voting model**

Rename hook/component internals from movie IDs to option IDs and accept a neutral render model. The standard survey client renders both survey types. Keep the simple movie view available only for movie surveys unless it can consume the neutral model without movie-specific regressions.

Load the survey before enforcing authentication. For public surveys render the survey-only shell without the authenticated app navigation; for signed-in visitors the page can show the existing navigation without changing the canonical URL. Members-only access redirects guests to `/login?next=/survey/<id>` and validates profile status/role server-side.

**Step 4: Run focused tests**

Expected: PASS.

### Task 7: Add sharing and robust automatic finalization

**Files:**
- Create: `src/components/ShareButton.tsx`
- Create: `src/components/ShareButton.test.ts`
- Create: `src/app/api/surveys/finalize/route.ts`
- Create or modify: `vercel.json`
- Modify: survey voting and admin detail clients
- Create: `src/app/api/surveys/finalize/route.test.ts`

**Step 1: Write failing tests**

Assert native `navigator.share` is preferred, clipboard is the fallback, canonical URLs are used, and the protected finalize endpoint checks `CRON_SECRET` before invoking `finalizeExpiredSurveys`. Assert the schedule exists and is valid for the deployment environment.

**Step 2: Run and verify failure**

Run: `node --test --import=tsx src/components/ShareButton.test.ts src/app/api/surveys/finalize/route.test.ts`

Expected: FAIL.

**Step 3: Implement**

Create one reusable Share button and add it to both requested surfaces. Add the protected scheduled endpoint and a conservative schedule, while retaining read/write reconciliation as the correctness mechanism. Revalidation after finalization must refresh admin survey lists, dashboard, history, and affected survey pages.

**Step 4: Run tests**

Expected: PASS.

### Task 8: Preserve movie-only consumers and verify the complete feature

**Files:**
- Modify as required: `src/app/(app)/dashboard/page.tsx`
- Modify as required: `src/app/(app)/history/page.tsx`
- Modify as required: `src/app/(app)/history/[id]/page.tsx`
- Modify as required: `src/lib/services/leaderboard.ts`
- Modify as required: `src/lib/queries/movies.ts`
- Modify: `README.md`

**Step 1: Add regression tests**

Ensure movie-night dashboard and winner-watched logic filter `survey_type = 'movie'`, while the survey list/history can label and display open surveys without assuming posters or TMDb IDs.

**Step 2: Run all tests**

Run: `find src supabase -name '*.test.ts' -print0 | xargs -0 node --test --import=tsx`

Expected: all tests PASS.

**Step 3: Type-check and build**

Run: `npx tsc --noEmit`

Expected: exit 0.

Run: `npm run build`

Expected: production build succeeds.

**Step 4: Inspect side effects and diff**

Run: `git status --short`, `git diff --check`, and review `git diff` by subsystem. Confirm no uploaded/test artifacts or temporary files were added, pre-existing `src/lib/queries/ballots.ts`, `src/lib/queries/ballots.test.ts`, and `supabase/.temp/` ownership is respected, and the migration is forward-only.

**Step 5: Update documentation**

Document open surveys, access/anonymity behavior, option images, selection methods, public responder cookies, automatic closing, and required `CRON_SECRET` configuration in `README.md`.
