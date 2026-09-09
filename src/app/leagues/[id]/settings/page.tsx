import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueModulesForm } from "@/components/league-modules-form";
import { Button } from "@/components/ui/button";

export default async function LeagueSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { id } = await params;
  const { error, message } = await searchParams;
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

  const isCommissioner = league.commissioner_id === user.id;

  if (!isCommissioner) {
    const { data: isMember } = await supabase.rpc("is_league_member", { p_league_id: id });
    if (!isMember) {
      redirect(
        `/leagues?error=${encodeURIComponent("You're not a member of that league")}`
      );
    }
  }

  const { data: scoringSettings } = await supabase
    .from("scoring_settings")
    .select("*")
    .eq("league_id", id)
    .single();

  const { data: activeSeasonId } = await supabase.rpc("active_season_id");
  const { data: premiereEpisode } = await supabase
    .from("episodes")
    .select("airs_at")
    .eq("season_id", activeSeasonId ?? "")
    .eq("week_number", 1)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <Button
          render={<Link href={`/leagues/${id}`} />}
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
        >
          ← Back to {league.name}
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {league.name} settings
        </h1>
        {!isCommissioner && (
          <p className="mt-1 text-sm text-muted-foreground">
            View-only — only the commissioner can change these.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
      </div>

      <LeagueModulesForm
        leagueId={id}
        league={league}
        scoringSettings={scoringSettings}
        canEdit={isCommissioner}
        premiereAirsAt={premiereEpisode?.airs_at ?? null}
      />
    </div>
  );
}
