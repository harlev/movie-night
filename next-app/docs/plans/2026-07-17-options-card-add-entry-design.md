# Options Card Add Entry Design

## Goal

Place responder-created options where people browse choices, and make the optional metadata path feel purposeful without adding a separate workflow.

## Approved approach

The responder option disclosure remains the existing `OpenSurveyOptionForm` component and is rendered at the bottom of the open survey's Options card, after the current choice list. Its closed state is a full-width, primary-tinted prompt with a plus icon, a clear "Add your own option" label, and a short invitation to contribute an idea. Hover and keyboard-focus states make it read as an actionable card rather than helper text.

When expanded, the existing inline form stays in place. The optional-fields disclosure becomes a bordered, primary-tinted secondary control that says "Add details" and explains that an image, link, or description can make the option stand out. The form retains its existing submission, cancellation, error, success, and focus-return behavior.

## Boundaries

- No server-action, schema, or database changes.
- Movie survey rendering remains unchanged.
- The responder add flow remains conditional on `canAddOptions`.

## Verification

Source-contract tests will assert that the responder entry lives after the option list in `SurveyVotingClient`, and that the component contains the new invitation and details affordance. Targeted tests, TypeScript checking, and a browser check of the authenticated survey page will verify the result.
