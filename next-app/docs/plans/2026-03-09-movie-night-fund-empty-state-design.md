# Movie Night Fund Empty State Design

**Goal:** Replace the Movie Night Fund empty-state copy with friendlier, community-oriented language while preserving the current card structure and visual hierarchy.

## Approved Copy

- Title: `We’re out of popcorn.`
- Supporting text: `The movie night fund is at $0. A new fund will open soon.`

## Constraints

- Keep the existing `Movie Night Fund` label unchanged.
- Keep the current card layout, spacing, and typography classes unchanged.
- Do not add buttons, links, or other controls.
- Do not reference admin tools or dashboards.

## Testing

- Update the dashboard source-level test to assert the new title and supporting text.
- Remove the old admin/dashboard wording from the test expectations.
- Run the targeted dashboard test file after the copy change.
