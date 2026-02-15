# Movie Night (FCMN)

A ranked-choice voting platform for movie groups. Members suggest movies, discuss them, and vote using ranked-choice surveys. Admins can also create quick public polls for broader audiences. Built with Next.js, Supabase, and deployed on Vercel.

Live at [fcmovienight.org](https://fcmovienight.org)

## Tech Stack

- **Next.js 16** (App Router, React 19, Server Actions)
- **Supabase** (Auth, PostgreSQL, Row Level Security)
- **Tailwind CSS v4** (dark theme, custom design tokens)
- **TypeScript** (strict mode)
- **TMDb API** (movie search, metadata, posters)
- **Vercel** (hosting & deployment)

## Features

### For Members
- **Movie Catalog** — Browse, search, and suggest movies with TMDb integration (posters, trailers, ratings)
- **Comments** — Discuss movies with other members
- **Ranked-Choice Surveys** — Vote on curated movie lists by ranking your top picks
- **Live Results** — See standings update in real-time as votes come in
- **Survey History** — Review past survey results and your voting history

### For Admins
- **Survey Management** — Create surveys, add movies, control state (draft/live/frozen)
- **Quick Polls** — Public shareable polls with QR codes, no login required for voters
- **User Management** — Edit names, change roles, disable/enable accounts
- **Invite System** — Generate invite codes for new member signups
- **Vote Moderation** — Disable/enable individual poll votes (e.g., duplicate votes)
- **Audit Logs** — Full trail of all admin actions

### Quick Polls (Public)
- Shareable link — anyone can vote without an account
- Cookie-based voter identity (logged-in users sync across devices)
- Optional sign-in via Google or magic link (auto-creates profile)
- Real-time standings with auto-refresh

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Public auth pages (login, signup, bootstrap)
│   │   └── auth/callback/  # OAuth & magic link callback handler
│   ├── (app)/           # Authenticated user pages
│   │   ├── dashboard/   # Main dashboard with live survey
│   │   ├── movies/      # Movie catalog, suggest, detail pages
│   │   ├── survey/[id]/ # Survey voting page
│   │   ├── history/     # Past survey results
│   │   └── settings/    # User profile settings
│   ├── (admin)/         # Admin-only pages
│   │   └── admin/
│   │       ├── surveys/ # Survey CRUD & management
│   │       ├── polls/   # Quick poll CRUD & management
│   │       ├── users/   # User management
│   │       ├── invites/ # Invite code management
│   │       └── logs/    # Admin audit logs
│   ├── (poll)/          # Public poll pages (no auth required)
│   │   └── poll/[id]/   # Poll voting page
│   └── api/             # JSON API endpoints
│       ├── poll/[id]/   # Public poll standings
│       └── survey/[id]/ # Authenticated survey standings & ballots
├── lib/
│   ├── supabase/        # 4 Supabase client variants
│   │   ├── client.ts    # Browser client (public keys)
│   │   ├── server.ts    # Server client (cookie-based auth)
│   │   ├── middleware.ts # Middleware client (session refresh)
│   │   └── admin.ts     # Service role client (bypasses RLS)
│   ├── actions/         # Server Actions
│   │   ├── auth.ts      # Login, signup, bootstrap, logout
│   │   ├── movies.ts    # Search, suggest, comment, archive
│   │   ├── surveys.ts   # Survey CRUD, state management
│   │   ├── ballots.ts   # Submit/update ballots
│   │   ├── polls.ts     # Poll CRUD, vote submission
│   │   ├── invites.ts   # Invite code management
│   │   └── users.ts     # Profile updates, admin user management
│   ├── queries/         # Database query functions
│   ├── services/
│   │   ├── tmdb.ts      # TMDb API integration
│   │   └── scoring.ts   # Ranked-choice scoring algorithm
│   ├── types/           # TypeScript interfaces
│   └── utils/           # ID generation, validation
├── components/          # Shared React components
│   ├── ui/              # Generic UI (Button, Card, Skeleton, EmptyState)
│   ├── AppNav.tsx       # Navigation bar
│   └── ...              # Feature-specific client components
└── middleware.ts         # Auth session refresh & route protection
```

## Local Development Setup

There are two ways to set up Supabase for local development:
- **Option A: Local Supabase** (recommended) — runs a full Supabase stack locally via Docker
- **Option B: Cloud Supabase** — uses a hosted Supabase project

### Prerequisites

- Node.js 18+
- npm
- [Docker](https://docs.docker.com/get-docker/) (required for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`npm install -g supabase`)
- A [TMDb API key](https://developer.themoviedb.org/docs/getting-started) (free)

### 1. Clone and install

```bash
git clone <repo-url>
cd next-app
npm install
```

### 2. Set up Supabase

#### Option A: Local Supabase (recommended)

This runs PostgreSQL, Auth, REST API, and Studio locally in Docker containers.

```bash
# Start local Supabase (first run downloads Docker images)
supabase start
```

This will print the local URLs and keys when it finishes:

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
Studio URL: http://127.0.0.1:54323
```

The schema and all migrations are applied automatically via `supabase/seed.sql`.

To reset the database (re-applies seed):

```bash
supabase db reset
```

To stop the local stack:

```bash
supabase stop
```

**Local Supabase Studio** is available at `http://localhost:54323` — use it to browse data, manage users, and run SQL queries.

> **Note:** Local Supabase uses email confirmations disabled by default (`supabase/config.toml`), so magic link emails won't actually be sent. Use the **Inbucket** email testing tool at `http://localhost:54324` to view magic link emails, or use the Studio dashboard to create users directly.

#### Option B: Cloud Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema:
   - `supabase/schema.sql` — creates all tables, RLS policies, functions, and triggers
3. Apply migrations in order:
   - `supabase/migrations/20260214_add_quick_polls.sql` — quick polls tables
   - `supabase/migrations/20260215_poll_vote_disabled.sql` — vote disable feature

#### Configure Supabase Auth

For **cloud Supabase** (local handles this automatically):

1. Go to **Authentication > Providers**:
   - Enable **Email** (magic link / OTP)
   - Enable **Google** OAuth (requires Google Cloud Console credentials)
2. Go to **Authentication > URL Configuration**:
   - Set **Site URL** to `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to **Redirect URLs**
3. Go to **Authentication > Hooks**:
   - Enable the **Custom Access Token** hook
   - Select the `custom_access_token_hook` function (created by schema.sql)
   - This is **required** — without it, role-based access won't work

> **Important:** The custom access token hook function must be `security definer` and requires these grants (included in schema.sql):
> ```sql
> grant usage on schema public to supabase_auth_admin;
> grant select on public.profiles to supabase_auth_admin;
> ```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the values from either `supabase start` output (local) or Supabase dashboard (cloud):

```env
# Supabase — use values from `supabase start` output or Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

# TMDb (from themoviedb.org)
TMDB_API_KEY=your-tmdb-api-key

# Site URL (used for OAuth redirects and magic links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable | Where to find it | Exposed to browser? |
|----------|-----------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `supabase start` output or Supabase > Settings > API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `supabase start` output or Supabase > Settings > API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase start` output or Supabase > Settings > API | No (server only) |
| `TMDB_API_KEY` | themoviedb.org account | No (server only) |
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL | Yes |

### 4. Bootstrap the first admin

```bash
npm run dev
```

1. Open `http://localhost:3000/bootstrap`
2. Enter a display name and sign in via Google or magic link
   - With local Supabase: check `http://localhost:54324` (Inbucket) for the magic link email
3. The first user is automatically assigned the `admin` role
4. Bootstrap is disabled once a profile exists

### 5. Invite members

1. Go to **Admin > Invites** and generate an invite code
2. Share the code — new users enter it at `/signup` with their display name, then sign in

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
```

## Docker Development

You can run the Next.js app in Docker instead of installing Node.js locally. This works alongside local Supabase (`supabase start` runs its own containers separately).

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A configured `.env.local` file (see [Configure environment variables](#3-configure-environment-variables))

### Quick start with Docker Compose

```bash
# 1. Start local Supabase (if using local)
supabase start

# 2. Start the Next.js app
docker compose up
```

This builds the image, installs dependencies, and starts the dev server at `http://localhost:3000` with:
- **Hot reload** — source files are mounted as a volume, so edits are reflected immediately
- **File watching** — `WATCHPACK_POLLING=true` ensures file changes are detected inside the container
- **Isolated node_modules** — dependencies live inside the container (not on your host)

> **Note:** When using local Supabase with Docker, set `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321` in `.env.local` so the container can reach the Supabase API on the host.

To rebuild after changing `package.json`:

```bash
docker compose up --build
```

To run in the background:

```bash
docker compose up -d
docker compose logs -f    # follow logs
docker compose down       # stop
```

### Using Docker directly (without Compose)

Build the image:

```bash
docker build -t movie-night .
```

Run the container:

```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e WATCHPACK_POLLING=true \
  movie-night
```

### Running commands inside the container

```bash
# One-off commands
docker compose exec app npm run build

# Open a shell
docker compose exec app sh
```

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (synced with Supabase Auth) |
| `movies` | Movie catalog with TMDb metadata snapshots |
| `movie_comments` | User comments on movies |
| `surveys` | Ranked-choice surveys (draft/live/frozen) |
| `survey_entries` | Movies included in a survey |
| `ballots` | User votes in a survey |
| `ballot_ranks` | Individual rank entries per ballot |
| `ballot_change_logs` | Audit trail for ballot changes |
| `invites` | Admin-generated invite codes |
| `invite_uses` | Tracks invite code usage |
| `admin_logs` | Audit trail for admin actions |

### Quick Poll Tables

| Table | Purpose |
|-------|---------|
| `quick_polls` | Public polls (draft/live/closed) |
| `quick_poll_movies` | Self-contained movie snapshots per poll |
| `quick_poll_votes` | Anonymous/authenticated voter ballots |

Quick poll movies store their own TMDb snapshot (not linked to the main `movies` table), so polls are self-contained and shareable independently.

## Authentication Flow

```
User visits site
       │
       ├─ /login ─────────────── Magic link / Google OAuth
       │                              │
       ├─ /signup ────────────── Invite code + display name → Magic link / Google
       │                              │
       ├─ /bootstrap ─────────── First admin setup → Magic link / Google
       │                              │
       └─ /poll/[id] ────────── Optional sign-in (auto-creates profile)
                                      │
                                      ▼
                              /auth/callback
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                    Has profile   Has cookie    From poll
                    (existing     (signup or    (auto-create
                     user)        bootstrap)     profile)
                         │            │            │
                         ▼            ▼            ▼
                     Dashboard    Create        Create
                                 profile       profile
                                 + redirect    + redirect
                                               to poll
```

### Route Protection

| Route group | Access |
|-------------|--------|
| `(auth)` | Public — redirects to dashboard if already logged in |
| `(app)` | Requires authenticated user with active status |
| `(admin)` | Requires authenticated user with admin role |
| `(poll)` | Public — anonymous cookie-based voter ID |

## Scoring Algorithm

Ranked-choice surveys use a points-based system:

```
Points = max_rank_n - rank + 1
```

For a survey with `max_rank_n = 5`:
| Rank | Points |
|------|--------|
| #1 | 5 |
| #2 | 4 |
| #3 | 3 |
| #4 | 2 |
| #5 | 1 |

**Tie-breaking:** When two movies have the same total points, the system compares the number of #1 votes, then #2 votes, and so on.

## Styling

Dark cinematic theme with Tailwind CSS v4 and CSS custom properties:

- **Primary:** `#d4a053` (gold)
- **Background:** `#0d0d0f` (near-black)
- **Surface:** `#18181b` / `#27272a` (elevated layers)
- **Fonts:** Playfair Display (headings), DM Sans (body)
- **Effects:** Film grain overlay, custom animations (fade-in, ballot pop, slot pulse)

## Deployment

### Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set the **Root Directory** to `next-app`
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Update `NEXT_PUBLIC_SITE_URL` to your production URL
5. Update Supabase Auth **Site URL** and **Redirect URLs** to match your production domain

### Supabase Production

- Ensure the custom access token hook is enabled
- Ensure Google OAuth redirect URI includes your production callback URL
- RLS policies are enforced automatically — no additional configuration needed

## Key Architecture Decisions

- **4 Supabase clients** — Browser, Server, Middleware, Admin — each with appropriate access levels. Admin client (service role) bypasses RLS for operations that need elevated access (e.g., pre-auth queries, anonymous poll votes).
- **Cookie-based poll voters** — Quick polls use an httpOnly cookie (`qp_voter_id`) for anonymous voter identity. Logged-in users get their user ID as the cookie value for cross-device consistency.
- **Self-contained poll movies** — Quick poll movies store their own TMDb snapshot, decoupled from the main movie catalog, so polls are independent and shareable.
- **Server Actions over API routes** — Most mutations use Next.js Server Actions (`'use server'`) with `useActionState` for form handling. API routes are only used for polling/real-time data fetches.
- **Atomic ballot submission** — Survey ballots are submitted via a PostgreSQL function (`submit_ballot`) that handles upsert + change logging in a single transaction.
