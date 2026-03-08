# Simple Survey Responsive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the desktop shell for `/survey/[id]/simple` while keeping the movies section permanently in the simple WhatsApp-style list layout.

**Architecture:** Keep the simple route centered on `SimpleVotingClient`, render separate desktop and mobile sections with Tailwind breakpoints, and reuse the existing ballot, standings, and countdown patterns already proven in `SurveyVotingClient`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Node `node:test` source-based checks.

---

### Task 1: Add failing tests for the responsive simple route

**Files:**
- Modify: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts`

**Step 1: Write the failing test**
- Assert the source:
  - includes desktop shell copy such as `Back to Dashboard`, `Your Ballot`, `Current Standings`, and `All Ballots`
  - uses `variant="full"` for the desktop countdown path
  - keeps `onClick={() => handleMovieClick(entry.movie.id)}` for the movie rows
  - does not contain `Grid view`, `List view`, or `setViewMode(`

**Step 2: Run test to verify it fails**
Run: `npx tsx "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts"`
Expected: FAIL because the current component only renders the compact layout.

**Step 3: Write minimal implementation**
- Split the simple client into desktop and mobile layouts.

**Step 4: Run test to verify it passes**
Run the same command.
Expected: PASS.

### Task 2: Restore the desktop simple shell

**Files:**
- Modify: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx`
- Modify: `src/app/(app)/survey/[id]/simple/page.tsx`
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.tsx`

**Step 1: Reintroduce desktop-only ballot data**
- Pass `pointsBreakdown` into `SimpleVotingClient`.
- Pull the ballot DnD state from `useBallot` inside the simple client.

**Step 2: Add the desktop shell**
- Render desktop-only header, countdown banner, ballot card, standings card, and all ballots card.
- Reuse `SortableBallotList` for the desktop ballot.

**Step 3: Keep the movies area permanently simple**
- Remove the list/grid toggle from the simple route.
- Render only the simple list rows in the movies section.

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
