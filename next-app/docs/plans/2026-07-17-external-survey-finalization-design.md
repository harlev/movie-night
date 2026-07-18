# External Survey Finalization Design

## Goal

Deploy the merged open-survey feature on Vercel Hobby while retaining hourly survey finalization.

## Approved approach

Remove the Hobby-incompatible Vercel cron configuration. Add a GitHub Actions workflow scheduled hourly and manually dispatchable; it calls the existing `/api/surveys/finalize` endpoint with its Bearer token. The workflow reads `PRODUCTION_URL` and `CRON_SECRET` from repository secrets, so neither the production URL nor secret is committed.

The endpoint continues to require `CRON_SECRET` in Vercel. The repository owner must set the same randomly generated secret in Vercel Production and GitHub Actions, then set `PRODUCTION_URL` to the existing production site URL in GitHub Actions.

## Verification

A source-contract test will assert that no Vercel cron remains and that the workflow uses an hourly schedule, protected Authorization header, and required secrets. The Next.js production build confirms the Vercel configuration no longer rejects deployment.
