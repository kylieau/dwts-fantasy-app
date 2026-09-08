import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminResultsTabs } from "@/components/admin-results-tabs";
import { resultsEntryOpenToAll } from "@/lib/results";
import { buildCoupleDisplayNames } from "@/lib/couple-display";

export default async function AdminResultsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin && !resultsEntryOpenToAll()) {
    redirect("/");
  }

  const { data: activeSeasonId } = await supabase.rpc("active_season_id");

  const coupleFields =
    "id, celebrity:people!couples_celebrity_id_fkey(name), pro:people!couples_pro_id_fkey(name)";

  const [
    { data: activeCouplesRaw },
    { data: allCouplesRaw },
    { data: episodes },
    { data: danceScores },
    { data: episodeResults },
  ] = await Promise.all([
    supabase
      .from("couples")
      .select(coupleFields)
      .eq("status", "active")
      .eq("season_id", activeSeasonId ?? ""),
    supabase.from("couples").select(coupleFields),
    supabase.from("episodes").select("id, week_number, airs_at, status, is_finale").order("week_number"),
    supabase.from("dance_scores").select("episode_id, couple_id, total_score"),
    supabase
      .from("episode_results")
      .select("episode_id, couple_id, outcome, was_bottom_two, saved_by_judges"),
  ]);

  const flatten = (rows: typeof activeCouplesRaw) =>
    (rows ?? [])
      .map((c) => ({
        id: c.id,
        celebrity_name: c.celebrity?.name ?? "Unknown",
        pro_name: c.pro?.name ?? "Unknown",
      }))
      .sort((a, b) => a.celebrity_name.localeCompare(b.celebrity_name));

  const activeCouples = flatten(activeCouplesRaw);
  const allCouples = flatten(allCouplesRaw);

  return (
    <AdminResultsTabs
      activeCouples={activeCouples}
      allCouples={allCouples}
      activeCoupleDisplayNames={Object.fromEntries(buildCoupleDisplayNames(activeCouples))}
      allCoupleDisplayNames={Object.fromEntries(buildCoupleDisplayNames(allCouples))}
      episodes={episodes ?? []}
      danceScores={danceScores ?? []}
      episodeResults={episodeResults ?? []}
    />
  );
}
