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
--
-- UPDATE is column-restricted, not blanket: the "owner" policy below only
-- checks row ownership (auth.uid() = id), so a blanket UPDATE grant would let
-- any user set is_super_admin = true on themselves directly through the
-- profiles table — this was live in production and self-confirmed exploitable
-- before being caught in the Phase 8 security review. display_name/avatar_url
-- are the only columns a user should ever be able to set on their own row.
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

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

revoke execute on function public.is_league_member(uuid) from public;
grant execute on function public.is_league_member(uuid) to authenticated;

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

-- ============================================================
-- Commissioner settings: same SECURITY DEFINER write pattern as
-- create_league/join_league, so the commissioner check lives in one place
-- (the function) instead of relying on RLS column-level tricks or the client
-- honestly only sending the fields the UI shows.
-- ============================================================

grant select on public.scoring_settings to authenticated;

create policy "scoring settings are viewable by league members"
on public.scoring_settings for select
using (public.is_league_member(league_id));

-- roster_size is NOT settable here — it's derived from couples-count /
-- member-count and only ever set by start_draft, once the member list (and
-- therefore the even split) is locked in.
create function public.update_league_settings(
  p_league_id uuid,
  p_waiver_mode text,
  p_waiver_claim_method text,
  p_pick_time_limit_seconds int
)
returns public.leagues
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
begin
  update public.leagues
  set
    waiver_mode = p_waiver_mode,
    waiver_claim_method = p_waiver_claim_method,
    pick_time_limit_seconds = p_pick_time_limit_seconds
  where id = p_league_id and commissioner_id = auth.uid()
  returning * into v_league;

  if not found then
    raise exception 'Only the commissioner can update league settings';
  end if;

  return v_league;
end;
$$;

create function public.update_scoring_settings(
  p_league_id uuid,
  p_judges_score_multiplier numeric,
  p_survival_points numeric,
  p_elimination_prediction_points numeric,
  p_top_scorer_prediction_points numeric,
  p_first_place_points numeric,
  p_second_place_points numeric,
  p_third_place_points numeric
)
returns public.scoring_settings
language plpgsql
security definer set search_path = ''
as $$
declare
  v_settings public.scoring_settings;
begin
  update public.scoring_settings
  set
    judges_score_multiplier = p_judges_score_multiplier,
    survival_points = p_survival_points,
    elimination_prediction_points = p_elimination_prediction_points,
    top_scorer_prediction_points = p_top_scorer_prediction_points,
    first_place_points = p_first_place_points,
    second_place_points = p_second_place_points,
    third_place_points = p_third_place_points
  where league_id = p_league_id
    and exists (
      select 1 from public.leagues
      where id = p_league_id and commissioner_id = auth.uid()
    )
  returning * into v_settings;

  if not found then
    raise exception 'Only the commissioner can update scoring settings';
  end if;

  return v_settings;
end;
$$;

revoke execute on function public.update_league_settings(uuid, text, text, int) from public;
revoke execute on function public.update_scoring_settings(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric) from public;
grant execute on function public.update_league_settings(uuid, text, text, int) to authenticated;
grant execute on function public.update_scoring_settings(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric) to authenticated;

-- ============================================================
-- Draft: couples are global read-only reference data; starting the draft and
-- making picks are SECURITY DEFINER functions so turn order, one-couple-per-
-- league uniqueness, and completion/roster-seeding are enforced server-side —
-- a client can't skip its turn or claim an already-picked couple by racing
-- the UI, since the server recomputes whose turn it is from the pick count
-- every call (under a row lock on the league, to close the race between two
-- simultaneous picks).
-- ============================================================

grant select on public.couples to authenticated;

create policy "couples are viewable by all authenticated users"
on public.couples for select
using (true);

grant select on public.draft_picks to authenticated;

create policy "draft picks are viewable by league members"
on public.draft_picks for select
using (public.is_league_member(league_id));

-- Sets (or overwrites) the full draft order before the draft starts. The
-- client always calls this before start_draft — including for the "random"
-- case, where the client just shuffles the list itself and submits that —
-- so start_draft has a single, simple precondition: every member already has
-- a position.
create function public.set_draft_order(p_league_id uuid, p_ordered_user_ids uuid[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
  v_member_count int;
  v_distinct_count int;
  v_user_id uuid;
  v_position int := 1;
begin
  select * into v_league from public.leagues where id = p_league_id for update;

  if not found or v_league.commissioner_id <> auth.uid() then
    raise exception 'Only the commissioner can set the draft order';
  end if;

  if v_league.draft_status <> 'not_started' then
    raise exception 'Draft order can only be set before the draft starts';
  end if;

  select count(*) into v_member_count from public.league_members where league_id = p_league_id;
  select count(distinct u) into v_distinct_count from unnest(p_ordered_user_ids) as u;

  if array_length(p_ordered_user_ids, 1) is distinct from v_member_count
     or v_distinct_count is distinct from v_member_count then
    raise exception 'Order must include every league member exactly once';
  end if;

  if exists (
    select 1 from unnest(p_ordered_user_ids) as u
    where not exists (
      select 1 from public.league_members lm
      where lm.league_id = p_league_id and lm.user_id = u
    )
  ) then
    raise exception 'Order includes someone who is not a member of this league';
  end if;

  foreach v_user_id in array p_ordered_user_ids loop
    update public.league_members
    set draft_position = v_position
    where league_id = p_league_id and user_id = v_user_id;
    v_position := v_position + 1;
  end loop;
end;
$$;

create function public.start_draft(p_league_id uuid)
returns public.leagues
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
  v_member_count int;
  v_couple_count int;
begin
  select * into v_league from public.leagues where id = p_league_id for update;

  if not found or v_league.commissioner_id <> auth.uid() then
    raise exception 'Only the commissioner can start the draft';
  end if;

  if v_league.draft_status <> 'not_started' then
    raise exception 'Draft has already been started';
  end if;

  select count(*) into v_member_count from public.league_members where league_id = p_league_id;
  if v_member_count < 2 then
    raise exception 'Need at least 2 members to start the draft';
  end if;

  if exists (
    select 1 from public.league_members
    where league_id = p_league_id and draft_position is null
  ) then
    raise exception 'Draft order has not been set for all members yet';
  end if;

  select count(*) into v_couple_count from public.couples;
  if v_member_count > v_couple_count then
    raise exception 'Not enough couples for every member to get at least one';
  end if;

  -- roster_size is the even split (integer division), computed here rather
  -- than commissioner-set. Any remainder couples are left undrafted for the
  -- season rather than handed out unevenly.
  update public.leagues
  set draft_status = 'in_progress', roster_size = v_couple_count / v_member_count
  where id = p_league_id
  returning * into v_league;

  return v_league;
end;
$$;

revoke execute on function public.set_draft_order(uuid, uuid[]) from public;
grant execute on function public.set_draft_order(uuid, uuid[]) to authenticated;

create function public.make_draft_pick(p_league_id uuid, p_couple_id uuid)
returns public.draft_picks
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
  v_member_count int;
  v_total_slots int;
  v_next_pick int;
  v_round int;
  v_position_in_round int;
  v_draft_position_needed int;
  v_expected_manager uuid;
  v_pick public.draft_picks;
begin
  select * into v_league from public.leagues where id = p_league_id for update;

  if not found then
    raise exception 'League not found';
  end if;

  if v_league.draft_status <> 'in_progress' then
    raise exception 'Draft is not in progress';
  end if;

  select count(*) into v_member_count from public.league_members where league_id = p_league_id;
  v_total_slots := v_member_count * v_league.roster_size;
  v_next_pick := (select count(*) from public.draft_picks where league_id = p_league_id) + 1;

  if v_next_pick > v_total_slots then
    raise exception 'Draft is already complete';
  end if;

  v_round := ((v_next_pick - 1) / v_member_count) + 1;
  v_position_in_round := v_next_pick - (v_round - 1) * v_member_count;

  -- Snake order: odd rounds go 1..N, even rounds go N..1.
  if v_round % 2 = 1 then
    v_draft_position_needed := v_position_in_round;
  else
    v_draft_position_needed := v_member_count - v_position_in_round + 1;
  end if;

  select user_id into v_expected_manager
  from public.league_members
  where league_id = p_league_id and draft_position = v_draft_position_needed;

  if v_expected_manager is null or v_expected_manager <> auth.uid() then
    raise exception 'It is not your turn to pick';
  end if;

  if exists (select 1 from public.draft_picks where league_id = p_league_id and couple_id = p_couple_id) then
    raise exception 'That couple has already been drafted';
  end if;

  insert into public.draft_picks (league_id, couple_id, manager_id, round, pick_number)
  values (p_league_id, p_couple_id, auth.uid(), v_round, v_next_pick)
  returning * into v_pick;

  if v_next_pick = v_total_slots then
    update public.leagues set draft_status = 'completed' where id = p_league_id;

    insert into public.roster_slots (league_id, manager_id, slot_number, couple_id, source, start_week)
    select league_id, manager_id, row_number() over (partition by manager_id order by pick_number), couple_id, 'draft', 1
    from public.draft_picks
    where league_id = p_league_id;
  end if;

  return v_pick;
end;
$$;

revoke execute on function public.start_draft(uuid) from public;
revoke execute on function public.make_draft_pick(uuid, uuid) from public;
grant execute on function public.start_draft(uuid) to authenticated;
grant execute on function public.make_draft_pick(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.leagues;
alter publication supabase_realtime add table public.league_members;
alter publication supabase_realtime add table public.draft_picks;

-- ============================================================
-- Results entry: episodes/dance_scores/episode_results are global (like
-- couples) and readable by every authenticated user. weekly_manager_scores
-- is league-scoped like everything else in a league.
--
-- The actual write path (episodes, dance_scores, episode_results, couples
-- status, weekly_manager_scores) is NOT exposed via RLS/grants at all —
-- results entry is a cross-league admin operation (one submission recomputes
-- scores for every league that has relevant rosters/predictions), so it runs
-- server-side via the service_role key after checking profiles.is_super_admin
-- in application code, rather than through a SECURITY DEFINER function.
-- ============================================================

grant select on public.episodes to authenticated;
create policy "episodes are viewable by all authenticated users"
on public.episodes for select
using (true);

grant select on public.dance_scores to authenticated;
create policy "dance scores are viewable by all authenticated users"
on public.dance_scores for select
using (true);

grant select on public.episode_results to authenticated;
create policy "episode results are viewable by all authenticated users"
on public.episode_results for select
using (true);

grant select on public.weekly_manager_scores to authenticated;
create policy "weekly manager scores are viewable by league members"
on public.weekly_manager_scores for select
using (public.is_league_member(league_id));

-- ============================================================
-- Weekly Pick 'Em: submitting/updating a prediction is a SECURITY DEFINER
-- function (same shape as make_draft_pick) so the lock deadline is enforced
-- server-side, not just hidden in the UI. Reads are more specific than the
-- usual "viewable by league members" pattern: a manager's own pick is only
-- visible to them until the episode locks, then it's visible league-wide —
-- otherwise seeing a league-mate's elimination pick before lock would let you
-- just copy their guess.
-- ============================================================

grant select on public.predictions to authenticated;

create policy "predictions visible to owner pre-lock, league post-lock"
on public.predictions for select
using (
  public.is_league_member(league_id)
  and (
    auth.uid() = manager_id
    or exists (
      select 1 from public.episodes e
      where e.id = predictions.episode_id and now() >= e.locks_at
    )
  )
);

create function public.submit_prediction(
  p_league_id uuid,
  p_episode_id uuid,
  p_predicted_eliminated_couple_id uuid,
  p_predicted_top_scorer_couple_id uuid
)
returns public.predictions
language plpgsql
security definer set search_path = ''
as $$
declare
  v_locks_at timestamptz;
  v_prediction public.predictions;
begin
  if not public.is_league_member(p_league_id) then
    raise exception 'You are not a member of this league';
  end if;

  select locks_at into v_locks_at from public.episodes where id = p_episode_id;
  if not found then
    raise exception 'Episode not found';
  end if;

  if now() >= v_locks_at then
    raise exception 'Predictions are locked for this episode';
  end if;

  insert into public.predictions (
    league_id, manager_id, episode_id,
    predicted_eliminated_couple_id, predicted_top_scorer_couple_id
  )
  values (
    p_league_id, auth.uid(), p_episode_id,
    p_predicted_eliminated_couple_id, p_predicted_top_scorer_couple_id
  )
  on conflict (league_id, manager_id, episode_id) do update set
    predicted_eliminated_couple_id = excluded.predicted_eliminated_couple_id,
    predicted_top_scorer_couple_id = excluded.predicted_top_scorer_couple_id,
    submitted_at = now()
  returning * into v_prediction;

  return v_prediction;
end;
$$;

revoke execute on function public.submit_prediction(uuid, uuid, uuid, uuid) from public;
grant execute on function public.submit_prediction(uuid, uuid, uuid, uuid) to authenticated;

-- ============================================================
-- Waivers. roster_slots is a timeline: a slot's *current* occupancy is the
-- row with end_week is null; a slot is "open" when that current row's couple
-- has been eliminated. Claiming closes the old row (end_week = the claim's
-- week_number) and inserts a new one (source 'waiver', start_week = that
-- week + 1) — so the new couple starts scoring the following week, and nothing
-- ever needs a null couple_id.
--
-- grant select on roster_slots was missing entirely before this phase — the
-- Phase 6 roster card has been silently getting a permission-denied error
-- and rendering nothing, since its query result was never checked for error.
-- ============================================================

grant select on public.roster_slots to authenticated;
create policy "roster slots are viewable by league members"
on public.roster_slots for select
using (public.is_league_member(league_id));

drop index if exists idx_roster_slots_open;

grant select on public.waiver_claims to authenticated;
create policy "waiver claims are viewable by league members"
on public.waiver_claims for select
using (public.is_league_member(league_id));

-- Internal-only: does the actual roster swap + bookkeeping once a claim is
-- decided. No permission check of its own — every caller below has already
-- verified the caller is allowed to decide this claim before calling it.
create function public.finalize_waiver_claim(p_claim_id uuid)
returns public.waiver_claims
language plpgsql
security definer set search_path = ''
as $$
declare
  v_claim public.waiver_claims;
begin
  select * into v_claim from public.waiver_claims where id = p_claim_id for update;
  if not found then
    raise exception 'Waiver claim not found';
  end if;

  update public.roster_slots
  set end_week = v_claim.week_number
  where league_id = v_claim.league_id
    and manager_id = v_claim.manager_id
    and slot_number = v_claim.slot_number
    and end_week is null;

  insert into public.roster_slots (league_id, manager_id, slot_number, couple_id, source, start_week)
  values (v_claim.league_id, v_claim.manager_id, v_claim.slot_number, v_claim.couple_id, 'waiver', v_claim.week_number + 1);

  update public.waiver_claims
  set status = 'approved', resolved_at = now()
  where id = p_claim_id
  returning * into v_claim;

  -- Other pending claims for the same couple (lost the bidding) or the same
  -- manager+slot (can't fill one slot twice) are now moot.
  update public.waiver_claims
  set status = 'rejected', resolved_at = now()
  where id <> p_claim_id
    and status = 'pending'
    and league_id = v_claim.league_id
    and (
      couple_id = v_claim.couple_id
      or (manager_id = v_claim.manager_id and slot_number = v_claim.slot_number)
    );

  return v_claim;
end;
$$;

revoke execute on function public.finalize_waiver_claim(uuid) from public, authenticated;

create function public.submit_waiver_claim(
  p_league_id uuid,
  p_slot_number int,
  p_couple_id uuid
)
returns public.waiver_claims
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
  v_current_week int;
  v_claim public.waiver_claims;
begin
  if not public.is_league_member(p_league_id) then
    raise exception 'You are not a member of this league';
  end if;

  -- Locks the league for the rest of this call, serializing concurrent
  -- claims for the same league so two FCFS claims for the same couple can't
  -- both see it as "available" at once.
  select * into v_league from public.leagues where id = p_league_id for update;

  if v_league.waiver_mode <> 'waivers' then
    raise exception 'This league does not use waivers';
  end if;

  if not exists (
    select 1 from public.roster_slots rs
    join public.couples c on c.id = rs.couple_id
    where rs.league_id = p_league_id
      and rs.manager_id = auth.uid()
      and rs.slot_number = p_slot_number
      and rs.end_week is null
      and c.status = 'eliminated'
  ) then
    raise exception 'That slot is not open for a waiver claim';
  end if;

  if not exists (select 1 from public.couples where id = p_couple_id and status = 'active') then
    raise exception 'That couple is not available';
  end if;

  if exists (
    select 1 from public.roster_slots
    where league_id = p_league_id and couple_id = p_couple_id and end_week is null
  ) then
    raise exception 'That couple is already on a roster in this league';
  end if;

  v_current_week := coalesce((select max(week_number) from public.episodes where status = 'completed'), 0);

  insert into public.waiver_claims (league_id, couple_id, manager_id, slot_number, week_number, status)
  values (p_league_id, p_couple_id, auth.uid(), p_slot_number, v_current_week, 'pending')
  returning * into v_claim;

  -- FCFS resolves immediately; reverse_standings/manual stay pending for the
  -- commissioner to process (the other bidders for the same couple aren't
  -- known yet, so there's nothing to compare against right now).
  if v_league.waiver_claim_method = 'fcfs' then
    return public.finalize_waiver_claim(v_claim.id);
  end if;

  return v_claim;
end;
$$;

revoke execute on function public.submit_waiver_claim(uuid, int, uuid) from public;
grant execute on function public.submit_waiver_claim(uuid, int, uuid) to authenticated;

create function public.process_reverse_standings_waivers(p_league_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_league public.leagues;
  v_couple_id uuid;
  v_winning_claim_id uuid;
begin
  select * into v_league from public.leagues where id = p_league_id for update;

  if not found or v_league.commissioner_id <> auth.uid() then
    raise exception 'Only the commissioner can process waivers';
  end if;

  if v_league.waiver_claim_method <> 'reverse_standings' then
    raise exception 'This league does not use reverse-standings waivers';
  end if;

  for v_couple_id in
    select distinct couple_id from public.waiver_claims
    where league_id = p_league_id and status = 'pending'
  loop
    -- Lowest season total wins the couple; ties go to whoever claimed first.
    -- A couple's claims can already be gone by the time we get here (a
    -- manager's other pending claim for the same slot may have just been
    -- auto-rejected by finalize_waiver_claim earlier in this same loop).
    select wc.id into v_winning_claim_id
    from public.waiver_claims wc
    left join (
      select manager_id, coalesce(sum(total_points), 0) as points
      from public.weekly_manager_scores
      where league_id = p_league_id
      group by manager_id
    ) totals on totals.manager_id = wc.manager_id
    where wc.league_id = p_league_id and wc.couple_id = v_couple_id and wc.status = 'pending'
    order by coalesce(totals.points, 0) asc, wc.created_at asc
    limit 1;

    if v_winning_claim_id is not null then
      perform public.finalize_waiver_claim(v_winning_claim_id);
    end if;
  end loop;
end;
$$;

revoke execute on function public.process_reverse_standings_waivers(uuid) from public;
grant execute on function public.process_reverse_standings_waivers(uuid) to authenticated;

create function public.approve_waiver_claim(p_claim_id uuid)
returns public.waiver_claims
language plpgsql
security definer set search_path = ''
as $$
declare
  v_claim public.waiver_claims;
  v_league public.leagues;
begin
  select * into v_claim from public.waiver_claims where id = p_claim_id;
  if not found then
    raise exception 'Waiver claim not found';
  end if;

  select * into v_league from public.leagues where id = v_claim.league_id;
  if v_league.commissioner_id <> auth.uid() then
    raise exception 'Only the commissioner can approve waiver claims';
  end if;

  if v_claim.status <> 'pending' then
    raise exception 'This claim has already been resolved';
  end if;

  return public.finalize_waiver_claim(p_claim_id);
end;
$$;

create function public.reject_waiver_claim(p_claim_id uuid)
returns public.waiver_claims
language plpgsql
security definer set search_path = ''
as $$
declare
  v_claim public.waiver_claims;
  v_league public.leagues;
begin
  select * into v_claim from public.waiver_claims where id = p_claim_id;
  if not found then
    raise exception 'Waiver claim not found';
  end if;

  select * into v_league from public.leagues where id = v_claim.league_id;
  if v_league.commissioner_id <> auth.uid() then
    raise exception 'Only the commissioner can reject waiver claims';
  end if;

  update public.waiver_claims
  set status = 'rejected', resolved_at = now()
  where id = p_claim_id
  returning * into v_claim;

  return v_claim;
end;
$$;

revoke execute on function public.approve_waiver_claim(uuid) from public;
revoke execute on function public.reject_waiver_claim(uuid) from public;
grant execute on function public.approve_waiver_claim(uuid) to authenticated;
grant execute on function public.reject_waiver_claim(uuid) to authenticated;
