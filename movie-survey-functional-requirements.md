# Movie Survey Web Application — Functional Requirements

Version: 0.1  
Date: 2026-02-04

## 1. Purpose and scope
The application supports an invite-only community that:
- Suggests movies (resolved against a public movie database).
- Runs a single weekly ranked-choice survey (often aligned to a weekly movie night; some weeks may be skipped).
- Allows transparent, real-time viewing of ballots and results while the survey is live.
- Preserves history of past surveys and results.
- Provides admin tools for moderation, user management, and lightweight analytics.

## 2. Roles
### 2.1 Roles
- **User**: Can sign up via invite link, suggest movies, vote in the live survey, and browse results/history.
- **Admin**: All User capabilities plus: manage invites, users, surveys, moderation, and dashboards.

### 2.2 Role management
- Multiple admins are supported.
- Admins can grant and revoke admin privileges for other users.

## 3. Glossary
- **Suggested Movie**: A movie record created by a user suggestion, anchored to a canonical external movie ID.
- **Survey**: A weekly voting event containing a curated subset of suggested movies.
- **Survey Entry**: A movie included in a specific survey.
- **Ballot**: A user’s ranked selection of up to **N** survey entries (no ties).
- **Live**: Survey state in which voting is enabled and status/ballots are visible.
- **Frozen**: Survey state in which voting and survey modifications are disabled; results are final.

## 4. Data objects (conceptual)
### 4.1 User
- Fields: id, email (unique), display name (optional), role (user/admin), status (active/disabled), created_at, last_login_at

### 4.2 Invite
- Fields: token/code, created_by, created_at, expires_at, invalidated_at (nullable), status (active/invalidated)
- Derived: is_valid (active AND now < expires_at)

### 4.3 Movie
- Fields: id, external_movie_id (canonical), external_source (fixed), fetched_metadata_snapshot, poster_link (derived), suggested_by, suggested_at, hidden (bool), hidden_reason (nullable)

### 4.4 Survey
- Fields: id, title, description, state (draft/live/frozen), created_by, created_at, opened_at, frozen_at
- Voting settings: max_rank_N (integer >= 1), scoring_method (fixed: points-per-rank)

### 4.5 Survey Entry
- Fields: survey_id, movie_id, added_by, added_at, removed_at (nullable), removal_reason (nullable)

### 4.6 Ballot (latest)
- Fields: survey_id, user_id, ranks (rank->movie_id), created_at, updated_at

### 4.7 Ballot change log
- Fields: survey_id, user_id, changed_at, previous_ranks, new_ranks, change_reason (nullable; system-generated for admin-caused edits)

### 4.8 Admin change log
- Records: invite create/invalidate, user disable/enable, role changes, survey edits, survey entry add/remove, survey open/freeze, movie hide/unhide

## 5. Functional requirements

### 5.1 Invitations, signup, and authentication
**FR-ACC-001 — Multi-use invite generation**
- Admin can generate a multi-use invite link/code.
- Admin sets an **expiry date/time** on creation.

**FR-ACC-002 — Invite invalidation**
- Admin can invalidate an invite at any time.
- Invalidated invites cannot be used for new signups.

**FR-ACC-003 — Signup using invite**
- Any person with a valid invite link/code can create an account.
- No email verification is required.
- System enforces unique email per account.

**FR-ACC-004 — Login/logout**
- Users can log in using email + password.
- Users can log out.

**FR-ACC-005 — Password reset**
- Users can request a password reset via email.
- Reset links/tokens expire after a configurable period.

**FR-ACC-006 — Disabled user access**
- Disabled users cannot log in.
- Disabling does not delete or alter historical contributions (suggestions, ballots, comments).

### 5.2 User administration and roles
**FR-ADM-001 — Disable/enable users**
- Admin can disable or enable any user account.

**FR-ADM-002 — Admin role assignment**
- Admin can grant admin privileges to another user.
- Admin can revoke admin privileges from another admin.

### 5.3 Movie suggestion and metadata enrichment
**FR-MOV-001 — Suggestion requires canonical resolution**
- When a user suggests a movie, they must select/resolve it to a real movie in the external database (no free-text-only submissions).
- The system stores the canonical external movie ID for the movie.

**FR-MOV-002 — Metadata fetch on creation**
- On movie creation, the system fetches metadata from the external service and stores a snapshot (e.g., title, release date/year, overview, genres, runtime, poster path).
- Metadata fields fetched from the external service are read-only to users.

**FR-MOV-003 — Poster links**
- The system renders posters as external links (no requirement to store images locally).

**FR-MOV-004 — Deduplication by canonical ID**
- The system prevents duplicate movie records with the same canonical external movie ID.

**FR-MOV-005 — Admin moderation of suggested movies**
- Admin can hide (or remove from normal browsing/eligibility) any suggested movie for any reason.
- The action is logged with an optional reason.

### 5.4 User comments and free-form notes
**FR-CMT-001 — Free-form comments/notes**
- Users can add free-form text comments and notes on movies.
- User comments/notes are separate from externally fetched metadata.

### 5.5 Survey creation, lifecycle, and constraints
**FR-SUR-001 — One survey per week (flexible)**
- Admin can create surveys as needed (typically weekly; some weeks may be skipped).

**FR-SUR-002 — Single live survey constraint**
- The system enforces that at most one survey may be in the **Live** state at any time.

**FR-SUR-003 — Survey states**
- Surveys support states: **Draft**, **Live**, **Frozen**.

**FR-SUR-004 — Manual transitions**
- Admin manually transitions surveys:
  - Draft → Live (open voting)
  - Live → Frozen (close voting and finalize)
- No automated/scheduled open/close is required.

**FR-SUR-005 — Survey configuration in Draft**
- In Draft, admin can edit survey title/description, configure voting settings, and add/remove survey entries.

**FR-SUR-006 — Voting settings lock**
- Voting settings (max_rank_N, scoring method) are editable in Draft.
- Once Live, voting settings are read-only.

### 5.6 Survey entries (movies included in a survey)
**FR-ENT-001 — Add survey entries**
- Admin can add suggested movies as entries to a survey (Draft or Live).

**FR-ENT-002 — Remove survey entries**
- Admin can remove a movie from a survey in Draft or Live.
- Live removal requires an explicit warning/confirmation.

### 5.7 Voting and ballots
**FR-VOT-001 — Rank up to N**
- Each survey defines **max_rank_N** (N >= 1).
- A ballot is an ordered ranking of up to N distinct survey entries; no ties.

**FR-VOT-002 — Submit and update ballot while Live**
- Users can submit a ballot while the survey is Live.
- Users can update their ballot while Live; only the latest ballot counts.

**FR-VOT-003 — Ballot change logging**
- Each ballot submit/update creates a log entry capturing the previous and new ranking.

**FR-VOT-004 — Scoring method**
- The survey uses points-per-rank scoring (see Section 6).

### 5.8 Live visibility and transparency
**FR-VIS-001 — Live status visibility**
- While Live, users can view current standings, including:
  - points per movie
  - ballots showing which user voted for what (ranked selections)

**FR-VIS-002 — Post-freeze visibility**
- After Frozen, users can view final standings and full ballot breakdown.

### 5.9 Live survey edits and their effects
**FR-LIVE-001 — Edit survey details while Live**
- Admin can edit survey title/description while Live.

**FR-LIVE-002 — Add movies while Live**
- Admin can add new survey entries while Live.
- Existing ballots remain unchanged; newly added movies receive votes only if users update their ballots.

**FR-LIVE-003 — Remove movies while Live**
- Admin can remove a survey entry while Live (after warning).
- Removed movies are excluded from standings and cannot be selected going forward.

**FR-LIVE-004 — Ballot impact when a movie is removed**
- If a removed movie appears on a user’s latest ballot:
  - The removed movie is dropped from that ballot.
  - Remaining ranked movies keep their original rank positions (no re-ranking/automatic promotion).
  - The ballot may temporarily contain “gaps” (e.g., rank 1 empty if the former rank 1 movie was removed).
- The UI must notify affected users that their ballot is missing ranks and can be updated.

**FR-LIVE-005 — Logging admin-caused ballot impacts**
- When a movie removal causes ballots to change (dropped entry), the system records this as a system-generated change in the ballot change log.

### 5.10 Freeze/finalize
**FR-FIN-001 — Freeze survey**
- Admin can freeze a Live survey.
- On freeze:
  - voting is disabled
  - survey edits are disabled (read-only)
  - results are considered final

### 5.11 History and browsing
**FR-HIS-001 — Survey history list**
- Users can browse a list of past (Frozen) surveys.

**FR-HIS-002 — Survey detail view**
- Users can view a past survey’s final standings and full ballot breakdown.

**FR-HIS-003 — Global suggested movie list**
- Users can browse all suggested movies with:
  - external metadata snapshot
  - which surveys included the movie
  - the movie’s score/standing per survey (where applicable)
  - identification of movies never included in any survey

**FR-HIS-004 — Movie detail view**
- Each movie has a detail view including:
  - external metadata snapshot and poster link
  - user comments/notes
  - survey participation history and scores

### 5.12 Dashboards and statistics
**FR-DASH-001 — Activity dashboard**
- The application provides a dashboard showing:
  - most active users by movie suggestions
  - most active users by voting activity (submissions/updates)
  - participation per survey (e.g., number of voters)

**FR-DASH-002 — No export requirement**
- No CSV/export functionality is required.

### 5.13 Audit and change logs
**FR-AUD-001 — Admin activity log**
- System logs all admin actions:
  - invite creation/invalidation
  - user disable/enable
  - role changes
  - survey creation/open/freeze
  - survey edits and entry add/remove
  - movie hide/unhide

**FR-AUD-002 — Ballot change log**
- System logs each user ballot change while Live (including system-generated changes triggered by entry removals).

## 6. Scoring specification (points-per-rank)
### 6.1 Parameters
- Let **N** = `max_rank_N` for the survey.
- A ballot assigns ranks 1..k where 1 <= k <= N (subject to movie removal behavior which can create gaps temporarily).

### 6.2 Point assignment
- If a user ranks a movie at rank **r** (1 <= r <= N), that movie receives **(N - r + 1)** points from that ballot.
- Movies not ranked on that ballot receive 0 points from that ballot.
- Example: N=3 → rank1=3 points, rank2=2 points, rank3=1 point.

### 6.3 Handling “gaps” after entry removal
- If a ballot contains a gap (e.g., missing rank 1), points are computed by rank position that remains:
  - e.g., with N=3, a remaining rank2 selection receives 2 points.
- Users may update their ballot to fill gaps; only the latest ballot counts.

### 6.4 Survey standings
- A movie’s total score in a survey is the sum of points across the latest ballots of all users.

### 6.5 Tie-breaking (deterministic)
If two or more movies have equal total points, apply tie-breakers in this order:
1. More rank-1 selections
2. More rank-2 selections
3. More rank-3 selections (and so on up to N)
4. Deterministic fallback: ascending by movie title, then by canonical external movie ID

## 7. External integration (movie database)
- The external movie database provider is TMDb.
- The application must store and use the canonical TMDb movie ID for identity and deduplication.
- The application should cache metadata responses and handle transient failures/rate limiting gracefully.
- The application should display any required attribution/credits per provider terms.

## 8. Out of scope (for this version)
- Public access without invite
- Email verification
- Scheduled/automated survey opening or freezing
- Data export (CSV, etc.)
- Image storage/hosting (beyond external links)
- Alternative voting methods beyond points-per-rank
