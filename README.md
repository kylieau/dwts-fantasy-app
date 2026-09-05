# Mirrorball Madness

A fantasy sports app for *Dancing with the Stars*, built for friends, watch parties, and online communities.

## Goals

- Let a group of friends run a season-long fantasy league around a real DWTS season with minimal manual bookkeeping.
- Support many independent leagues per user (office pool, family league, friend group) from a single account.
- Keep every league's rules commissioner-owned — scoring weights, roster size, and waiver behavior are configurable per league, not fixed defaults.
- Keep managers engaged even after an early elimination, via weekly predictions that run independently of roster survival.

## Core Features

- **Multi-league accounts** — one login, join or create any number of independent leagues via 6-character invite codes.
- **Live snake draft** — real-time draft room where managers take turns picking celebrity/pro couples; once picked, a couple is off the board for that league.
- **Customizable scoring** — judges' scores, survival bonus, podium bonus, and prediction bonuses are all commissioner-adjustable per league.
- **Weekly Pick 'Em** — every manager predicts the week's eliminated couple and top scorer before showtime lock, all season long.
- **Commissioner admin** — league setup, scoring configuration, roster size, and waiver rules.
- **Global results entry** — one admin form enters real judges' scores/eliminations per episode; results fan out and recompute standings across every league automatically.

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Shadcn UI · Supabase (Auth, Postgres, Realtime)

## Build Roadmap

Each milestone should be independently testable before moving to the next.

### Phase 1 — Foundation & Auth
- [x] Scaffold Next.js app (TypeScript, Tailwind, App Router, ESLint)
- [x] Write initial Postgres schema (`supabase/schema.sql`)
- [x] Configure dev container port forwarding for the local dev server
- [x] Create Supabase project and connect via env vars (`.env.local` + `.env.example`)
- [x] Apply schema to the Supabase project
- [x] Install and configure Shadcn UI
- [x] Install Supabase client libraries (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Build base app shell/layout with header
- [x] Implement email/password sign-up + sign-in
- [x] Implement Google OAuth sign-in
- [x] Auto-create a `profiles` row on new user sign-up
- [x] **Verify:** a new user can sign up, see their name in the header, sign out, and sign back in

### Phase 2 — Leagues & Multi-League Switcher
- [x] Build "Create League" form (name, generates unique 6-character invite code)
- [x] Build "Join League via Code" form
- [x] Insert `league_members` row on create/join; assign commissioner role to the creator
- [x] Build `/leagues` hub screen listing joined leagues
- [x] Build global league switcher dropdown in the header
- [x] Write RLS policies: users can only read leagues/members they belong to
- [x] **Verify:** two test accounts can create a league, join via code, and see each other in the member list

### Phase 3 — Commissioner Settings
- [ ] Build league settings form (roster size, waiver mode, waiver claim method, draft timer)
- [ ] Build scoring settings form (judges multiplier, survival points, prediction points, podium bonuses)
- [ ] Restrict the settings screen to the commissioner role
- [ ] Write RLS policies: only the commissioner can write `leagues`/`scoring_settings` for their league
- [ ] **Verify:** a non-commissioner manager can't access or edit settings; commissioner's changes persist and display correctly

### Phase 4 — Live Snake Draft
- [ ] Seed the `couples` table for the active season
- [ ] Assign draft order/position to league members
- [ ] Build draft room UI: available vs. drafted couples board
- [ ] Wire Supabase Realtime so picks broadcast live to all connected managers
- [ ] Build turn indicator with an automated per-pick timer
- [ ] Write `draft_picks` on each pick; enforce one-couple-per-league uniqueness
- [ ] Seed `roster_slots` from `draft_picks` when the draft completes
- [ ] **Verify:** two browsers in the same draft room see picks appear in real time, and an already-picked couple can't be picked again

### Phase 5 — Scoring Engine & Admin Results Entry
- [ ] Build admin results-entry form: dance scores per couple per episode (supports multiple dances)
- [ ] Build admin results-entry form: episode outcomes (safe / eliminated / bottom-two / saved / podium)
- [ ] Write the `computeWeeklyScores` pure function (roster points + survival + prediction matches + podium bonus)
- [ ] Unit test `computeWeeklyScores`: single dance, multi-dance week, judges'-save override, finale podium
- [ ] Wire results submission to populate `weekly_manager_scores` for every affected league
- [ ] **Verify:** submitting one week's results correctly updates point totals across two leagues with different custom scoring weights

### Phase 6 — Manager Dashboard & Pick 'Em
- [ ] Build team roster card (active + eliminated couples, cumulative points)
- [ ] Build live standings table (all managers, sorted by total points)
- [ ] Build the weekly Pick 'Em lock box (elimination + top scorer predictions)
- [ ] Enforce the prediction lock at `episodes.locks_at`
- [ ] Wire prediction resolution into the Phase 5 scoring engine
- [ ] **Verify:** a prediction submitted before lock resolves correctly after results are entered; a late submission is rejected

### Phase 7 — Waivers
- [ ] Detect open roster slots (couple eliminated, no waiver pickup yet)
- [ ] Build waiver claim submission UI
- [ ] Implement claim resolution per league's method (reverse standings / FCFS / manual)
- [ ] Update `roster_slots` on an approved claim
- [ ] **Verify:** in a waiver-enabled league, an open slot can be claimed and the new couple starts scoring for that manager the following week

### Phase 8 — Design Pass & Deploy
- [ ] Apply dark mode + gold accent (`#D4AF37`) theme across all screens
- [ ] Full mobile responsiveness pass on all four core screens
- [ ] Security review: confirm RLS policies cover every table and write path
- [ ] Deploy to Vercel and connect the production Supabase project
- [ ] **Verify:** full user journey (sign up → create league → draft → submit prediction → view results) works end-to-end in production
