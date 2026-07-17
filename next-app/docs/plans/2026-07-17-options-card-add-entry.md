# Options Card Add Entry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Put the responder option entry at the end of an open survey's Options card and make its primary and optional-detail controls inviting.

**Architecture:** Reuse `OpenSurveyOptionForm`; only move its existing call site into the Options section. Update responder-only Tailwind classes in that component so its native disclosures retain their existing submission and accessibility behavior.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Node test runner.

---

### Task 1: Specify placement and affordances

**Files:**
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.test.ts`
- Modify: `src/components/surveys/OpenSurveyOptionForm.test.ts`

**Step 1: Write the failing test**

Assert that the responder form call occurs after the open-options list and that the form source exposes the invitation and vivid optional-details affordance.

**Step 2: Run test to verify it fails**

Run: `node --test src/app/'(app)'/survey/'[id]'/SurveyVotingClient.test.ts src/components/surveys/OpenSurveyOptionForm.test.ts`

Expected: FAIL because the form is still above the two-column layout and uses the old labels/classes.

**Step 3: Write minimal implementation**

Move the conditional form call into the Options section after the list/grid branch. Update only responder-specific markup/classes in `OpenSurveyOptionForm`.

**Step 4: Run test to verify it passes**

Run: `node --test src/app/'(app)'/survey/'[id]'/SurveyVotingClient.test.ts src/components/surveys/OpenSurveyOptionForm.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/'(app)'/survey/'[id]'/SurveyVotingClient.tsx \
  src/app/'(app)'/survey/'[id]'/SurveyVotingClient.test.ts \
  src/components/surveys/OpenSurveyOptionForm.tsx \
  src/components/surveys/OpenSurveyOptionForm.test.ts
git commit -m "feat: place option entry in options card"
```

### Task 2: Verify the integrated page

**Files:**
- Verify: `src/app/(app)/survey/[id]/SurveyVotingClient.tsx`

**Step 1: Run focused tests and TypeScript check**

Run the targeted Node tests and `npx tsc --noEmit`.

**Step 2: Check the authenticated survey page**

Open the existing open survey, confirm the add card appears below the option rows, open it, and confirm the details control expands.
