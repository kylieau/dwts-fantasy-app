-- Mirrorball Madness — core schema
-- Postgres / Supabase. Single active season for v1 (no season table).
-- RLS policies are added separately once auth flows are built; this file is structure only.

create extension if not exists "pgcrypto";

-- ============================================================
-- Users
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_super_admin boolean not null default false, -- global results-entry admin
  created_at timestamptz not null default now()
);

-- ============================================================
-- Leagues
-- ============================================================

create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique, -- 6-char code
  commissioner_id uuid not null references profiles(id),
  roster_size int not null default 3 check (roster_size > 0),
  waiver_mode text not null default 'locked' check (waiver_mode in ('locked', 'waivers')),
  waiver_claim_method text check (waiver_claim_method in ('reverse_standings', 'fcfs', 'manual')),
  draft_scheduled_at timestamptz,
  pick_time_limit_seconds int not null default 90,
  draft_status text not null default 'not_started' check (draft_status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),

  constraint waiver_method_required check (
    (waiver_mode = 'locked' and waiver_claim_method is null) or
    (waiver_mode = 'waivers' and waiver_claim_method is not null)
  )
);

create table league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references profiles(id),
  role text not null default 'manager' check (role in ('commissioner', 'manager')),
  draft_position int, -- assigned when draft order is set
  joined_at timestamptz not null default now(),
  unique (league_id, user_id),
  unique (league_id, draft_position)
);

create table scoring_settings (
  league_id uuid primary key references leagues(id) on delete cascade,
  judges_score_multiplier numeric not null default 1.0,
  survival_points numeric not null default 15,
  elimination_prediction_points numeric not null default 30, -- 0 disables
  top_scorer_prediction_points numeric not null default 20, -- 0 disables
  first_place_points numeric not null default 150,
  second_place_points numeric not null default 75,
  third_place_points numeric not null default 40
);

-- ============================================================
-- Couples (global for the active season)
-- ============================================================

create table couples (
  id uuid primary key default gen_random_uuid(),
  celebrity_name text not null,
  pro_name text not null,
  celebrity_photo_url text,
  pro_photo_url text,
  status text not null default 'active' check (status in ('active', 'eliminated', 'winner', 'runner_up', 'third_place')),
  elimination_week int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Draft
-- ============================================================

create table draft_picks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  couple_id uuid not null references couples(id),
  manager_id uuid not null references profiles(id),
  round int not null,
  pick_number int not null, -- overall pick number within the draft
  picked_at timestamptz not null default now(),
  unique (league_id, couple_id),
  unique (league_id, pick_number)
);

-- ============================================================
-- Roster ownership timeline (seeded from draft_picks, mutated by waivers)
-- This is the source of truth scoring and waiver eligibility query against.
-- ============================================================

create table roster_slots (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  manager_id uuid not null references profiles(id),
  slot_number int not null, -- 1..roster_size
  couple_id uuid references couples(id), -- null = open slot
  source text not null check (source in ('draft', 'waiver')),
  start_week int not null,
  end_week int, -- set when this couple is eliminated and the slot is later refilled
  unique (league_id, manager_id, slot_number, start_week)
);

create table waiver_claims (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  couple_id uuid not null references couples(id),
  manager_id uuid not null references profiles(id),
  slot_number int not null,
  week_number int not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  priority_order int, -- resolved at claim time per league's waiver_claim_method
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ============================================================
-- Episodes / weekly results
-- ============================================================

create table episodes (
  id uuid primary key default gen_random_uuid(),
  week_number int not null unique,
  air_date date not null,
  locks_at timestamptz not null, -- Tuesday showtime prediction lock
  is_elimination_week boolean not null default true,
  is_finale boolean not null default false,
  status text not null default 'upcoming' check (status in ('upcoming', 'locked', 'completed'))
);

-- One row per couple per dance, so multi-dance weeks (finals, team dances) just add rows.
create table dance_scores (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  couple_id uuid not null references couples(id),
  dance_name text,
  total_score numeric not null, -- e.g. 24 for 24/30
  judge_breakdown jsonb, -- optional per-judge detail
  created_at timestamptz not null default now()
);

-- Per-couple outcome per episode. Supports double-elimination weeks and
-- judges'-save history (bottom_two flag set first, saved_by_judges set once resolved).
create table episode_results (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  couple_id uuid not null references couples(id),
  outcome text not null check (outcome in ('safe', 'eliminated', 'winner', 'runner_up', 'third_place')),
  was_bottom_two boolean not null default false,
  saved_by_judges boolean not null default false,
  unique (episode_id, couple_id)
);

-- ============================================================
-- Weekly Pick 'Em predictions
-- ============================================================

create table predictions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  manager_id uuid not null references profiles(id),
  episode_id uuid not null references episodes(id),
  predicted_eliminated_couple_id uuid references couples(id),
  predicted_top_scorer_couple_id uuid references couples(id),
  submitted_at timestamptz not null default now(),
  unique (league_id, manager_id, episode_id)
);

-- ============================================================
-- Cached weekly + cumulative scores (recomputed on admin results entry)
-- ============================================================

create table weekly_manager_scores (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  manager_id uuid not null references profiles(id),
  episode_id uuid not null references episodes(id),
  roster_points numeric not null default 0,
  prediction_points numeric not null default 0,
  total_points numeric not null default 0,
  computed_at timestamptz not null default now(),
  unique (league_id, manager_id, episode_id)
);

-- ============================================================
-- Indexes for common lookups
-- ============================================================

create index idx_league_members_user on league_members(user_id);
create index idx_roster_slots_league_manager on roster_slots(league_id, manager_id);
create index idx_roster_slots_open on roster_slots(league_id) where couple_id is null;
create index idx_dance_scores_episode_couple on dance_scores(episode_id, couple_id);
create index idx_predictions_league_episode on predictions(league_id, episode_id);
create index idx_weekly_scores_league_episode on weekly_manager_scores(league_id, episode_id);
