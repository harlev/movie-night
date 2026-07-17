# Open Option Details Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reveal all responder option fields when the add-option card opens and separate that card from the last option.

**Architecture:** Keep `OpenSurveyOptionForm` as the sole shared form. Remove only its responder-only nested disclosure and give its existing call site a top margin.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner.

---

### Task 1: Specify the open form and spacing

**Files:**
- Modify: `src/components/surveys/OpenSurveyOptionForm.test.ts`
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.test.ts`

**Step 1: Write the failing test**

Assert that responder optional fields are direct form content, the nested details ref is gone, and the caller wraps the form with the intended top margin.

**Step 2: Run test to verify it fails**

Run the targeted Node tests. Expected: FAIL because the nested details markup and unspaced call site still exist.

**Step 3: Implement the minimal change**

Render `optionalFields` directly for responders and add `mt-4` around the existing responder form call site.

**Step 4: Run tests and build**

Run targeted tests, TypeScript checking, and `npx next build`. Expected: PASS.

**Step 5: Commit**

Commit the two source files and tests with the focused UI-change message.
