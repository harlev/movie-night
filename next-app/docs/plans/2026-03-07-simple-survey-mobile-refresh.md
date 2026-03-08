# Simple Survey Mobile Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Compress the mobile simple survey screen and align its voting interactions with the screenshot feedback.

**Architecture:** Keep the work local to `SimpleVotingClient`, reuse `useBallot.handleMovieClick` for "always vote" row taps, and move summary affordances into the sticky footer instead of touching the shared app layout.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Node `node:test` source-based checks.

---

### Task 1: Add failing simple-client tests

**Files:**
- Create: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts`

**Step 1: Write the failing test**
- Assert the simple client source:
  - does not render the old back link copy
  - does not render `Points per position`
  - uses `handleMovieClick(entry.movie.id)` for row taps
  - renders numbered footer markers and a `Clear` button in the sticky footer

**Step 2: Run test to verify it fails**
Run: `npx tsx --test "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts"`
Expected: FAIL because the current source still uses the old layout and `toggleMovie`.

**Step 3: Write minimal implementation**
- Update the component structure and interaction wiring in `SimpleVotingClient.tsx`.

**Step 4: Run test to verify it passes**
Run the same command.
Expected: PASS.

### Task 2: Compress the top section and footer

**Files:**
- Modify: `src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx`

**Step 1: Update the header**
- Remove the back link.
- Keep the title as the main heading.
- Put the state pill and compact timer on the same row.
- Reduce vertical spacing and remove the description on the simple page.

**Step 2: Remove extra top-of-list chrome**
- Delete the points accordion.
- Delete the ranked summary row above the movie list.

**Step 3: Rebuild the sticky footer**
- Replace passive dots with numbered rank markers.
- Add a footer `Clear` action.
- Keep submit behavior intact.

**Step 4: Re-run focused test**
Run: `npx tsx --test "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts"`
Expected: PASS.

### Task 3: Verify no shared countdown regression

**Files:**
- Modify: `src/components/CountdownTimer.test.ts` only if needed

**Step 1: Run the countdown test**
Run: `npx tsx --test "src/components/CountdownTimer.test.ts"`
Expected: PASS.

**Step 2: Keep shared timer code untouched unless test evidence requires a fix**
- Prefer styling changes inside `SimpleVotingClient` first.

### Task 4: Final verification

**Files:**
- N/A

**Step 1: Run focused tests together**
Run: `npx tsx --test "src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts" "src/components/CountdownTimer.test.ts"`
Expected: PASS.

**Step 2: Run production build**
Run: `npm run build`
Expected: PASS.
