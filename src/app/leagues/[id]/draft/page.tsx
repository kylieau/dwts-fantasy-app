import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DraftRoom } from "@/components/draft-room";
import { buildCoupleDisplayNames } from "@/lib/couple-display";

export default async function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", id)
    .single();

  if (!league) {
    notFound();
  }

  const { data: activeSeasonId } = await supabase.rpc("active_season_id");

  const [{ data: members }, { data: couples }, { data: picks }] = await Promise.all([
    supabase
      .from("league_members")
      .select("user_id, role, draft_position, profiles(display_name)")
      .eq("league_id", id)
      .order("draft_position"),
    supabase
      .from("couples")
      .select(
        "id, celebrity:people!couples_celebrity_id_fkey(name), pro:people!couples_pro_id_fkey(name)"
      )
      .eq("season_id", activeSeasonId ?? ""),
    supabase
      .from("draft_picks")
      .select("id, couple_id, manager_id, round, pick_number, picked_at")
      .eq("league_id", id)
      .order("pick_number"),
  ]);

  const flatCouples = (couples ?? [])
    .map((c) => ({
      id: c.id,
      celebrity_name: c.celebrity?.name ?? "Unknown",
      pro_name: c.pro?.name ?? "Unknown",
    }))
    .sort((a, b) => a.celebrity_name.localeCompare(b.celebrity_name));

  const coupleDisplayNames = Object.fromEntries(buildCoupleDisplayNames(flatCouples));

  return (
    <DraftRoom
      league={league}
      members={members ?? []}
      couples={flatCouples}
      coupleDisplayNames={coupleDisplayNames}
      initialPicks={picks ?? []}
      currentUserId={user.id}
    />
  );
}
