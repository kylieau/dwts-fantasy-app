import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StandingsTable } from "@/components/standings-table";
import { RosterCard } from "@/components/roster-card";
import { PickEmBox } from "@/components/pick-em-box";
import { GrandFinaleBox } from "@/components/grand-finale-box";
import { HomeDashboard } from "@/components/home-dashboard";
import { LeagueHeader } from "@/components/league-header";
import { LeagueTabs } from "@/components/league-tabs";
import { WeeklyResultsView } from "@/components/weekly-results-view";
import { buildCoupleDisplayNames, formatCoupleName } from "@/lib/couple-display";
import { getStandingMessage } from "@/lib/standings-message";

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string; justCreated?: string }>;
}) {
  const { id } = await params;
  const { error, message, justCreated } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase.from("leagues").select("*").eq("id", id).single();

  if (!league) {
    notFound();
  }

  const { data: scoringSettings } = await supabase
    .from("scoring_settings")
    .select("*")
    .eq("league_id", id)
    .single();

  const isCommissioner = league.commissioner_id === user.id;

  const danceCardOn = scoringSettings?.judges_score_category_enabled ?? true;
  const curtainCallOn = scoringSettings?.eliminations_category_enabled ?? true;
  const grandFinaleOn = scoringSettings?.bonus_picks_category_enabled ?? false;
  const grandFinaleDeadline = scoringSettings?.bonus_picks_deadline ?? null;
  const grandFinaleLocked = !!grandFinaleDeadline && new Date() >= new Date(grandFinaleDeadline);

  const [{ data: members }, { data: allScores }, { data: rosterSlots }, { data: allCouples }, { data: upcomingEpisode }] =
    await Promise.all([
      supabase
        .from("league_members")
        .select("user_id, role, joined_at, profiles(display_name)")
        .eq("league_id", id)
        .order("joined_at"),
      supabase
        .from("weekly_manager_scores")
        .select("episode_id, manager_id, roster_points, prediction_points, grand_finale_points, total_points")
        .eq("league_id", id),
      supabase
        .from("roster_slots")
        .select(
          "couple_id, couples(status, celebrity:people!couples_celebrity_id_fkey(name), pro:people!couples_pro_id_fkey(name))"
        )
        .eq("league_id", id)
        .eq("manager_id", user.id),
      supabase
        .from("couples")
        .select(
          "id, status, season_id, elimination_week, celebrity:people!couples_celebrity_id_fkey(name), pro:people!couples_pro_id_fkey(name)"
        ),
      supabase
        .from("episodes")
        .select("id, week_number, airs_at")
        .eq("status", "upcoming")
        .order("week_number", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const { data: activeSeasonId } = await supabase.rpc("active_season_id");
  const [
    { data: premiereEpisode },
    { data: completedEpisodes },
    { data: danceScores },
    { data: judgeScores },
    { data: episodeResults },
    { data: judges },
    { data: danceStyles },
  ] = await Promise.all([
    supabase
      .from("episodes")
      .select("airs_at")
      .eq("season_id", activeSeasonId ?? "")
      .eq("week_number", 1)
      .maybeSingle(),
    supabase
      .from("episodes")
      .select("id, week_number, airs_at, theme, is_finale")
      .eq("season_id", activeSeasonId ?? "")
      .eq("status", "completed")
      .order("week_number", { ascending: false }),
    supabase.from("dance_scores").select("id, episode_id, couple_id, dance_style_id, total_score"),
    supabase.from("judge_scores").select("dance_score_id, judge_id, score"),
    supabase
      .from("episode_results")
      .select(
        "episode_id, couple_id, outcome, was_bottom_two, was_bottom_three, saved_by_judges, was_team_dance, had_immunity, bonus_points, bonus_note"
      ),
    supabase.from("people").select("id, name").eq("role", "judge").order("name"),
    supabase.from("dance_styles").select("id, name").order("name"),
  ]);

  const pointsByManager = new Map<string, number>();
  const rosterPointsByManager = new Map<string, number>();
  const predictionPointsByManager = new Map<string, number>();
  const grandFinalePointsByManager = new Map<string, number>();
  const scoresByEpisode: Record<
    string,
    { managerId: string; rosterPoints: number; predictionPoints: number; grandFinalePoints: number; totalPoints: number }[]
  > = {};
  for (const row of allScores ?? []) {
    pointsByManager.set(row.manager_id, (pointsByManager.get(row.manager_id) ?? 0) + row.total_points);
    rosterPointsByManager.set(row.manager_id, (rosterPointsByManager.get(row.manager_id) ?? 0) + row.roster_points);
    predictionPointsByManager.set(
      row.manager_id,
      (predictionPointsByManager.get(row.manager_id) ?? 0) + row.prediction_points
    );
    grandFinalePointsByManager.set(
      row.manager_id,
      (grandFinalePointsByManager.get(row.manager_id) ?? 0) + row.grand_finale_points
    );
    (scoresByEpisode[row.episode_id] ??= []).push({
      managerId: row.manager_id,
      rosterPoints: row.roster_points,
      predictionPoints: row.prediction_points,
      grandFinalePoints: row.grand_finale_points,
      totalPoints: row.total_points,
    });
  }

  const standings = (members ?? []).map((m) => ({
    managerId: m.user_id,
    displayName: m.profiles?.display_name ?? "Unknown",
    totalPoints: pointsByManager.get(m.user_id) ?? 0,
  }));

  const nameByManager = Object.fromEntries(
    (members ?? []).map((m) => [m.user_id, m.profiles?.display_name ?? "Unknown"])
  );

  const rank = Math.max(
    1,
    [...standings].sort((a, b) => b.totalPoints - a.totalPoints).findIndex((s) => s.managerId === user.id) + 1
  );

  const userPoints = pointsByManager.get(user.id) ?? 0;
  const pointTotals = standings.map((s) => s.totalPoints);
  const maxPoints = Math.max(...pointTotals);
  const minPoints = Math.min(...pointTotals);
  const isTiedForFirst = userPoints === maxPoints && pointTotals.filter((p) => p === maxPoints).length > 1;
  const isTiedForLast =
    !isTiedForFirst && userPoints === minPoints && pointTotals.filter((p) => p === minPoints).length > 1;

  const standingMessage = getStandingMessage({
    rank,
    totalMembers: standings.length,
    isTiedForFirst,
    isTiedForLast,
    isPreSeason: (allScores ?? []).length === 0,
  });

  const flatCouples = (allCouples ?? []).map((c) => ({
    id: c.id,
    status: c.status,
    season_id: c.season_id,
    elimination_week: c.elimination_week,
    celebrity_name: c.celebrity?.name ?? "Unknown",
    pro_name: c.pro?.name ?? "Unknown",
  }));

  const activeCouples = flatCouples.filter(
    (c) => c.status === "active" && c.season_id === activeSeasonId
  );
  const seasonCouples = flatCouples.filter((c) => c.season_id === activeSeasonId);
  // Historical lookups (roster, revealed predictions) span every couple this
  // league has ever touched; the Pick 'Em picker is scoped to just the couples
  // actually offered, so collisions are checked against that pool specifically.
  const allDisplayNames = buildCoupleDisplayNames(flatCouples);
  const activeDisplayNames = buildCoupleDisplayNames(activeCouples);

  let isLocked = false;
  let lockAt: string | null = null;
  let ownPrediction = null;
  let revealedPredictions:
    | { displayName: string; eliminatedLabel: string | null; topScorerLabel: string | null }[]
    | undefined;

  if (upcomingEpisode && curtainCallOn) {
    const { data: computedLockAt } = await supabase.rpc("prediction_lock_at", {
      p_league_id: id,
      p_episode_id: upcomingEpisode.id,
    });
    lockAt = computedLockAt;
    isLocked = !!lockAt && new Date() >= new Date(lockAt);

    const { data } = await supabase
      .from("predictions")
      .select("predicted_eliminated_couple_id, predicted_top_scorer_couple_id")
      .eq("league_id", id)
      .eq("episode_id", upcomingEpisode.id)
      .eq("manager_id", user.id)
      .maybeSingle();
    ownPrediction = data;

    if (isLocked) {
      const { data: allPredictions } = await supabase
        .from("predictions")
        .select("manager_id, predicted_eliminated_couple_id, predicted_top_scorer_couple_id")
        .eq("league_id", id)
        .eq("episode_id", upcomingEpisode.id);

      revealedPredictions = (allPredictions ?? []).map((p) => {
        const eliminatedParts = p.predicted_eliminated_couple_id
          ? allDisplayNames.get(p.predicted_eliminated_couple_id)
          : undefined;
        const topScorerParts = p.predicted_top_scorer_couple_id
          ? allDisplayNames.get(p.predicted_top_scorer_couple_id)
          : undefined;
        return {
          displayName: nameByManager[p.manager_id] ?? "Unknown",
          eliminatedLabel: eliminatedParts ? formatCoupleName(eliminatedParts) : null,
          topScorerLabel: topScorerParts ? formatCoupleName(topScorerParts) : null,
        };
      });
    }
  }

  let grandFinaleOrder: string[] | null = null;
  if (grandFinaleOn) {
    const { data: ownGrandFinalePicks } = await supabase
      .from("grand_finale_predictions")
      .select("couple_id, predicted_position")
      .eq("league_id", id)
      .eq("manager_id", user.id)
      .order("predicted_position", { ascending: true });
    grandFinaleOrder = ownGrandFinalePicks && ownGrandFinalePicks.length > 0
      ? ownGrandFinalePicks.map((p) => p.couple_id)
      : null;
  }

  const picksNeeded =
    (curtainCallOn && !!upcomingEpisode && !isLocked && !ownPrediction) ||
    (grandFinaleOn && !grandFinaleLocked && !grandFinaleOrder);

  const deadlineCandidates: { label: string; iso: string }[] = [];
  if (curtainCallOn && lockAt && new Date(lockAt) > new Date()) {
    deadlineCandidates.push({ label: "Curtain Call", iso: lockAt });
  }
  if (grandFinaleOn && grandFinaleDeadline && new Date(grandFinaleDeadline) > new Date()) {
    deadlineCandidates.push({ label: "Grand Finale", iso: grandFinaleDeadline });
  }
  deadlineCandidates.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
  const nextDeadline = deadlineCandidates[0] ?? null;

  const categoryBreakdown = (
    [
      danceCardOn && {
        label: "Dance Card",
        points: Math.round(
          (rosterPointsByManager.get(user.id) ?? 0) * (scoringSettings?.judges_score_category_weight ?? 1)
        ),
      },
      curtainCallOn && {
        label: "Curtain Call",
        points: Math.round(
          (predictionPointsByManager.get(user.id) ?? 0) * (scoringSettings?.eliminations_category_weight ?? 1)
        ),
      },
      grandFinaleOn && {
        label: "Grand Finale",
        points: Math.round(
          (grandFinalePointsByManager.get(user.id) ?? 0) * (scoringSettings?.bonus_picks_category_weight ?? 1)
        ),
      },
    ] as const
  ).filter((c): c is { label: string; points: number } => !!c);

  const rosterCouples = (rosterSlots ?? [])
    .filter((r) => r.couples)
    .map((r) => ({
      ...(allDisplayNames.get(r.couple_id!) ?? {
        celebrity: r.couples!.celebrity?.name ?? "Unknown",
        pro: r.couples!.pro?.name ?? "Unknown",
      }),
      status: r.couples!.status,
    }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <Link href="/leagues" className="text-sm text-muted-foreground hover:text-foreground">
        ‹ Leagues
      </Link>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <LeagueHeader
        leagueId={id}
        leagueName={league.name}
        inviteCode={league.invite_code}
        danceCardOn={danceCardOn}
        waiversOn={league.waiver_mode === "waivers"}
        league={league}
        scoringSettings={scoringSettings}
        canEdit={isCommissioner}
        premiereAirsAt={premiereEpisode?.airs_at ?? null}
        justCreated={justCreated === "1"}
        scoringConfigured={scoringSettings?.scoring_configured ?? true}
      />

      <LeagueTabs
        home={
          <HomeDashboard
            standingMessage={standingMessage}
            picksNeeded={picksNeeded}
            categoryBreakdown={categoryBreakdown}
            nextDeadline={nextDeadline}
          />
        }
        yourPicks={
          <div className="flex flex-col gap-6">
            {curtainCallOn && (
              <PickEmBox
                leagueId={id}
                episode={upcomingEpisode ?? null}
                lockAt={lockAt}
                activeCouples={activeCouples}
                coupleDisplayNames={Object.fromEntries(activeDisplayNames)}
                existingPrediction={ownPrediction}
                isLocked={isLocked}
                revealedPredictions={revealedPredictions}
              />
            )}
            {danceCardOn &&
              (rosterCouples.length > 0 ? (
                <RosterCard couples={rosterCouples} totalPoints={pointsByManager.get(user.id) ?? 0} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Roster</CardTitle>
                    <CardDescription>No roster yet — check the draft room.</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            {grandFinaleOn && (
              <GrandFinaleBox
                leagueId={id}
                couples={seasonCouples}
                coupleDisplayNames={Object.fromEntries(allDisplayNames)}
                existingOrder={grandFinaleOrder}
                deadline={grandFinaleDeadline}
                isLocked={grandFinaleLocked}
              />
            )}
            {!curtainCallOn && !danceCardOn && !grandFinaleOn && (
              <Card>
                <CardHeader>
                  <CardTitle>No scoring modules are on</CardTitle>
                  <CardDescription>
                    This league hasn&apos;t turned on Dance Card, Curtain Call, or Grand Finale yet — there&apos;s
                    nothing to pick. Ask your commissioner to enable one in League Settings.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        }
        thisWeek={
          <WeeklyResultsView
            episodes={completedEpisodes ?? []}
            episodeResults={episodeResults ?? []}
            danceScores={danceScores ?? []}
            judgeScores={judgeScores ?? []}
            judges={judges ?? []}
            danceStyles={danceStyles ?? []}
            couples={flatCouples}
            coupleDisplayNames={Object.fromEntries(allDisplayNames)}
            nameByManager={nameByManager}
            scoresByEpisode={scoresByEpisode}
            danceCardOn={danceCardOn}
            curtainCallOn={curtainCallOn}
            grandFinaleOn={grandFinaleOn}
          />
        }
        standings={
          <div className="flex flex-col gap-6">
            <StandingsTable standings={standings} />
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>{members?.length ?? 0} joined</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {members?.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{m.profiles?.display_name}</span>
                    <span className="capitalize text-muted-foreground">{m.role}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        }
      />
    </div>
  );
}
