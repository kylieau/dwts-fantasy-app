import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
import { buildCoupleDisplayNames, formatCoupleName } from "@/lib/couple-display";

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, invite_code, commissioner_id, waiver_mode")
    .eq("id", id)
    .single();

  if (!league) {
    notFound();
  }

  if (league.commissioner_id === user.id) {
    const { data: scoringSettings } = await supabase
      .from("scoring_settings")
      .select("scoring_configured")
      .eq("league_id", id)
      .single();

    if (scoringSettings && !scoringSettings.scoring_configured) {
      redirect(
        `/leagues/${id}/settings?message=${encodeURIComponent(
          "Review and save Scoring Categories to finish setting up your league"
        )}`
      );
    }
  }

  const [{ data: members }, { data: allScores }, { data: rosterSlots }, { data: allCouples }, { data: upcomingEpisode }] =
    await Promise.all([
      supabase
        .from("league_members")
        .select("user_id, role, joined_at, profiles(display_name)")
        .eq("league_id", id)
        .order("joined_at"),
      supabase.from("weekly_manager_scores").select("manager_id, total_points").eq("league_id", id),
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
          "id, status, season_id, celebrity:people!couples_celebrity_id_fkey(name), pro:people!couples_pro_id_fkey(name)"
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

  const pointsByManager = new Map<string, number>();
  for (const row of allScores ?? []) {
    pointsByManager.set(row.manager_id, (pointsByManager.get(row.manager_id) ?? 0) + row.total_points);
  }

  const standings = (members ?? []).map((m) => ({
    managerId: m.user_id,
    displayName: m.profiles?.display_name ?? "Unknown",
    totalPoints: pointsByManager.get(m.user_id) ?? 0,
  }));

  const flatCouples = (allCouples ?? []).map((c) => ({
    id: c.id,
    status: c.status,
    season_id: c.season_id,
    celebrity_name: c.celebrity?.name ?? "Unknown",
    pro_name: c.pro?.name ?? "Unknown",
  }));

  const activeCouples = flatCouples.filter(
    (c) => c.status === "active" && c.season_id === activeSeasonId
  );
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

  if (upcomingEpisode) {
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

      const nameByManager = new Map((members ?? []).map((m) => [m.user_id, m.profiles?.display_name ?? "Unknown"]));
      revealedPredictions = (allPredictions ?? []).map((p) => {
        const eliminatedParts = p.predicted_eliminated_couple_id
          ? allDisplayNames.get(p.predicted_eliminated_couple_id)
          : undefined;
        const topScorerParts = p.predicted_top_scorer_couple_id
          ? allDisplayNames.get(p.predicted_top_scorer_couple_id)
          : undefined;
        return {
          displayName: nameByManager.get(p.manager_id) ?? "Unknown",
          eliminatedLabel: eliminatedParts ? formatCoupleName(eliminatedParts) : null,
          topScorerLabel: topScorerParts ? formatCoupleName(topScorerParts) : null,
        };
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite code:{" "}
            <span className="font-mono font-medium text-foreground">
              {league.invite_code}
            </span>
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button render={<Link href={`/leagues/${id}/draft`} />} size="sm">
            Draft room
          </Button>
          {league.waiver_mode === "waivers" && (
            <Button render={<Link href={`/leagues/${id}/waivers`} />} variant="outline" size="sm">
              Waivers
            </Button>
          )}
          {league.commissioner_id === user.id && (
            <Button render={<Link href={`/leagues/${id}/settings`} />} variant="outline" size="sm">
              Settings
            </Button>
          )}
        </div>
      </div>

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

      <StandingsTable standings={standings} />

      {rosterSlots && rosterSlots.length > 0 && (
        <RosterCard
          couples={rosterSlots
            .filter((r) => r.couples)
            .map((r) => ({
              ...(allDisplayNames.get(r.couple_id!) ?? {
                celebrity: r.couples!.celebrity?.name ?? "Unknown",
                pro: r.couples!.pro?.name ?? "Unknown",
              }),
              status: r.couples!.status,
            }))}
          totalPoints={pointsByManager.get(user.id) ?? 0}
        />
      )}

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
  );
}
