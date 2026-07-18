# External Survey Finalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Vercel Hobby-incompatible hourly cron with a protected hourly GitHub Actions trigger.

**Architecture:** `vercel.json` no longer declares a cron. A scheduled workflow performs an authenticated `curl` to the existing finalization endpoint, taking its URL and token only from GitHub Actions secrets.

**Tech Stack:** Vercel configuration, GitHub Actions YAML, Node test runner.

---

### Task 1: Specify the external schedule

**Files:**
- Create: `src/deploymentConfig.test.ts`
- Modify: `vercel.json`
- Create: `.github/workflows/finalize-surveys.yml`

**Step 1: Write the failing test**

Assert no `crons` configuration remains in Vercel config and the workflow has an hourly cron, manual dispatch, both secrets, and a Bearer Authorization header.

**Step 2: Run test to verify it fails**

Run: `node --test src/deploymentConfig.test.ts`

Expected: FAIL because the Vercel cron is still present and the workflow is absent.

**Step 3: Implement minimal configuration**

Remove the Vercel cron and create the scheduled workflow with a fail-fast request to the finalization endpoint.

**Step 4: Verify**

Run the source-contract test and `npx next build`.

**Step 5: Commit**

Commit only the deployment configuration, test, and documentation.
