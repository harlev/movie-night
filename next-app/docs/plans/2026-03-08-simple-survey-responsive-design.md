# Simple Survey Responsive Design

## Goal
Make `/survey/[id]/simple` the candidate future default survey flow by keeping the full desktop survey scaffold on larger screens while preserving the compact simple experience on mobile.

## Approved Behavior
- On desktop `md+`, `/survey/[id]/simple` keeps the existing large-screen structure:
  - back link
  - title, live tag, and description
  - full countdown banner
  - ballot card on the left
  - standings and all ballots cards on the right
- The movie chooser on `/simple` is always a single simple list with no grid mode and no layout toggle.
- Movie rows use the poll-like treatment:
  - poster on the left
  - title and year stacked
  - rank badge when selected
  - hollow selection circle when unselected
  - row tap uses the simple ballot behavior
- On mobile `<md`, keep the compact simple layout already used by the responsive survey flow.

## Architecture
- Keep `SimpleVotingClient` as the single source of truth for the simple experience, but split it into desktop and mobile sections inside the component.
- Reintroduce `pointsBreakdown` and the ballot DnD data required for the desktop shell so the direct `/simple` route can render the full ballot card again.
- Reuse the existing standings, all ballots, and countdown patterns instead of inventing a separate desktop layout.

## Testing
- Update the source-based `SimpleVotingClient` test to assert:
  - desktop shell copy and structure are present
  - the simple route no longer exposes grid/list toggle state
  - movie rows still use `handleMovieClick`
  - mobile-only compact affordances remain in the component
- Re-run the ballot hook and survey client tests to make sure the simple list behavior still matches the compact voting flow.
