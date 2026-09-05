-- Mirrorball Madness — core schema
-- Postgres / Supabase. Single active season for v1 (no season table).
-- RLS is enabled on every table (via the project's "automatic RLS" setting); policies
-- are added incrementally as each feature needs them, rather than all upfront.
--
-- "Automatically expose new tables" is OFF for this project, so Postgres grants to
-- anon/authenticated are also added incrementally per table (grants gate access before
-- RLS is even evaluated). service_role is the exception: it already bypasses RLS by
-- design, so it gets blanket table privileges below rather than per-table grants.

grant all on all tables in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;

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

-- ============================================================
-- Auth: auto-create a profile row for every new auth.users row
-- ============================================================

-- display_name comes from our own email/password sign-up form; full_name/name/avatar_url
-- are what Google OAuth populates instead, so both sources are checked.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A manager needs to read/update their own profile (e.g. the header, account
-- settings). Broader visibility (e.g. to fellow league members) is added in
-- Phase 2 alongside league_members policies.
grant select, update on public.profiles to authenticated;

create policy "profiles are viewable by the owner"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles are updatable by the owner"
on public.profiles for update
using (auth.uid() = id);

-- ============================================================
-- Leagues: writes go through SECURITY DEFINER functions (so the caller can't
-- forge a commissioner role or skip generating a real invite code); reads are
-- scoped by RLS to leagues/members the caller actually belongs to.
-- ============================================================

create function public.create_league(p_name text)
returns public.leagues
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I/L to avoid ambiguity
  v_code text;
  v_i int;
begin
  if trim(p_name) = '' then
    raise exception 'League name is required';
  end if;

  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.leagues where invite_code = v_code);
  end loop;

  insert into public.leagues (name, invite_code, commissioner_id)
  values (trim(p_name), v_code, auth.uid())
  returning * into v_league;

  insert into public.league_members (league_id, user_id, role)
  values (v_league.id, auth.uid(), 'commissioner');

  insert into public.scoring_settings (league_id)
  values (v_league.id);

  return v_league;
end;
$$;

create function public.join_league(p_invite_code text)
returns public.leagues
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
begin
  select * into v_league
  from public.leagues
  where invite_code = trim(upper(p_invite_code));

  if not found then
    raise exception 'Invite code not found';
  end if;

  insert into public.league_members (league_id, user_id, role)
  values (v_league.id, auth.uid(), 'manager')
  on conflict (league_id, user_id) do nothing;

  return v_league;
end;
$$;

revoke execute on function public.create_league(text) from public;
revoke execute on function public.join_league(text) from public;
grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text) to authenticated;

grant select on public.leagues to authenticated;
grant select on public.league_members to authenticated;

-- A league_members policy can't query league_members directly — Postgres treats
-- any self-reference in a table's own RLS policy as recursion and refuses it,
-- even when the predicate would terminate. Routing the check through a
-- SECURITY DEFINER function sidesteps this: the function's internal query runs
-- with RLS bypassed, so there's nothing left to recurse into.
create function public.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

create policy "leagues are viewable by members"
on public.leagues for select
using (public.is_league_member(id));

create policy "league members are viewable by fellow members"
on public.league_members for select
using (public.is_league_member(league_id));

-- Broadens the Phase 1 "owner only" profiles policy: a member list needs to
-- show fellow members' display names, not just your own.
create policy "profiles are viewable by fellow league members"
on public.profiles for select
using (
  exists (
    select 1 from public.league_members lm1
    join public.league_members lm2 on lm1.league_id = lm2.league_id
    where lm1.user_id = auth.uid() and lm2.user_id = profiles.id
  )
);
