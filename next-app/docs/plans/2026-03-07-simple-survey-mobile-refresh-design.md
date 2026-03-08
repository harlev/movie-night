# Simple Survey Mobile Refresh Design

## Goal
Tighten the mobile simple survey voting screen so the voting list and footer controls dominate the screen, while keeping voting behavior predictable when the ballot is already full.

## Assumptions
- The screenshot feedback applies to `src/app/(app)/survey/[id]/simple/SimpleVotingClient.tsx`.
- "Survey name on the header" means the survey title should remain the primary page heading after removing the explicit back link, not that the shared app nav should be rebuilt.
- Points breakdown stays available on the full survey page and history views; it is intentionally removed from the simple mobile flow.

## Approved Behavior
- Remove the back link from the simple survey header.
- Compress the top section by:
  - keeping the survey title as the main heading
  - showing the `live` state pill and compact countdown on the same row
  - omitting the survey description from the simple page
- Remove the `Points per position` accordion from the simple page.
- Remove the `X of N ranked` summary row from above the movie list.
- Move ballot progress and `Clear` action into the sticky footer.
- Change movie-row tap behavior to always assign a rank:
  - tap an unselected movie to fill the first empty rank
  - if the ballot is already full, replace the last rank
  - tapping a selected movie keeps it selected instead of clearing it
- Keep explicit up/down controls for reordering already selected movies.

## Architecture
- Keep the change local to `SimpleVotingClient` and reuse the existing `useBallot.handleMovieClick` behavior instead of changing shared ranking logic.
- Use a denser footer layout with numbered rank markers so users can see capacity without needing the removed summary row.
- Avoid changing shared app layout or navigation to limit cross-screen side effects.

## Testing
- Add a focused source-based test for `SimpleVotingClient` that asserts:
  - the back link and points breakdown copy are removed
  - row taps use `handleMovieClick`
  - the footer exposes numbered rank markers and a `Clear` action
- Re-run the existing countdown source test to make sure the compact timer changes do not regress the shared timer component.
