# Compact Responder Option Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the prominent responder-option card with a compact “+ Add an option” row that expands inline and progressively reveals optional fields.

**Architecture:** Keep `OpenSurveyOptionForm` and both existing server actions. In responder mode, wrap the shared form in native `details`/`summary` disclosure, use a nested disclosure for optional fields, and close/reset the form after success. Admin mode continues rendering the existing full form. Remove only the redundant responder heading/card from `SurveyVotingClient`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node test runner

---

### Task 1: Specify the compact responder interaction

**Files:**
- Modify: `src/components/surveys/OpenSurveyOptionForm.test.ts`
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.test.ts`

**Step 1: Write the failing tests**

Add source-contract assertions requiring:

```ts
assert.equal(source.includes('<details'), true);
assert.equal(source.includes('<summary'), true);
assert.equal(source.includes('Add an option'), true);
assert.equal(source.includes('Add details'), true);
assert.equal(source.includes("type=\"button\""), true);
assert.equal(source.includes('formRef.current?.reset()'), true);
```

Update the survey client test to require the shared form while rejecting the old assertive wrapper copy:

```ts
assert.equal(source.includes('<OpenSurveyOptionForm'), true);
assert.equal(source.includes('Add your own option'), false);
assert.equal(source.includes('Your option becomes available to everyone immediately.'), false);
```

**Step 2: Run the tests to verify they fail**

Run:

```bash
npx --yes tsx --test src/components/surveys/OpenSurveyOptionForm.test.ts
npx --yes tsx 'src/app/(app)/survey/[id]/SurveyVotingClient.test.ts'
```

Expected: FAIL because the component has no disclosure markup and the survey client still renders the old heading and explanatory card.

**Step 3: Commit the failing tests**

```bash
git add src/components/surveys/OpenSurveyOptionForm.test.ts 'src/app/(app)/survey/[id]/SurveyVotingClient.test.ts'
git commit -m "test: specify compact responder option entry"
```

### Task 2: Implement the reusable inline disclosure

**Files:**
- Modify: `src/components/surveys/OpenSurveyOptionForm.tsx`
- Modify: `src/app/(app)/survey/[id]/SurveyVotingClient.tsx`

**Step 1: Add disclosure refs and success behavior**

In `OpenSurveyOptionForm`, add form and responder-disclosure refs. On successful responder submission, reset the form and close the outer disclosure:

```tsx
const formRef = useRef<HTMLFormElement>(null);
const responderDetailsRef = useRef<HTMLDetailsElement>(null);

useEffect(() => {
  if (!responder || !state?.success) return;
  formRef.current?.reset();
  if (responderDetailsRef.current) responderDetailsRef.current.open = false;
}, [responder, state?.success]);
```

**Step 2: Reuse one form for admin and responder modes**

Keep one form body. In responder mode:

- Show the required title field immediately after expansion.
- Put description, link, and image inside a nested native disclosure labeled `Add details`.
- Render compact `Add` and `Cancel` actions.
- Make Cancel reset the form and close the outer disclosure.

In admin mode, keep description, link, and image visible and retain the existing `Add option` button.

**Step 3: Add the compact collapsed row**

Wrap only responder mode in:

```tsx
<details ref={responderDetailsRef} className="group">
  <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]">
    <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] text-base leading-none">+</span>
    <span>Add an option</span>
  </summary>
  {form}
</details>
```

Use focus-visible styling on the summary and hide the default WebKit marker.

**Step 4: Remove the assertive page wrapper**

Replace the responder section in `SurveyVotingClient` with:

```tsx
{canAddOptions && <OpenSurveyOptionForm surveyId={survey.id} responder />}
```

**Step 5: Run focused tests to verify they pass**

Run:

```bash
npx --yes tsx --test src/components/surveys/OpenSurveyOptionForm.test.ts
npx --yes tsx 'src/app/(app)/survey/[id]/SurveyVotingClient.test.ts'
```

Expected: PASS.

**Step 6: Commit the implementation**

```bash
git add src/components/surveys/OpenSurveyOptionForm.tsx 'src/app/(app)/survey/[id]/SurveyVotingClient.tsx'
git commit -m "feat: compact responder option entry"
```

### Task 3: Verify the completed interaction

**Files:**
- Verify: `src/components/surveys/OpenSurveyOptionForm.tsx`
- Verify: `src/app/(app)/survey/[id]/SurveyVotingClient.tsx`

**Step 1: Run the full test suite**

```bash
find src supabase -name '*.test.ts' -print0 | xargs -0 npx --yes tsx --test
```

Expected: all tests pass.

**Step 2: Run route-specific tests**

```bash
npx --yes tsx 'src/app/(app)/survey/[id]/SurveyVotingClient.test.ts'
npx --yes tsx 'src/app/(app)/survey/[id]/simple/SimpleVotingClient.test.ts'
npx --yes tsx 'src/app/(app)/survey/[id]/simple/simpleViewState.test.ts'
npx --yes tsx 'src/app/(admin)/admin/surveys/[id]/SurveyDetailClient.test.ts'
```

Expected: all tests pass.

**Step 3: Run static and production checks**

```bash
npx tsc --noEmit
npm run build
```

Expected: TypeScript and the production build pass.

**Step 4: Review React quality**

Confirm the component uses native interactive semantics, keeps hooks unconditional, resets only after success/cancel, supplies visible focus styles, and does not duplicate the form or server action.

**Step 5: Smoke-check locally**

Open a live open survey that permits responder options. Confirm the collapsed row is subtle, expands inline, reveals optional fields only on request, Cancel collapses it, and successful submission returns it to the collapsed state.

**Step 6: Commit any verification-only fixes**

If verification required changes:

```bash
git add <changed-files>
git commit -m "fix: polish compact responder option entry"
```
