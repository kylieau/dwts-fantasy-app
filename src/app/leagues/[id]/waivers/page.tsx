import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WaiversPanel } from "@/components/waivers-panel";

export default async function WaiversPage({
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
    .select("id, name, waiver_mode, waiver_claim_method, commissioner_id")
    .eq("id", id)
    .single();

  if (!league) {
    notFound();
  }

  if (league.waiver_mode !== "waivers") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Waivers aren&apos;t enabled</h1>
        <p className="text-sm text-muted-foreground">
          This league&apos;s roster is locked — the commissioner can enable waivers in
          league settings.
        </p>
      </div>
    );
  }

  const [{ data: myRosterSlots }, { data: allCouples }, { data: rosteredSlots }, { data: claims }] =
    await Promise.all([
      supabase
        .from("roster_slots")
        .select("slot_number, couples(id, celebrity_name, pro_name, status)")
        .eq("league_id", id)
        .eq("manager_id", user.id)
        .is("end_week", null),
      supabase.from("couples").select("id, celebrity_name, pro_name, status"),
      supabase.from("roster_slots").select("couple_id").eq("league_id", id).is("end_week", null),
      supabase
        .from("waiver_claims")
        .select("*, profiles(display_name), couples(celebrity_name, pro_name)")
        .eq("league_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const openSlots = (myRosterSlots ?? [])
    .filter((s) => s.couples?.status === "eliminated")
    .map((s) => ({
      slotNumber: s.slot_number,
      formerCoupleName: `${s.couples!.celebrity_name} & ${s.couples!.pro_name}`,
    }));

  const rosteredCoupleIds = new Set((rosteredSlots ?? []).map((s) => s.couple_id));
  const availableCouples = (allCouples ?? [])
    .filter((c) => c.status === "active" && !rosteredCoupleIds.has(c.id))
    .sort((a, b) => a.celebrity_name.localeCompare(b.celebrity_name));

  return (
    <WaiversPanel
      leagueId={id}
      claimMethod={league.waiver_claim_method!}
      isCommissioner={league.commissioner_id === user.id}
      openSlots={openSlots}
      availableCouples={availableCouples}
      claims={(claims ?? []).map((c) => ({
        id: c.id,
        managerName: c.profiles?.display_name ?? "Unknown",
        coupleName: c.couples ? `${c.couples.celebrity_name} & ${c.couples.pro_name}` : "Unknown",
        slotNumber: c.slot_number,
        status: c.status,
        createdAt: c.created_at,
      }))}
    />
  );
}
