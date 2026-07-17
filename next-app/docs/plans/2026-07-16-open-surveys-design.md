# Open Surveys Design

## Goal

Allow administrators to create either movie surveys or general-purpose open surveys while reusing the existing survey creation, voting, scoring, results, lifecycle, and sharing experience.

## Product behavior

An administrator starts from Surveys and chooses `Movie survey` or `Open survey`. Both types share the title, description, selection method, closing time, state, archive, and sharing controls. New surveys support selection methods of one choice, ranked top three, or ranked top five. Historical surveys with other ranking sizes remain readable.

An open-survey option requires a title and may include a description, link, and uploaded PNG, JPEG, or WebP image. Option images are rendered in a fixed compact frame while preserving their aspect ratio. Administrators can add options in draft or live surveys. Responders can add options only while a survey is live and only when the administrator enables that behavior.

The survey cannot disable responder-added options until it has at least two active administrator-authored options. A draft with fewer than two administrator options may still go live when responder-added options are enabled. This enforces the rule at the server boundary rather than relying only on disabled form controls.

Surveys are non-anonymous and members-only by default. A members-only survey requires an active signed-in member or administrator to vote; viewers may view but cannot vote, matching existing survey behavior. A public survey accepts signed-in members or guests. A public, non-anonymous guest must provide a display name. A fully anonymous survey stores a stable browser voter token but never a profile ID or responder name, including for signed-in responders and admin reporting.

The voting page includes a reusable Share button that uses the native share sheet where available and otherwise copies the canonical survey URL. The same control appears on the admin detail page.

## Architecture

The existing survey domain becomes choice-agnostic instead of adding a parallel open-survey implementation. `surveys` gains type, access, anonymity, and responder-option settings. Existing rows are backfilled as movie surveys with their current defaults.

`survey_entries` remains the canonical list of selectable entries. A movie entry references `movies`; an open entry stores its own title, description, image path, and link. It also records whether it was created by an administrator or responder and records the creator using either a profile ID or anonymous voter token as permitted by the survey. Database constraints ensure each entry has exactly the data required by its survey type.

`ballot_ranks` changes from referencing a movie directly to referencing a survey entry. The migration backfills every existing rank by matching its survey and movie to the corresponding existing survey entry before enforcing the new foreign key. Application-facing ranking types use neutral option identifiers, with temporary compatibility adapters only where necessary to keep migration risk controlled.

`ballots` supports either an authenticated profile owner or a guest/anonymous voter token. Partial unique indexes enforce one ballot per survey and authenticated user or browser voter. Anonymous submissions deliberately omit the profile foreign key and name. The existing cookie-based Quick Poll identity pattern is extracted and reused for public or anonymous surveys.

Shared survey view models adapt movie-backed and open entries into the same choice shape used by the ballot hook, sortable rank list, scoring service, standings, and results UI. Movie-specific presentation remains an optional renderer rather than a separate ballot flow.

## Data flow

Creation first stores the survey metadata and redirects to the existing survey detail page. The detail page renders a movie picker for movie surveys or an option editor for open surveys. Every mutation reloads the survey and checks its type, state, access rules, option limits, input lengths, link protocol, image type/size, and ownership on the server.

The survey route is made conditionally public. It loads the survey before deciding whether authentication is mandatory. Members-only surveys redirect unauthenticated users to login with a safe return URL. Public surveys issue or reuse an HTTP-only survey voter cookie. Voting resolves an owner as authenticated, named guest, or anonymous token according to survey settings and submits through one atomic database function.

Responder-added options are inserted before ballot submission and immediately become available to every voter. Duplicate active option titles are rejected case-insensitively within a survey to avoid accidental duplicates.

## Closing and winner selection

Every survey read and write derives whether the closing timestamp has passed. Vote and option mutations reject requests at or after that instant even if the persisted state has not yet changed. A protected scheduled finalization route freezes expired live surveys, and read paths reconcile any overdue survey as a fallback. This makes the closing boundary authoritative and avoids accepting late votes when scheduling is delayed.

Frozen results use the existing points model: one choice gives one point; ranked three gives 3/2/1; ranked five gives 5/4/3/2/1. Standings determine the winner. If the top scoring vectors are equal, the UI reports co-winners rather than inventing a random winner.

## Migration and compatibility

A forward-only Supabase migration adds columns, indexes, constraints, the option-image storage bucket and policies, backfills survey entries into ballot ranks, and replaces ballot RPCs with generic entry-based versions. `supabase/schema.sql` is updated to match the migrated schema so fresh environments and migration-based environments agree.

Existing movie-survey URLs, ballots, history, leaderboard behavior, and admin controls remain functional. Movie-night winner-specific logic continues to consider only movie surveys.

## Errors and security

Server actions are the authority for admin role checks, survey state, access mode, anonymity, option permissions, option membership, rank uniqueness, allowed selection methods, image validation, URL validation, and closing time. Public reads and mutations use narrowly scoped server-side queries; service-role access is not exposed to the browser.

Uploaded images are limited to safe image MIME types and a small maximum byte size, stored under generated object paths, and deleted when an unused draft option is permanently removed. Failed database writes clean up newly uploaded objects so no garbage is left behind.

## Testing

Tests cover creation defaults and allowed selection methods; the two-admin-option rule; option field, image, and link validation; authenticated, named-guest, and anonymous ballot ownership; member-only authorization; responder option permissions; entry-based rank validation; 1/3/5 scoring; close-boundary rejection and finalization; schema/migration consistency; and shared rendering contracts for movie and open choices.

Focused tests run after each implementation slice. The final verification runs all Node tests, TypeScript checking, a production build, and a review of the migration and git diff while preserving pre-existing workspace changes.
