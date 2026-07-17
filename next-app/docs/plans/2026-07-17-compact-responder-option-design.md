# Compact Responder Option Design

## Goal

Replace the prominent responder-option card with a quiet, Facebook-poll-style add row that expands inline only when a responder chooses to add an option.

## Interaction

- The collapsed state is a compact row with a circular plus icon and the label “Add an option.”
- Clicking the row expands a title field in place, with Add and Cancel actions.
- Optional description, image, and link fields remain hidden behind an “Add details” control.
- Cancel returns to the compact row without submitting.
- Validation and submission errors remain visible in the expanded area.
- A successful submission collapses the form back to the compact row.

## Architecture

Keep the existing `OpenSurveyOptionForm` and survey server actions. The form owns only the local disclosure state required for its collapsed, quick-entry, and detailed states. The survey page stops rendering a separate heading and explanatory card around responder mode; admin mode retains the full form presentation used for survey management.

## Data Flow and Error Handling

The existing server action remains the source of validation and persistence. Expanding or revealing details does not write data. Pending submission disables the relevant controls. An error keeps the form open so the responder can correct it. Success resets and collapses the responder form.

## Testing

- Add a failing component contract test for the compact row, inline disclosure, optional-detail disclosure, and accessible button semantics.
- Keep the existing server-action form encoding regression test.
- Run the responder survey client tests, TypeScript checking, and the production build.
- Smoke-check the rendered local survey page.
