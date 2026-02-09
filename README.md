# Movie Night (FCMN)

A web application for groups to collaboratively suggest, discuss, and vote on movies using ranked-choice surveys. Built for the FC Movie Night community at [fcmovienight.org](https://fcmovienight.org).

## Overview

Movie Night solves the "what should we watch?" problem. Members suggest movies (powered by TMDB metadata), admins create surveys with a curated shortlist, and everyone submits ranked ballots. The app calculates standings with a points-based scoring system and tiebreakers, producing a clear winner.

### Key Workflow

1. **Members suggest movies** -- search TMDB, pick a title, it's added to the collection with poster, genres, and synopsis
2. **Admin creates a survey** -- selects movies from the collection, sets how many each person can rank
3. **Survey goes live** -- members submit ranked ballots (e.g., pick your top 3)
4. **Admin freezes the survey** -- results are finalized and visible in history

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [SvelteKit](https://svelte.dev) v2 (Svelte 5) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (serverless SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| Movie data | [TMDB API](https://www.themoviedb.org/documentation/api) |
| Auth | Custom JWT + refresh token rotation |

Zero external runtime dependencies -- everything runs on Cloudflare's edge network.

## Features

### For Members
- **Movie suggestions** -- search TMDB, view poster/synopsis/rating, add to collection
- **Movie browsing** -- browse all suggested movies with metadata and comments
- **Survey voting** -- drag-and-drop ranked ballot submission
- **Live standings** -- see current results with points breakdown while survey is open
- **History** -- view past survey results and winners

### For Admins
- **Survey management** -- create surveys, add/remove movies, control lifecycle (draft/live/frozen)
- **User management** -- enable/disable accounts, promote/demote admin role
- **Invite system** -- generate multi-use invite codes with configurable expiration (1-30 days)
- **Audit logs** -- all admin actions logged with actor, target, and details

## Architecture

### Authentication

The auth system uses short-lived JWTs with long-lived refresh tokens for 30-day sessions:

- **Access token**: JWT (HS256), 1-hour lifetime, stored in httpOnly cookie
- **Refresh token**: 256-bit random hex, 30-day lifetime, SHA-256 hashed in DB
- **Silent refresh**: the server hook automatically rotates tokens when the access token expires -- no client-side logic needed
- **Password hashing**: PBKDF2 with 100,000 iterations, SHA-256, 64-byte hash, 16-byte salt

Token refresh happens transparently in `hooks.server.ts` on every request. If the access token is expired but the refresh token is valid, new tokens are minted and cookies are updated before the page loads. Users stay logged in for up to 30 days without interruption.

### Database Schema

13 tables organized around four domains:

**Users & Auth**: `users`, `sessions`, `invites`, `inviteUses`, `passwordResetTokens`
- Invite-only registration with multi-use codes
- Role-based access (admin/member) and account status (active/disabled)

**Movies**: `movies`, `movieComments`
- TMDB metadata snapshotted at suggestion time (poster, genres, rating, synopsis)
- Comment threads per movie

**Surveys & Voting**: `surveys`, `surveyEntries`, `ballots`, `ballotRanks`, `ballotChangeLogs`
- Survey state machine: draft -> live -> frozen
- One ballot per user per survey with ranked movie selections
- Ballot change audit trail (tracks user updates and admin-triggered removals)

**Admin**: `adminLogs`
- Full audit trail of all privileged actions

### Scoring System

Ranked ballots are scored using a points system:

```
points = maxRankN - rank + 1
```

For a survey where users rank their top 3:
- Rank 1 = 3 points
- Rank 2 = 2 points
- Rank 3 = 1 point

Tiebreakers (in order):
1. Total points (descending)
2. Rank count distribution (more #1 votes wins)
3. Alphabetical by title
4. TMDB ID ascending

### Route Protection

All route authorization is handled in the server hook:

| Route pattern | Access |
|---|---|
| `/login`, `/signup`, `/bootstrap` | Public (redirects to dashboard if logged in) |
| `/dashboard`, `/survey/*`, `/movies/*`, `/history/*` | Authenticated users |
| `/admin/*` | Admin role only |

### Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth/           # JWT, password hashing, token generation
│   │   ├── db/
│   │   │   ├── schema.ts   # All table definitions (Drizzle)
│   │   │   └── queries/    # Domain-organized query functions
│   │   └── services/
│   │       ├── tmdb.ts     # TMDB API search & detail fetching
│   │       └── scoring.ts  # Ballot scoring & standings calculation
│   └── utils/              # ID generation, validation helpers
├── routes/
│   ├── (auth)/             # Login, signup, bootstrap, password reset
│   ├── (app)/              # Dashboard, movies, surveys, history
│   ├── (admin)/            # Admin panel (surveys, users, invites, logs)
│   └── api/                # JSON endpoints for live polling
├── app.html                # HTML shell
├── app.d.ts                # Global type definitions
└── hooks.server.ts         # Auth middleware & silent token refresh
```

## Development

### Prerequisites

- Node.js 18+
- A Cloudflare account (for D1 and Pages)
- A [TMDB API key](https://www.themoviedb.org/settings/api)

### Setup

```sh
npm install
```

### Environment Variables

Configure in the Cloudflare dashboard (or `wrangler.toml` for local dev):

| Variable | Description |
|---|---|
| `DB` | Cloudflare D1 database binding |
| `JWT_SECRET` | Secret key for signing JWTs |
| `TMDB_API_KEY` | TMDB API key for movie search |

### Database

Generate migrations from schema changes:

```sh
npm run db:generate
```

Apply migrations locally:

```sh
npm run db:migrate:local
```

Apply migrations to production:

```sh
npm run db:migrate
```

### Running Locally

```sh
npm run dev
```

Preview with Cloudflare D1 bindings:

```sh
npm run build
npm run preview
```

### Running with Docker

Build the image:

```sh
docker build -t movie-night .
```

Run the container:

```sh
docker run -p 8788:8788 movie-night
```

The app will be available at `http://localhost:8788`. On first run, visit `/bootstrap` to create the initial admin account.

The container uses `wrangler pages dev` with a local D1 database and default dev secrets. To supply your own TMDB API key or JWT secret, mount a `.dev.vars` file:

```sh
docker run -p 8788:8788 -v $(pwd)/.dev.vars:/app/.dev.vars movie-night
```

### Deploying

```sh
npm run build
npm run deploy
```

### First-Time Setup

After deploying and running migrations, visit `/bootstrap` to create the first admin account. This route is only available when no users exist in the database. Subsequent users must be invited via admin-generated invite codes.
