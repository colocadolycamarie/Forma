# Forma

A focused training log: plan sessions, log sets, and see progress over time.

## Stack

- **Client** — Vite, React 19, TypeScript, Tailwind CSS 4, TanStack Query, wouter
- **Server** — Express 5, TypeScript, Drizzle ORM, PostgreSQL, session-based auth (bcrypt + `express-session` + `connect-pg-simple`)
- **Shared** — a small `@forma/shared` workspace package with the Zod schemas both sides import, so request/response shapes can't drift apart

No Replit-specific tooling, plugins, or environment variables remain — this runs anywhere Node 20+ and Postgres are available.

## Project layout

```
forma/
├── client/            Vite + React frontend
├── server/             Express API
├── packages/shared/    Zod schemas + inferred types shared by both
└── package.json         npm workspaces root
```

## 1. Get a Postgres database

Any Postgres 14+ works. For a hosted option, [Neon](https://neon.tech) or [Supabase](https://supabase.com) both have a free tier — create a project and copy the connection string they give you (it should look like `postgresql://user:pass@host/db?sslmode=require`).

## 2. Configure environment variables

```bash
cp server/.env.example server/.env
```

Then edit `server/.env`:
- `DATABASE_URL` — the connection string from step 1
- `SESSION_SECRET` — any long random string (the `.env.example` file shows a one-liner to generate one)

## 3. Install and set up the database

```bash
npm install

# Creates the tables (users, exercises, workout_sessions, session_exercises, logged_sets)
npm run db:push

# Populates the shared exercise catalog (safe to re-run)
npm run db:seed
```

## 4. Run it

```bash
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173 (proxies `/api` to the server — see `client/vite.config.ts`)

Open the app, create an account, and you're training. Every athlete gets their own sessions, sets, streaks, and history — nothing is shared or hardcoded between accounts.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs the API and client together, both with hot reload |
| `npm run build` | Type-checks and builds `shared`, `server`, and `client` for production |
| `npm run typecheck` | Type-checks all three workspaces without emitting |
| `npm run db:push` | Applies the Drizzle schema to your database |
| `npm run db:seed` | Seeds the exercise catalog |
| `npm start` | Runs the built server (after `npm run build`) |

## Running the tests

```bash
cd server
npm test
```

This runs real integration tests (`server/src/app.test.ts`) against the Postgres database in your `DATABASE_URL` — signup, login, session lifecycle, PR detection, and the dashboard aggregation math are all exercised against actual database queries, not mocks. The tests truncate and reseed their tables before each run, so point `DATABASE_URL` at a database you don't mind being wiped (a local or disposable one, not your main dev database) when running them.

## Deploying to Vercel

The app is structured as: a static React SPA (`client/`) plus one serverless API function (`api/index.ts`, which wraps the same Express app that also runs standalone via `npm start`). `vercel.json` and the `vercel-build` script in `package.json` already configure all of this — you shouldn't need to touch Vercel's build/output settings in the dashboard.

**1. Get a serverless-friendly Postgres connection string.**
Serverless functions open a new database connection per cold start, so use your provider's *pooled* connection string, not a direct one:
- **Neon:** copy the connection string labeled "Pooled connection" in your project dashboard (it routes through Neon's built-in PgBouncer).
- **Supabase:** use the "Transaction" pooler connection string (port 6543), not the direct connection (port 5432).

**2. Push the schema and seed the exercise catalog once, from your own machine, against that same database** (this only needs to happen once, not on every deploy):
```bash
cp server/.env.example server/.env
# edit server/.env: paste your pooled DATABASE_URL, and generate SESSION_SECRET with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm install
npm run db:push
npm run db:seed
```

**3. Push this project to a GitHub repo** (Vercel deploys from a Git connection).

**4. In Vercel:** New Project → import that repo. Leave the build/output settings as detected (this project's `vercel.json` handles them) — you only need to set environment variables, under Project Settings → Environment Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The same pooled connection string from step 1 |
| `SESSION_SECRET` | The same value you generated in step 2 |
| `CLIENT_ORIGIN` | Your Vercel deployment URL, e.g. `https://your-project.vercel.app` (you can add this after the first deploy once you know the URL, then redeploy) |

Do **not** set `NODE_ENV` — Vercel sets it to `production` automatically, and the app relies on that to enable secure cookies and the serverless connection-pool cap.

**5. Deploy.** Vercel will run `npm install` (which also builds `packages/shared` automatically via a `postinstall` hook), then `npm run vercel-build` (builds the server and the client), then bundle `api/index.ts` as a serverless function.

**6. Verify it actually works** — this is the one thing I couldn't do from my end (no Vercel access in the environment I built this in):
- Visit your deployment URL — the app shell should load.
- Try signing up for a real account. If this fails, check the function's logs (Vercel dashboard → your project → Logs) — a `DATABASE_URL`/connection error here is the most likely first issue, usually meaning the pooled connection string wasn't used or a firewall/IP-allowlist on your database is blocking Vercel's IPs (Neon and Supabase both allow all IPs by default, so this is more relevant if you're on a different provider).
- Log out and back in — confirms sessions (stored in Postgres via `connect-pg-simple`) are working.
- Refresh the page while on `/train` or `/progress` — confirms the SPA-fallback rewrite in `vercel.json` is working (without it, a direct load of a client-side route 404s).

If something fails at step 6, the function logs will tell you which of these it is faster than guessing — share the error and I can help from there.

## Run the tests

`server` has an integration test suite (Vitest + Supertest) that runs against a real Postgres database — not mocks. It exercises the actual signup/login/session flow, logs real sets and checks PR detection, and verifies the dashboard's computed numbers (streak, volume, adherence) are correct.

```bash
cd server
npm test
```

It uses the same `DATABASE_URL` as `npm run dev` (from `server/.env`), so point it at a scratch/test database — the suite truncates all tables before each test.

## How a new athlete's data is generated

There's no demo data. On first login, "today's session" is created on demand: it repeats the athlete's most recent program if they have one, or starts from the top of the shared exercise catalog if they don't. Every dashboard number — streak, weekly volume, adherence, the consistency heatmap, and the weekly insight — is computed from that athlete's own logged sets. See `server/src/services/dashboard.service.ts` and `server/src/services/workout.service.ts`.
