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
        .select("couple_id, couples(celebrity_name, pro_name, status)")
        .eq("league_id", id)
        .eq("manager_id", user.id),
      supabase.from("couples").select("id, celebrity_name, pro_name, status").order("celebrity_name"),
      supabase
        .from("episodes")
        .select("id, week_number, locks_at")
        .eq("status", "upcoming")
        .order("week_number", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const pointsByManager = new Map<string, number>();
  for (const row of allScores ?? []) {
    pointsByManager.set(row.manager_id, (pointsByManager.get(row.manager_id) ?? 0) + row.total_points);
  }

  const standings = (members ?? []).map((m) => ({
    managerId: m.user_id,
    displayName: m.profiles?.display_name ?? "Unknown",
    totalPoints: pointsByManager.get(m.user_id) ?? 0,
  }));

  const couplesById = new Map((allCouples ?? []).map((c) => [c.id, c]));
  const activeCouples = (allCouples ?? []).filter((c) => c.status === "active");

  let isLocked = false;
  let ownPrediction = null;
  let revealedPredictions:
    | { displayName: string; eliminatedLabel: string | null; topScorerLabel: string | null }[]
    | undefined;

  if (upcomingEpisode) {
    isLocked = new Date() >= new Date(upcomingEpisode.locks_at);

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
      revealedPredictions = (allPredictions ?? []).map((p) => ({
        displayName: nameByManager.get(p.manager_id) ?? "Unknown",
        eliminatedLabel: p.predicted_eliminated_couple_id
          ? `${couplesById.get(p.predicted_eliminated_couple_id)?.celebrity_name}`
          : null,
        topScorerLabel: p.predicted_top_scorer_couple_id
          ? `${couplesById.get(p.predicted_top_scorer_couple_id)?.celebrity_name}`
          : null,
      }));
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
        activeCouples={activeCouples}
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
              celebrityName: r.couples!.celebrity_name,
              proName: r.couples!.pro_name,
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
