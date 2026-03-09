# Movie Night Fund Empty State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the Movie Night Fund empty-state copy to the approved friendlier message without changing layout or controls.

**Architecture:** This is a localized copy-only change in the dashboard widget. The implementation stays in the existing conditional branch for the no-open-budget state, and the regression coverage remains in the existing source-level dashboard test.

**Tech Stack:** Next.js app router, React, Node test runner, source-level assertion tests

---

### Task 1: Update the dashboard test first

**Files:**
- Modify: `/Users/yhadad/projects/movie-night/next-app/src/app/(app)/dashboard/page.test.ts`
- Test: `/Users/yhadad/projects/movie-night/next-app/src/app/(app)/dashboard/page.test.ts`

**Step 1: Write the failing test**

- Replace the old empty-state expectations with assertions for:
  - `We’re out of popcorn.`
  - `The movie night fund is at $0. A new fund will open soon.`
- Add negative assertions for:
  - `No active budget yet.`
  - `The admin can open a budget from the budgets dashboard.`

**Step 2: Run test to verify it fails**

Run: `node --test "src/app/(app)/dashboard/page.test.ts"`

Expected: FAIL because the page still contains the old empty-state copy.

### Task 2: Apply the minimal dashboard copy change

**Files:**
- Modify: `/Users/yhadad/projects/movie-night/next-app/src/app/(app)/dashboard/page.tsx`

**Step 1: Write minimal implementation**

- In the `openBudget && budgetProgress ? ... : ...` empty-state branch:
  - Replace the title string with `We’re out of popcorn.`
  - Replace the supporting text with `The movie night fund is at $0. A new fund will open soon.`
- Do not touch classes, structure, spacing, or controls.

### Task 3: Verify the targeted regression

**Files:**
- Test: `/Users/yhadad/projects/movie-night/next-app/src/app/(app)/dashboard/page.test.ts`

**Step 1: Run test to verify it passes**

Run: `node --test "src/app/(app)/dashboard/page.test.ts"`

Expected: PASS
