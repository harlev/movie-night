# Simple Survey Responsive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the desktop shell for `/survey/[id]/simple` while making the simple WhatsApp-style movie list the only ranking surface on desktop.

**Architecture:** Keep the simple route centered on `SimpleVotingClient`, render separate desktop and mobile sections with Tailwind breakpoints, remove the desktop ballot card entirely, and let the movie rows carry the visible rank state while reusing the countdown, standings, and all-ballots patterns.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Node `node:test` source-based checks.

---

### Task 1: Add failing tests for the responsive simple route

**Files:**
- Modify: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts`

**Step 1: Write the failing test**
- Assert the source:
  - includes desktop shell copy such as `Back to Dashboard`, `Current Standings`, and `All Ballots`
  - does not include `Your Ballot` or `SortableBallotList`
  - uses `variant="full"` for the desktop countdown path
  - keeps `onClick={() => handleMovieClick(entry.movie.id)}` for the movie rows
  - does not contain `Grid view`, `List view`, or `setViewMode(`
  - uses denser desktop row classes

**Step 2: Run test to verify it fails**
Run: `npx tsx "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts"`
Expected: FAIL because the current component only renders the compact layout.

**Step 3: Write minimal implementation**
- Split the simple client into desktop and mobile layouts.

**Step 4: Run test to verify it passes**
Run the same command.
Expected: PASS.

### Task 2: Restore the desktop simple shell without a separate ballot card

**Files:**
- Modify: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx`
- Modify: `src/app/(app)/survey/[id]/simple/page.tsx`
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.tsx`

**Step 1: Remove desktop ballot chrome**
- Drop the desktop ballot card and points breakdown from the simple route.
- Place the submit action directly under the movies list.

**Step 2: Keep the desktop shell**
- Render desktop-only header, countdown banner, standings card, and all ballots card.

**Step 3: Keep the movies area permanently simple and denser**
- Remove the list/grid toggle from the simple route.
- Render only the simple list rows in the movies section.
- Tighten row padding, poster size, text size, and rank badge size on desktop.

**Step 4: Preserve the compact mobile path**
- Keep the current compact header/footer behavior for `<md`.

**Step 5: Re-run focused test**
Run: `npx tsx "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts"`
Expected: PASS.

### Task 3: Verify simple voting behavior still matches the ballot hook

**Files:**
- Modify tests only if needed

**Step 1: Run ballot hook regression**
Run: `npx tsx --test src/hooks/useBallot.test.ts`
Expected: PASS.

**Step 2: Run survey route source check**
Run: `npx tsx "src/app/(app)/survey/[id]/SurveyVotingClient.test.ts"`
Expected: PASS.

### Task 4: Final verification

**Files:**
- N/A

**Step 1: Run focused tests together**
Run: `npx tsx "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts" && npx tsx --test src/hooks/useBallot.test.ts && npx tsx "src/app/(app)/survey/[id]/SurveyVotingClient.test.ts"`
Expected: PASS.

**Step 2: Run production build**
Run: `npm run build`
Expected: PASS.
