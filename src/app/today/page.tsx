import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountTabBar } from "@/components/account-tab-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeLeagueSummary } from "@/lib/league-summary";
import { buildCoupleDisplayNames, formatCoupleName } from "@/lib/couple-display";

export default async function TodayPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name)")
    .eq("user_id", user.id);

  const leagues = (memberships ?? []).map((m) => m.leagues!).filter(Boolean);
  const leagueIds = leagues.map((l) => l.id);

  const { data: upcomingEpisode } = await supabase
    .from("episodes")
    .select("id, week_number")
    .eq("status", "upcoming")
    .order("week_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  const summaries = await Promise.all(
    leagues.map((league) => computeLeagueSummary(supabase, user.id, league, upcomingEpisode ?? null))
  );

  // Recent activity: derived only, no new schema — recent eliminations among
  // a league's rostered couples, and recent fellow members joining. Rank-change
  // events ("took the lead") aren't derivable without tracking a previous
  // leader, so they're deliberately left out rather than faked.
  const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const activity: { id: string; text: string; at: string }[] = [];

  if (leagueIds.length > 0) {
    const { data: recentMembers } = await supabase
      .from("league_members")
      .select("league_id, joined_at, user_id, profiles(display_name), leagues(name)")
      .in("league_id", leagueIds)
      .neq("user_id", user.id)
      .gte("joined_at", recentCutoff);

    for (const m of recentMembers ?? []) {
      activity.push({
        id: `member-${m.league_id}-${m.user_id}`,
        text: `${m.profiles?.display_name ?? "Someone"} joined ${m.leagues?.name ?? "a league"}`,
        at: m.joined_at,
      });
    }

    const { data: activeSeasonId } = await supabase.rpc("active_season_id");
    const { data: recentEpisodes } = await supabase
      .from("episodes")
      .select("week_number, airs_at")
      .eq("season_id", activeSeasonId ?? "")
      .gte("airs_at", recentCutoff)
      .lte("airs_at", new Date().toISOString());
    const recentWeeks = (recentEpisodes ?? []).map((e) => e.week_number);
    const airsAtByWeek = new Map((recentEpisodes ?? []).map((e) => [e.week_number, e.airs_at]));

    if (recentWeeks.length > 0) {
      const { data: recentlyEliminated } = await supabase
        .from("couples")
        .select(
          "id, elimination_week, celebrity:people!couples_celebrity_id_fkey(name), pro:people!couples_pro_id_fkey(name)"
        )
        .eq("season_id", activeSeasonId ?? "")
        .in("status", ["eliminated", "withdrawn"])
        .in("elimination_week", recentWeeks);

      if (recentlyEliminated && recentlyEliminated.length > 0) {
        const coupleIds = recentlyEliminated.map((c) => c.id);
        const { data: rosterMatches } = await supabase
          .from("roster_slots")
          .select("league_id, couple_id")
          .in("league_id", leagueIds)
          .in("couple_id", coupleIds);

        const leagueNameById = new Map(leagues.map((l) => [l.id, l.name]));
        const displayNames = buildCoupleDisplayNames(
          recentlyEliminated.map((c) => ({
            id: c.id,
            celebrity_name: c.celebrity?.name ?? "Unknown",
            pro_name: c.pro?.name ?? "Unknown",
          }))
        );
        const coupleById = new Map(recentlyEliminated.map((c) => [c.id, c]));
        // Only one activity line per (league, couple), even if multiple slots reference it.
        const seen = new Set<string>();

        for (const match of rosterMatches ?? []) {
          if (!match.couple_id) continue;
          const key = `${match.league_id}-${match.couple_id}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const couple = coupleById.get(match.couple_id);
          if (!couple) continue;
          const parts = displayNames.get(match.couple_id);
          const label = parts ? formatCoupleName(parts) : "a couple";

          activity.push({
            id: `elim-${key}`,
            text: `${leagueNameById.get(match.league_id) ?? "A league"} eliminated ${label}`,
            at: airsAtByWeek.get(couple.elimination_week!) ?? recentCutoff,
          });
        }
      }
    }
  }

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <AccountTabBar />

      <div className="flex flex-col gap-6 pb-20 sm:pb-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="mt-1 text-sm text-muted-foreground">{summaries.length} leagues</p>
        </div>

        {summaries.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No leagues yet</CardTitle>
              <CardDescription>
                Head to the Leagues tab to create one or join with an invite code.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {summaries.map((s) => (
              <Link key={s.id} href={`/leagues/${s.id}`}>
                <Card className="transition-colors hover:bg-muted">
                  <CardContent className="flex items-center gap-3 py-4">
                    <span
                      className={
                        s.needsAttention
                          ? "size-2 shrink-0 rounded-full bg-destructive"
                          : "size-2 shrink-0 rounded-full bg-emerald-500"
                      }
                    />
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.statusText}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      #{s.rank} / {s.totalMembers}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing new in the last week.</p>
            ) : (
              activity.slice(0, 8).map((a) => (
                <p key={a.id} className="text-sm">
                  {a.text}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
