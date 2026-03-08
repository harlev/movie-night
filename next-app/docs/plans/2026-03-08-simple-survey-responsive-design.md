# Simple Survey Responsive Design

## Goal
Make `/survey/[id]/simple` the candidate future default survey flow by keeping the full desktop survey scaffold on larger screens while making the movie list the only ranking surface.

## Approved Behavior
- On desktop `md+`, `/survey/[id]/simple` keeps the existing large-screen structure:
  - back link
  - title, live tag, and description
  - full countdown banner
  - standings and all ballots cards on the right
- The separate `Your Ballot` card is removed from desktop `/simple`.
- The movie chooser on `/simple` is always a single simple list with no grid mode and no layout toggle.
- Movie rows use the poll-like treatment:
  - poster on the left
  - title and year stacked
  - rank badge when selected
  - hollow selection circle when unselected
  - row tap uses the simple ballot behavior
  - selected rows expose the same up/down reorder arrows used on mobile
  - denser height and tighter spacing than the current desktop rows
- The desktop submit button sits directly under the movie list instead of under a separate ballot card.
- On mobile `<md`, keep the compact simple layout already used by the responsive survey flow.

## Architecture
- Keep `SimpleVotingClient` as the single source of truth for the simple experience, but split it into desktop and mobile sections inside the component.
- Remove the desktop-only ballot DnD surface and let the list rows own the visible rank state.
- Reuse the existing standings, all ballots, and countdown patterns instead of inventing a separate desktop layout.

## Testing
- Update the source-based `SimpleVotingClient` test to assert:
  - desktop shell copy and structure are present without `Your Ballot`
  - the simple route no longer exposes grid/list toggle state
  - movie rows still use `handleMovieClick`
  - desktop selected rows enable the reusable move-control affordance
  - desktop row sizing is denser than the previous shell version
  - mobile-only compact affordances remain in the component
- Re-run the ballot hook and survey client tests to make sure the simple list behavior still matches the compact voting flow.
