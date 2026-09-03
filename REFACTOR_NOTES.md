# Refactor notes

What changed, and why. Verified: `npm run typecheck` passes clean across all three workspaces, `vite build` produces a working client bundle, and `tsc` produces a working server build — see the bottom of this file for the exact commands.

## 1. Replit removed entirely

Deleted: `.replit`, `.replitignore`, `replit.md`, `.agents/`, `.local/`, `attached_assets/`, the `@replit/vite-plugin-*` Vite plugins, `@replit/connectors-sdk`, and the pnpm-enforcement `scripts/post-merge.sh`. Nothing in the new project references Replit — it's a plain Node/Vite/Postgres app that runs anywhere.

## 2. Restructured into a conventional layout

Old layout was a 4-package pnpm workspace (`lib/db`, `lib/api-zod`, `lib/api-spec`, `lib/api-client-react`) plus two apps under `artifacts/` (one of which, `mockup-sandbox`, was dead — you confirmed it should go). That's a lot of indirection for one product.

New layout:
```
forma/
├── client/            React app (was artifacts/forma)
├── server/             Express API (was artifacts/api-server)
├── packages/shared/     Zod schemas + types both sides import
└── package.json          npm workspaces root
```
`client` and `server` are the two real deployables; `shared` is the one piece of code that legitimately needs to exist in both.

**Why npm workspaces instead of pnpm:** pnpm isn't Replit-specific, but the old repo also had an orval code-generation pipeline (`lib/api-spec` → generates `lib/api-client-react`) sitting in front of a fairly thin wrapper. That's a build step, a generated-code directory, and a runtime-agnostic fetch abstraction (with React Native/blob-response branches this app never uses) — for an app that only ever runs in one browser talking to one same-origin API. I replaced it with a ~40-line hand-written fetch wrapper (`client/src/lib/api-client.ts`) and plain TanStack Query hooks. Less to generate, less to maintain, same type safety (from the shared Zod schemas).

## 3. Real multi-user authentication (previously: none)

There was no login. Every request implicitly belonged to one hardcoded athlete, "Maya" — her name was a literal string in the API response. Added:
- `users` table, passwords hashed with bcrypt (never stored in plaintext)
- Signup / login / logout / `me` endpoints (`server/src/routes/auth.routes.ts`)
- Sessions stored in Postgres via `connect-pg-simple` (no third-party auth service, no extra credentials to manage beyond the database you already have)
- Login and Signup pages on the client, in the same visual language as the rest of the app
- Every route that touches training data now requires a session and scopes all queries to `req.session.userId`

## 4. All mock/hardcoded data replaced with real, computed logic

| Before | After |
|---|---|
| `athleteName: "Maya"` hardcoded in the API | Pulled from the logged-in user's account |
| `exerciseBlueprint` — one fixed array of exercises for everyone | `exercises` table (a real catalog, seeded once — see below) plus a `session_exercises` join table, so each session's exercise list is real, per-session data |
| Heatmap generated from a fake pattern function | Computed from actual `logged_sets` rows, grouped by day, quartiled into 5 shading levels |
| Exercise history returned fabricated data points when a user had no real sets | Returns the user's real history; if there isn't any yet, the UI shows an honest empty state instead of invented numbers |
| `insight` was a static string | Computed by comparing this week's real logged volume to last week's |
| Streak, weekly volume, adherence % | All computed from real `workout_sessions` / `logged_sets` rows for the authenticated user |

**One thing worth calling out explicitly:** the exercise catalog (`server/src/db/seed.ts`) is *reference data*, not mock data — the same way an e-commerce app seeds its product catalog. It's what "today's session" is built from for a brand-new athlete with no history yet. Every exercise assignment, set, and stat that flows from it is real and per-user.

**Also dropped:** the original had a "body weight trend" stat (`weightTrend`, `weightTrendDirection`) with no underlying feature to produce real data — it was fabricated. Rather than keep inventing a number for it, I removed it from the dashboard. Bodyweight tracking would be a legitimate feature to add later; it just isn't represented as data today, so I didn't pretend it was.

## 5. Dead code removed

- `mockup-sandbox` app — deleted per your answer above.
- Two unused exports from `forma-primitives.tsx` (`CompleteMark`, `ArrowAction`) — grepped the whole app, nothing imported them.
- `use-mobile.tsx` hook and `sidebar.tsx` — only consumer of either was the other; neither was used by any page.
- ~50 of the ~55 shadcn/ui components (`accordion`, `carousel`, `alert-dialog`, and so on) were never imported anywhere. Kept the 3 that are actually used: `toast`, `toaster`, and their backing hook — trimmed the hook itself from 187 lines to ~45 (the original supported update/dismiss-by-id queueing that nothing in the app used).
- `train.tsx` previously kept a duplicate local copy of session/set state (`activeSession`, `loggedSets`) alongside the server data, manually merged in the UI. Since every mutation already invalidates the relevant query, the cache updates itself — deleted ~15 lines of manual state-merging that was solving a problem TanStack Query already solves.

## 6. Naming

Files and components renamed for clarity and to drop app-specific prefixes now that there's no ambiguity about which app owns them:
- `forma-shell.tsx` → `app-shell.tsx`
- `forma-primitives.tsx` → `page-states.tsx` (describes what it actually contains: loading/error/empty states)
- `Home`, `Train`, `Progress`, `Coach`, `NotFound` → `HomePage`, `TrainPage`, `ProgressPage`, `CoachPage`, `NotFoundPage` (avoids collisions with the many same-named exports from libraries like `lucide-react`)
- Backend: `getGetAthleteHomeQueryKey`/`useGetAthleteHome`-style generated hook names → plain `useAthleteHome`, `useTodaySession`, `useLogSet`, etc.

## 7. UI/UX audit

The existing "Forma" design system (custom display/mono type pairing, the dark sidebar, the staggered entrance animations, the hand-built logo mark) was already distinctive and intentional — not a generic template — so I kept it and extended it consistently rather than replacing it:
- **Added:** Login and Signup screens in the same visual language (not a bolted-on generic auth form)
- **Fixed:** the 404 page was the *unstyled default shadcn scaffold* (`bg-gray-50`, plain black text) — it didn't match the rest of the app at all. Rebuilt it in the Forma style.
- **Loading/error states:** added `role="status" aria-live="polite"` to loading blocks and `role="alert"` to error blocks so screen readers announce them.
- **Navigation:** added `aria-current="page"` on the active nav link and `aria-expanded` on the exercise disclosure buttons in Train.
- **Real-time reflection:** the sidebar's streak widget now shows the athlete's actual streak instead of a static "04/05 sessions" string.
- **Sign-out feedback:** wired the (previously unused-in-practice) toast system to surface a real error if sign-out fails, instead of failing silently.
- Kept all existing `data-testid` attributes and empty/loading/error states per page — they were already well thought through; the issue was that they were fed fake data, not that the states themselves needed rebuilding.

## 8. Config files

- `package.json` (root): npm workspaces, no Replit scripts
- `server/tsconfig.json`: `NodeNext` module resolution, strict mode, no path-mapping hacks (the shared package now builds to `dist/` and resolves as a normal workspace dependency)
- `client/vite.config.ts`: standard `@vitejs/plugin-react` + `@tailwindcss/vite`, `/api` dev proxy instead of same-process serving
- `drizzle.config.ts`: standard `drizzle-kit` Postgres config reading `DATABASE_URL`

## What you need to do

1. `cp server/.env.example server/.env` and fill in your Neon/Supabase connection string and a session secret (see README).
2. `npm install`
3. `npm run db:push` (creates tables) then `npm run db:seed` (populates the exercise catalog)
4. `npm run dev`

## Verification performed here

```
npm run typecheck   # shared, server, client — all pass
cd client && npx vite build   # builds a working production bundle
cd server && npx tsc -p tsconfig.json   # builds a working production server
```

I didn't have a live Postgres instance available in this environment (network access here is limited to package registries), so I couldn't exercise the running app end-to-end against a real database. Everything above the database layer — types, schemas, request/response contracts, and both production builds — is verified. I'd still recommend smoke-testing signup → log a set → check the dashboard once you point it at your real database.

## 9. UI/UX audit against ui-ux-pro-max (added after initial delivery)

I initially preserved the existing design system without running it through this skill — that was a gap. Ran it properly:

```
python search.py "fitness training log tracker productivity" --design-system -p "Forma"
```

**What it recommended vs. what's here:** its top style/color/type match (flat mobile-first, orange/green energetic palette, Barlow Condensed) is a legitimate direction for a fitness app, but it's a different brand than the one already built — swapping to it would mean discarding a distinctive, cohesive identity (the dark-sidebar layout, Space Grotesk/DM Sans pairing, the hand-drawn mark) for a more generic "fitness app" look, which cuts against the "don't look template-based" part of your brief. I kept the existing identity and instead applied the skill's **priority-1/2 checklist** (accessibility, touch/interaction) against the actual code, since those are objective pass/fail items regardless of visual style. Found and fixed real gaps in `client/src/index.css`:

- **No `prefers-reduced-motion` handling** — added a media query that disables animations/transitions for anyone with that OS setting on.
- **No visible focus-visible ring** — added a global `:focus-visible` outline using the existing `--ring` token, so keyboard users can see where they are (previously ring styling only existed on a few inputs).
- **Buttons defaulted to `cursor: default`** (Tailwind's preflight) instead of `cursor: pointer` — fixed globally for `button`, `[role=button]`, and `a`.

Re-verified after the fix: `npm run typecheck` (all 3 workspaces) and `vite build` both still pass clean.

**Still not done:** I did not run a full color-contrast audit line-by-line against WCAG 4.5:1 for every token combination — I'm treating the existing token system as trustworthy rather than re-deriving it, since it predates this refactor and looked deliberately built. If you want that audited formally, it's a reasonable follow-up.

## 10. WCAG contrast audit (done)

## 11. Dark mode was dead code — now wired up

Found a real bug during a UI/UX quality check: `index.css` had a complete, well-built `.dark { ... }` color palette (background, sidebar, cards, all of it) but nothing in the app ever added the `dark` class to the page. It was unreachable CSS — a fully designed dark theme that could never actually be seen.

Rather than delete a complete, deliberately-built palette, I wired it up properly:
- `client/src/hooks/use-theme.tsx` — a small `ThemeProvider`/`useTheme` pair. Defaults to the OS's `prefers-color-scheme`, persists an explicit choice to `localStorage`, and keeps following the OS setting live if the athlete never overrides it.
- An inline script in `index.html` applies the theme class before React mounts, so there's no flash of the wrong theme on load.
- A toggle button (sun/moon icon) in both the desktop sidebar and the mobile nav drawer, next to sign-out.

Rebuilt and typechecked clean afterward.

## 12. Visual verification — what I could and couldn't do

I don't have a way to actually render this app and look at it — no headless browser is available in this environment (Chrome binary downloads are blocked by network egress rules here), so everything above was verified at the *code and computed-contrast* level, never visually.

To close that gap as much as I honestly can: `forma-visual-preview.html` (delivered alongside this zip) is a static page built from the **actual compiled CSS output** of this project (`vite build`'s real CSS, not a re-creation) with the Home dashboard's real Tailwind classes and structure, filled with sample data, plus a light/dark toggle. It's not the running app — no routing, no interactivity beyond the theme toggle — but the colors, spacing, type, and layout are exactly what the real build produces. Open it in a browser to judge the actual visual output yourself, rather than taking my word for it.

## 13. Real end-to-end verification against a live database

Everything up to this point had been verified at the type/build level only — I'd never actually run the app. Set up a real local Postgres, ran the actual `npm run db:push` and `npm run db:seed` commands from the README, booted the real server, and drove it with real HTTP requests (signup, session cookies, starting a session, logging sets, completing it, reading the dashboard, logging out). This caught two real, previously-undetected problems:

- **`npm run db:push` was actually broken.** A known class of npm-workspace issue: `drizzle-kit`'s dynamic `import('drizzle-orm')` resolves relative to its own package location, and `drizzle-orm` had only been installed under `server/node_modules`, not hoisted to the workspace root where `drizzle-kit` lives. The documented setup command in the README would have failed for you too. Fixed by pinning `drizzle-orm` as a root-level devDependency so it hoists correctly; re-verified the exact `npm run db:push` command against a clean database afterward.
- **A real display bug.** With a fresh athlete's auto-generated session pulling from multiple catalog exercises, the dashboard's subtitle read `"Chest · Triceps · Upper chest · Chest · Triceps"` — duplicated groups, because some exercises have compound labels (e.g. one exercise is tagged `"Chest · Triceps"` as a single string) and the code was deduplicating whole labels instead of the individual muscle groups inside them. Fixed in `dashboard.service.ts` and confirmed against the live server: now reads `"Chest · Triceps · Upper chest"`.

## 14. Mobile nav menu — accessibility gaps found and fixed

Auditing the mobile drawer menu (`app-shell.tsx`) turned up real gaps: no `role="dialog"`, no focus trap (tabbing could escape into the page behind it), no Escape-to-close, and focus wasn't moved into the menu on open or back to the trigger button on close. Added all four. Verified via typecheck + build; not verified with an actual screen reader (see the ongoing visual/interactive-testing limitation in §12).

## 15. Exhaustive contrast audit

The earlier pass (§10) checked a handful of pairs I suspected were problems. This time I mechanically listed every color token actually used as text anywhere in `client/src` — including partial-opacity variants like `sidebar-foreground/.45` — and computed real contrast for each, including compositing translucent text/backgrounds against what they actually sit on (not just checking the token in isolation). Found four more real failures beyond the three from before:

| Pair | Ratio | Where | Fix |
|---|---|---|---|
| `sidebar-foreground` at 45–52% opacity, on the sidebar | 3.73–4.48 | "Your space" label, streak "days" suffix, user email, coach page meta text (5 instances) | Bumped all to ≥56% opacity (verified 4.94:1) |
| `destructive` text on `destructive/.1`-tinted backgrounds | 3.6 | Login/signup error banners, the "couldn't save that set" message | New `--destructive-text` token, darker than `--destructive` (which stays correctly paired with `--destructive-foreground` for solid buttons) |
| `secondary-foreground` at 58% opacity on `secondary` | 3.32 | "Today's insight" label on the home dashboard | Bumped to 75% opacity (verified 5.17:1) |
| Dark-mode palette | — | — | Computed all 7 dark-mode text/background pairs; all pass AA except `destructive-foreground` on solid `destructive`, which isn't actually used as a solid fill anywhere in the app — confirmed via grep, so moot |

All verified computationally (relative-luminance WCAG formula) before and after, then rebuilt and typechecked clean.

## 16. Automated tests (new)

There were no tests. Added a real integration suite (`server/src/app.test.ts`, Vitest + Supertest) that runs against a live Postgres database rather than mocks — 12 tests covering signup validation, duplicate-email rejection, wrong-password rejection, session invalidation on logout, cross-user authorization (an athlete can't log sets on someone else's session), input validation, the full session lifecycle (auto-create → start → log sets with correct PR detection → complete), dashboard math (streak/volume/adherence), the honest-empty-state case for a brand-new athlete, and a regression test for the muscle-group subtitle bug from §13 so it can't silently come back. All 12 pass against a real database — see `README.md` → "Run the tests" for how to run them yourself.

## What's still not done, even after this pass

Being direct about the remaining gap: I still have no way to visually render this app or use a screen reader in this environment. Everything in §14–16 was verified at the code/HTTP/computed-contrast level, which is real verification — but "does this look and feel right to an actual person" is still something only you (or a real browser session) can confirm. The static preview in §12 is the closest I can get you to that on my own.

## 17. Found by testing the actual delivered zip, not my working directory

After finishing §13–16, I unzipped the exact file being delivered into a scratch directory and ran `npm install` → `npm run typecheck` with zero manual steps, to check what a new user actually experiences. It failed: `@forma/shared` only produces its `dist/` output when explicitly built, and neither `npm install` nor `npm run dev` nor `npm run typecheck` ever did that automatically — I'd been manually running `npm run build --workspace packages/shared` throughout this session without noticing the documented flow didn't include it anywhere. Every command I'd "verified" up to that point had been verified against my own working directory's leftover build state, not a clean install.

Fixed with a `postinstall` script at the workspace root that builds `packages/shared` automatically right after `npm install` finishes — the standard way to handle this in an npm-workspaces monorepo. Then re-verified the entire chain from an actual fresh unzip: `npm install` → `npm run typecheck` (clean) → `npm run db:push` (real schema applied) → `npm run db:seed` (real catalog seeded) → `npm test` (all 12 pass) → `vite build` (clean). Every one of those ran with no manual intervention this time, which is what "explain each change and verify behavior" should have meant from the start.



Went back and actually computed contrast ratios for the token pairs used as text/background throughout the UI (script logic: relative luminance → WCAG contrast formula, checked against the real HSL values in `index.css`). Found three real failures:

| Pair | Ratio | Where it showed up |
|---|---|---|
| `muted-foreground` on `background`/`card` | 3.82 / 4.14 | Nearly every secondary line of text in the app (subtitles, metric detail labels, timestamps) — this one mattered most because of how often it's used |
| `primary` used as small text on `background` | 2.65 | The bold uppercase "eyebrow" label at the top of every page, and the 404 page's "404" label |
| `accent-foreground` on solid `accent` | 2.77 | The trophy icon badge on the Progress page |

Fixed by darkening `--muted-foreground` from 46% to 41% lightness (one token, fixes it everywhere it's used), adding a new `--primary-text` token at 32% lightness for small-text-on-light-background contexts (kept `--primary` itself untouched since it's correctly paired with `--primary-foreground` for buttons), and swapping the one solid-accent icon to a dark foreground color. All three now sit at 4.6–5.0:1, comfortably past the 4.5:1 AA threshold. Rebuilt and typechecked clean afterward.


## 13. Real, live end-to-end verification (this pass)

Everything up to this point had been verified at the type/build level only. This pass, I actually stood up a local Postgres instance and ran the real app against it — genuinely different from re-reading the code.

**Found and fixed a real bug this way:** the dashboard's session subtitle was rendering as `"Chest · Triceps · Upper chest · Chest · Triceps"` — duplicated groups. Cause: the exercise catalog's `muscleGroup` values are themselves compound strings (e.g. one exercise is tagged `"Chest · Triceps"` as a single label), and the dashboard was deduping by exact string match instead of splitting on `·` first. Fixed in `dashboard.service.ts`, re-verified live.

**Found and fixed a real setup bug:** `npm run db:push` — the command in this very README — failed in a fresh install with `Error: please install required packages: 'drizzle-orm'`. Root cause: an npm-workspaces hoisting quirk left `drizzle-orm` nested only inside `server/node_modules`, where `drizzle-kit`'s own dynamic import (resolved relative to its own location at the workspace root) couldn't see it. Fixed by pinning `drizzle-orm` as a root-level devDependency too, forcing it to hoist where the CLI tool actually looks. Verified from a completely clean `node_modules` that `npm install` → `npm run db:push` → `npm run db:seed` now works exactly as documented.

**Full flow actually exercised against a live database:** signup → session cookie issued → `/me` returns the right user → today's session auto-generated from the exercise catalog (no history yet, so suggestions were honestly `null`, not fabricated) → start session → log 3 sets → PR flag was correct on all three (true, true, false, matching the actual weights) → complete session → dashboard numbers were arithmetically correct (weekly volume, streak, adherence, heatmap all matched hand-calculated expected values) → exercise history correct → logout correctly invalidated the session (subsequent `/me` returned 401).

## 14. Added a real automated test suite (previously: none)

"Verify behavior remains unchanged" had only ever meant "typechecks and builds" — that doesn't catch a logic bug like the subtitle duplication above. Added `server/src/app.test.ts` (Vitest + Supertest), 12 integration tests against a real database — not mocked:
- Auth: signup validation, duplicate-email rejection, wrong-password rejection, session persistence, logout invalidation, protected-route blocking
- Workout flow: today's-session auto-generation, PR detection across 3 sets, session completion, cross-athlete data isolation (athlete B can't log a set on athlete A's session — returns 404, not leaked data), invalid-input rejection
- Dashboard: the exact streak/volume/adherence math, plus a regression test for the subtitle bug above, plus a test that a brand-new athlete gets an honest zero-state, not fabricated numbers

Run with `cd server && npm test` (see README). All 12 pass from a freshly created database.

## 15. Server tsconfig gap fixed

`server/tsconfig.json` was missing `noUnusedLocals` / `noUnusedParameters` — the client had them, the server didn't, so "remove unused imports" was never actually compiler-enforced on the server side. Added; re-typechecked clean (nothing was hiding).

## 16. Exhaustive contrast audit (previous pass only checked a handful of pairs)

Enumerated every color token actually used as text anywhere in the client (`grep` across all pages/components, not a guess), then computed real WCAG contrast for each — including ones with fractional opacity (e.g. `text-white/50`), which need the *composited* result checked, not the base color. Found four more real failures beyond the ones fixed last time:

| Pair | Ratio before | Where | Fix |
|---|---|---|---|
| `sidebar-foreground` at `.45`/`.5`/`.52` opacity on `sidebar` bg | 3.73–4.48 | "Your space" nav label, streak "days" unit, user email, coach page labels (5 places) | Bumped all to `.56` (verified 4.94:1) |
| `destructive` text on `destructive/.1` tinted background | 3.6 | Login/signup error messages, train page set-save error | New `--destructive-text` token, darker than `--destructive` itself, used only for text (kept `--destructive` unchanged for its other uses) |
| `secondary-foreground` at `.58` opacity on `secondary` bg | 3.32 | "Today's insight" label on the home page | Bumped to `.75` (verified 5.17:1) |
| Dark mode's full token set | — | — | Computed separately: all pass AA except `destructive-foreground` on solid `destructive`, which turned out to be unused anywhere in the app — confirmed via grep, not a real issue |

Rebuilt and re-typechecked clean after all four fixes.

## 17. Mobile nav menu accessibility (previously incomplete)

The mobile menu overlay had none of: a focus trap, Escape-to-close, `role="dialog"`, or focus return to the trigger button on close — a keyboard user could tab out of it into the page behind it. Fixed in `app-shell.tsx`: focus moves to the first focusable element on open, Tab wraps within the panel, Escape closes it, and closing (via Escape, the X button, or picking a nav link) returns focus to the hamburger button that opened it. Typechecked and built clean.

## What's still genuinely not done

- No exhaustive keyboard-navigation walkthrough of every page beyond the mobile menu fix above (tab order on Train's per-exercise disclosure list, for instance, wasn't traced end-to-end).
- No real responsive-breakpoint testing — still reasoning about Tailwind classes, not observed rendering, since no headless browser is reachable in this sandbox.
- No screen-reader testing (VoiceOver/NVDA) — the ARIA attributes are in place per the checklist, but never confirmed by an actual assistive-technology pass.

## 18. Code-level keyboard/ARIA/cross-browser audits (this pass)

Three things genuinely require a live browser and remain unverified: visual rendering, real responsive-breakpoint behavior, and actual screen-reader testing. Everything below is a systematic *code* audit — enumerating every instance of a pattern across the codebase, not sampling — which is honest, but is not the same as observing it run.

**Keyboard navigation:** confirmed no keyboard traps (every `onClick` in the app is on a real `<button>`/`<a>`/`<Link>`, never a `div`; no manual `tabIndex` reimplementation; no CSS `order`/`flex-reverse` utilities anywhere, so DOM order matches visual order everywhere). Found one real gap: **client-side route changes never moved focus.** In a traditional site, a full page load resets focus to `<body>`; in this SPA, navigating via the sidebar left focus wherever it was, with no signal to a keyboard or screen-reader user that the page changed. Fixed: focus now moves to the page's `<main>` on every route change (skipped on first mount).

**Semantic HTML/ARIA:** audited every form input for label association (all correctly paired), every icon-only button for `aria-label` (all 5 already had one), heading hierarchy across all 8 pages (every route has exactly one `h1`, stepping down cleanly to `h2`/`h3` with no skipped levels), and the progress chart's SVG (already has `role="img"` and a real `aria-label`). No further gaps found here beyond the focus issue above.

**Re-engaged `ui-ux-pro-max` properly this time** — queried its actual `ux-guidelines` dataset (Touch, Interaction, Forms, Feedback, Responsive categories) instead of only the accessibility subset I'd used previously, then checked each guideline against the real code:
- **Touch target size (44×44px minimum, "High" severity):** all 5 icon-only buttons (theme toggle, sign out, hamburger, mobile train shortcut, close button) were 32–38px. Fixed — all now `h-11 w-11` (44px).
- **Touch spacing (8px minimum, "Medium"):** the sidebar's nav links had only 4px (`space-y-1`) between 44px targets. Fixed to `space-y-2` (8px).
- **Password visibility toggle ("Medium"):** didn't exist on Login or Signup. Built a reusable `PasswordField` component (`components/auth-layout.tsx`) with a show/hide toggle (`aria-pressed`, proper `aria-label`) and used it on both forms — replacing the two duplicated manual password `<input>` blocks in the process, which was also a small dead-code cleanup.
- Checked the rest of the categories against the code and found no further gaps: loading-state buttons already disable during submission, toasts already auto-dismiss within the recommended 3–5s window, inputs already use correct `type`/`inputMode`/`autoComplete`, forms already show errors near the relevant field.

**Cross-browser risk:** found `min-h-[100dvh]` had no fallback — browsers without `dvh` support silently drop the whole declaration rather than degrading gracefully, so those users would get no minimum height at all. Added a `min-h-screen` (100vh) fallback in the three places it's used; CSS cascade naturally lets the `dvh` rule win where it's supported and falls back where it isn't. Confirmed separately that Tailwind v4's build pipeline already auto-prefixes `backdrop-filter` with `-webkit-` — verified in the actual compiled CSS output, not assumed.

**Also fixed in passing:** a deprecated `baseUrl` TypeScript option in both `client/tsconfig.json` and `server/tsconfig.json`, surfaced by a TypeScript version bump between installs — this was breaking `npm run typecheck` for anyone doing a fresh `npm install`, unrelated to any of the above but caught while working through this pass. Removed (unnecessary in both cases now that `paths` resolve relative to the tsconfig file). Rebuilt and reran the full 12-test suite against the live database after every change in this section — still 12/12 passing throughout.

## What's still genuinely not done

- Real visual verification (never rendered in an actual browser — no headless browser reachable in this environment).
- Real responsive-breakpoint observation (320/375/414/768/1024/1440) — code reasoning only.
- Real screen-reader pass (VoiceOver/NVDA) — ARIA attributes are in place per the checklist above, but a screen reader has never actually read this app aloud.
- Your real Postgres (Neon/Supabase) has never been used — all live verification in this project was against a local Postgres instance I stood up in this sandbox.

## 19. Made deployable on Vercel

Added Vercel-specific adaptation on top of the traditional Node+SPA structure (which is unchanged and still works standalone via `npm run dev`/`npm start`):

- **`api/index.ts`** — the actual Vercel serverless function entry point. Deliberately imports the *compiled* server (`server/dist/app.js`, produced during the build) rather than the TypeScript source. Reasoning: this project's `server/tsconfig.json` uses `NodeNext` module resolution, which requires `.js` extensions in import specifiers that actually point to `.ts` files pre-compilation — a pattern I could not confidently verify Vercel's on-the-fly function bundler would resolve correctly without an actual deploy to test against. Importing pre-compiled, real `.js` files removes that ambiguity entirely: it's a plain relative import to a file that unquestionably exists and unquestionably resolves the same way in any Node-compatible bundler.
- **`vercel.json`** — `outputDirectory: client/dist` (the static SPA build), a rewrite sending every `/api/*` request to the function (Vercel preserves the original request path when invoking the function via rewrite, so Express's existing `app.use("/api", router)` routing works completely unchanged), and a catch-all rewrite to `index.html` for client-side routing (so a direct load or refresh of `/train`, `/progress`, etc. works instead of 404ing).
- **`vercel-build` script** in the root `package.json` — Vercel's documented override hook, guaranteed to run before functions are bundled. Builds `packages/shared`, then `server` (now with `declaration: true`, so real `.d.ts` files exist alongside the compiled `.js` — needed so `api/index.ts` can be genuinely type-checked against the compiled output, not just assumed correct), then `client`.
- **`server/src/db/client.ts`** — capped the Postgres pool to 1 connection when running on Vercel (`env.VERCEL`). Every serverless function instance opens its own pool; without a cap, many concurrent cold starts can exhaust a database's connection limit. (Still recommend using your provider's pooled/PgBouncer connection string — see deployment steps.)
- **`server/src/env.ts`** — env-validation failure now `throw`s instead of calling `process.exit(1)`. `process.exit` inside a serverless function's module scope can abruptly kill the whole runtime instance rather than cleanly failing just that request; throwing fails the same way in both a traditional server and a serverless invocation.
- **Root `package.json`** — added `"type": "module"`. `api/index.ts` lives outside all three npm workspaces, so without this, Node would default it to CommonJS while the `server/dist/app.js` it imports is real ESM (`server/package.json` already has `"type": "module"`) — a mismatch that could fail in ways depending on the bundler's CJS/ESM interop, and not something I could fully verify without deploying. Making it explicit removes the ambiguity.

**What I verified locally, since I have no way to actually deploy to Vercel from this environment** (no Vercel account access, and this sandbox can't reach vercel.com — only npm/GitHub registries are reachable here):
- A completely clean install → `npm run vercel-build` → produces `client/dist` (matching `outputDirectory`) and `server/dist` (with working `.d.ts` files) — exactly what Vercel's build step would run.
- `api/index.ts` genuinely type-checks against the real compiled server output (not the source) — added `api/tsconfig.json` for this, since nothing in the existing workspace typecheck scripts covered this file.
- Compiled `api/index.ts` down to plain JS and actually **ran it** — loaded `createApp()` through the exact same relative-import chain Vercel would use, then fired real HTTP requests at the exported Express app (via `supertest`, simulating a serverless invocation) with `NODE_ENV=production`: health check → 200, real signup → 201 with a genuine database write, unauthenticated request to a protected route → 401. All correct.
- Re-ran the full 12-test suite against the live database after every change in this section — still 12/12.

**What I did not and could not verify:** actual behavior on Vercel's real infrastructure — cold start timing, the real serverless function bundler's behavior (even though I removed the biggest source of uncertainty by importing compiled output), DNS/domain configuration, and real network behavior between Vercel's edge and your database provider. The steps below tell you exactly what to check once you deploy for real, and what each likely failure mode would mean.

## 20. Real production incident found and fixed (post-deployment)

Deployed to Vercel and hit a real failure: every request returned 500 with `Invalid environment configuration: PORT: Number must be greater than 0 / CLIENT_ORIGIN: String must contain at least 1 character(s)`.

Root cause: `PORT` and `CLIENT_ORIGIN` were present in the Vercel project's environment variables with **empty string values**, not omitted. `Number("")` evaluates to `0` in JavaScript, so `PORT=""` sailed past Zod's `.default()` (which only applies to `undefined`, not `""`) and failed the `positive()` check on the resulting `0`. Same mechanism for `CLIENT_ORIGIN=""` against `.min(1)`.

Fixed in `server/src/env.ts`: added a Zod preprocessor that treats an empty string as unset for every field with a default (`NODE_ENV`, `PORT`, `CLIENT_ORIGIN`), so a blank value now correctly falls back to the default instead of failing validation. `DATABASE_URL` and `SESSION_SECRET` (which have no sensible default) were deliberately left strict — an empty value for either still fails loudly and clearly, which is correct.

Verified by reproducing the exact failure locally (`PORT="" CLIENT_ORIGIN=""` against the compiled server) before the fix, confirming it now resolves to the defaults after, and re-running the full 12-test suite — still 12/12.

## 21. Real multi-athlete / coach system (new feature)

Forma was single-role only — every account was implicitly an athlete, and the "Coach view" was a placeholder page with fabricated stats and a "not built yet" empty state. Built a real coach ↔ athlete relationship system instead:

**Data model:** `users.role` (`athlete` | `coach`), a unique `users.coach_code` (generated once per coach, on first request), and a `coach_links` table recording real relationships (unique per coach+athlete pair).

**How linking works:** a coach's dashboard shows their code; an athlete enters it once under "Your coach" to join that coach's roster. No email/SMTP infrastructure needed — the code is a low-friction, non-secret invite mechanism (it grants nothing beyond "add yourself to this roster," so a plain shareable code is appropriate). Either side can remove the connection.

**Role-based access control:** athlete training routes (`/sessions/*`, `/athlete/home`) now require `role: athlete`; coach routes (`/coach/roster`, `/coach/code`) require `role: coach`. Verified both directions are actually blocked, not just documented.

**A coach's roster shows real computed numbers** — the same streak/weekly-volume/adherence math already used on the athlete's own dashboard, computed per-athlete on demand. Deliberately does *not* reuse the function that also auto-generates "today's session" — a coach looking at their roster must never silently create training data on an athlete's behalf as a side effect. There's a dedicated regression test for this specific behavior.

**Frontend:** signup now has a role picker; the sidebar nav and mobile shell are role-aware (a coach sees only "Roster," an athlete keeps Today/Train/Progress/Coach); a coach landing on `/`, `/train`, or `/progress` (athlete-only routes) is redirected to `/coach`, and vice versa isn't possible since there's no equivalent redirect needed the other way.

**A real bug found and fixed while building this:** the athlete-only route guard was originally applied via an unscoped `router.use(requireRole("athlete"))` at the top of the workouts route file. Since Express routers execute their own `.use()` middleware for *any* request that reaches them — before checking whether a matching path exists — this was intercepting requests meant for the coach routes mounted alongside it, blocking a coach from ever reaching `/coach/code`. Fixed by applying the role check per-route instead (matching the pattern already used correctly elsewhere in the codebase), and added a regression test specifically for this.

**Verified:** full typecheck (all 3 workspaces) and production build succeed from a clean install. 19 automated tests pass against a real database (10 pre-existing + 9 new, covering: role-based access control in both directions, the routing-leak regression, code generation/stability, rejecting an unknown code, the full link→train→roster flow with real numbers, duplicate-link idempotency, unlink authorization, and the no-side-effect guarantee). Additionally ran the entire flow live over real HTTP one more time outside the test suite — signup as coach, get code, signup as athlete, link, log a real set, confirm the coach's roster reflects the exact correct computed number.

## 22. Public landing page (new)

Forma had no marketing page at all — every unauthenticated visitor to "/" was immediately redirected to `/login`, with nothing to look at before creating an account. Added `client/src/pages/landing.tsx`.

**Design process:** queried `ui-ux-pro-max` for landing-page structure and animation guidance. Its structural pattern ("Scroll-Triggered Storytelling": hook → problem → solution → climax CTA) is what the page follows. Its suggested *color palette and typeface* (navy/blue, Barlow Condensed) were deliberately **not** used — you asked for the page to be based on Forma's own existing brand identity, and adopting the tool's generic "fitness app" suggestion would have contradicted that, so I kept Forma's established mint/orange/dark-teal palette and Space Grotesk/DM Sans pairing instead. Its animation rules were followed directly: 1–2 animated elements per view (not everything moving at once), transform/opacity only (not width/height, for performance), no infinite decorative loops (only a one-time reveal per section, via a real `IntersectionObserver`, not a CSS animation that keeps replaying), and it inherits the `prefers-reduced-motion` handling already in place globally.

**Why it shouldn't read as a generic AI-generated template:** the product "demo" panel on the hero isn't a stock illustration — it's built from the exact same classes and visual language as the real heatmap/metric cards on the actual dashboard, so it's honestly showing what the product looks like rather than decorative filler. The copy avoids stock SaaS marketing phrases ("Unlock your potential," "Transform your journey") in favor of the plain, understated voice already established elsewhere in the app (e.g., "You don't need to chase every session," reused directly from the real Progress page). The decorative ring elements in the final CTA band reuse the same static (non-animated, non-gradient-blob) circle motif already used in the real dashboard hero — deliberately avoiding the generic floating-gradient-blob look that's become an AI-landing-page cliché.

**Routing:** rather than duplicating the auth-check logic, `AuthGate` (which every authenticated route already passes through) now shows the landing page specifically when an unauthenticated visitor is at `/` — a deep link to any other route (e.g. a bookmarked `/train`) still redirects straight to `/login` as before, since showing marketing copy there would just be a confusing detour.

**Small functional addition:** the landing page's "Start as an athlete" / "Start as a coach" cards link to `/signup?role=athlete` / `/signup?role=coach`, and the signup page now reads that query param to pre-select the matching role toggle.

**Verified:** full typecheck (all 3 workspaces) and production build succeed. Computed real contrast ratios for the new page's color pairs (all reuse already-verified tokens from earlier fixes — all pass AA). Re-ran the full 19-test backend suite to confirm this frontend-only change didn't disturb anything — still 19/19.

## 23. Landing page: real photography, logo-position fix

**Logo position drift, fixed:** the landing page header and the login/signup header had actually drifted apart (`px-5 ... h-[76px]` on landing vs `px-6 py-6 sm:px-10 sm:py-8` on auth pages) — close but not pixel-identical. Both now use the exact same header markup (`flex h-[76px] items-center px-5 sm:px-8 lg:px-12`), so the logo sits in precisely the same spot across landing, login, and signup.

**Real photography, sourced carefully:** added three real photos (Unsplash, free/commercial-use license, no attribution required) — one in the hero, one on each of the "Train on your own" / "Coach a roster" cards. These were not pulled from generic image search — I fetched Unsplash's own live search-results pages directly to get verified, current photo URLs from named photographers, filtering out `Unsplash+` (paid-tier) results, which are not free to use. One honest caveat: I could not independently re-fetch the final image URLs myself to confirm the pixels load, because this sandbox's own network policy blocks `images.unsplash.com` for direct requests, and the fetch tool errors on raw binary image responses — the URLs are correctly formed and came directly from Unsplash's live site moments before use, but you're the first one who can actually confirm they render.

**Creative treatment, not a plain stock-photo drop-in:** every photo goes through a `DuotonePhoto` component — desaturated, contrast-boosted, then tinted with one of Forma's own brand colors via CSS blend modes (`mix-blend-multiply`), so a stock photo from three different photographers reads as one consistent, branded treatment rather than three random unrelated images. The hero photo is paired with a floating stat card (styled like the app's real metric cards) overlapping its bottom edge — combining a real photograph with an authentic UI element in one composition, rather than choosing one or the other.

**Verified:** full typecheck (all 3 workspaces) and production build succeed. Re-ran the full 19-test backend suite — unaffected, still 19/19.
