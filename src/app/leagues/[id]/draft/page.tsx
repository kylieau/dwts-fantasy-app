import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DraftRoom } from "@/components/draft-room";

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

  const [{ data: members }, { data: couples }, { data: picks }] = await Promise.all([
    supabase
      .from("league_members")
      .select("user_id, role, draft_position, profiles(display_name)")
      .eq("league_id", id)
      .order("draft_position"),
    supabase
      .from("couples")
      .select("id, celebrity_name, pro_name")
      .order("celebrity_name"),
    supabase
      .from("draft_picks")
      .select("id, couple_id, manager_id, round, pick_number, picked_at")
      .eq("league_id", id)
      .order("pick_number"),
  ]);

  return (
    <DraftRoom
      league={league}
      members={members ?? []}
      couples={couples ?? []}
      initialPicks={picks ?? []}
      currentUserId={user.id}
    />
  );
}
