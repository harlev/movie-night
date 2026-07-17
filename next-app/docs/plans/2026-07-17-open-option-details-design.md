# Open Option Details Design

## Goal

Let a responder fill out every option field immediately after choosing to add an option, while keeping the add card visually separate from the current option list.

## Approved approach

The responder add form will render the existing optional fields directly after the required title field. The nested `Add details` disclosure will be removed, so a single click on the add card reveals the complete form. The existing form submission, cancel, reset, and focus behavior remains unchanged.

The parent page will add top margin to the responder form call site. This creates separation after either an option list, grid, or empty-state message without duplicating layout markup inside the shared form component.

## Verification

Source-contract tests will verify that the nested details control no longer exists, optional fields are rendered directly, and the caller supplies the gap. Targeted tests and a production build will validate the change.
