import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLeagueSettings, updateScoringSettings } from "./actions";
import { ScoringCategoriesForm } from "@/components/scoring-categories-form";
import { SettingRow } from "@/components/setting-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const boundUpdateLeagueSettings = updateLeagueSettings.bind(null, id);
  const boundUpdateScoringSettings = updateScoringSettings.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
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

      <ScoringCategoriesForm leagueId={id} scoringSettings={scoringSettings} canEdit={isCommissioner} />

      <Card>
        <CardHeader>
          <CardTitle>League Settings</CardTitle>
          <CardDescription>
            Waivers and draft timing. Roster size is set automatically when the
            draft starts (couples ÷ members).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCommissioner ? (
            <div className="flex flex-col">
              <SettingRow
                label="Waiver Mode"
                value={league.waiver_mode === "waivers" ? "Waivers enabled" : "Locked (no waivers)"}
              />
              <SettingRow
                label="Waiver Claim Method"
                value={
                  league.waiver_claim_method === "fcfs"
                    ? "First come, first served"
                    : league.waiver_claim_method === "manual"
                      ? "Manual (commissioner decides)"
                      : "Reverse standings"
                }
              />
              <SettingRow label="Draft Pick Timer" value={`${league.pick_time_limit_seconds}s`} />
              <SettingRow
                label="Pick 'Em Lock"
                value={`${league.prediction_lock_hours_before_air}h before air`}
              />
            </div>
          ) : (
          <form action={boundUpdateLeagueSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="waiverMode">Waiver Mode</Label>
              <Select
                name="waiverMode"
                items={{ locked: "Locked (no waivers)", waivers: "Waivers enabled" }}
                defaultValue={league.waiver_mode}
              >
                <SelectTrigger id="waiverMode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locked">Locked (no waivers)</SelectItem>
                  <SelectItem value="waivers">Waivers enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="waiverClaimMethod">
                Waiver Claim Method (Only Used When Waivers Are Enabled)
              </Label>
              <Select
                name="waiverClaimMethod"
                items={{
                  reverse_standings: "Reverse standings",
                  fcfs: "First come, first served",
                  manual: "Manual (commissioner decides)",
                }}
                defaultValue={league.waiver_claim_method ?? "reverse_standings"}
              >
                <SelectTrigger id="waiverClaimMethod" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reverse_standings">Reverse standings</SelectItem>
                  <SelectItem value="fcfs">First come, first served</SelectItem>
                  <SelectItem value="manual">Manual (commissioner decides)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pickTimeLimitSeconds">Draft Pick Timer (Seconds)</Label>
              <Input
                id="pickTimeLimitSeconds"
                name="pickTimeLimitSeconds"
                type="number"
                min={10}
                defaultValue={league.pick_time_limit_seconds}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="predictionLockHoursBeforeAir">
                Pick &apos;Em Lock (Hours Before Air)
              </Label>
              <Input
                id="predictionLockHoursBeforeAir"
                name="predictionLockHoursBeforeAir"
                type="number"
                step="0.5"
                min={0}
                defaultValue={league.prediction_lock_hours_before_air}
                required
              />
            </div>

            <Button type="submit">Save league settings</Button>
          </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Settings</CardTitle>
          <CardDescription>How points are awarded each week.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isCommissioner ? (
            <div className="flex flex-col">
              <SettingRow label="Judges' Score Multiplier" value={scoringSettings?.judges_score_multiplier} />
              <SettingRow label="Survival Points" value={scoringSettings?.survival_points} />
              <SettingRow
                label="Elimination Prediction Points"
                value={scoringSettings?.elimination_prediction_points}
              />
              <SettingRow
                label="Top Scorer Prediction Points"
                value={scoringSettings?.top_scorer_prediction_points}
              />
              <SettingRow label="1st Place Bonus" value={scoringSettings?.first_place_points} />
              <SettingRow label="2nd Place Bonus" value={scoringSettings?.second_place_points} />
              <SettingRow label="3rd Place Bonus" value={scoringSettings?.third_place_points} />
            </div>
          ) : (
          <form action={boundUpdateScoringSettings} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="judgesScoreMultiplier">Judges&apos; Score Multiplier</Label>
                <Input
                  id="judgesScoreMultiplier"
                  name="judgesScoreMultiplier"
                  type="number"
                  step="0.1"
                  min={0}
                  defaultValue={scoringSettings?.judges_score_multiplier}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="survivalPoints">Survival Points</Label>
                <Input
                  id="survivalPoints"
                  name="survivalPoints"
                  type="number"
                  min={0}
                  defaultValue={scoringSettings?.survival_points}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="eliminationPredictionPoints">
                  Elimination Prediction Points
                </Label>
                <Input
                  id="eliminationPredictionPoints"
                  name="eliminationPredictionPoints"
                  type="number"
                  min={0}
                  defaultValue={scoringSettings?.elimination_prediction_points}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="topScorerPredictionPoints">
                  Top Scorer Prediction Points
                </Label>
                <Input
                  id="topScorerPredictionPoints"
                  name="topScorerPredictionPoints"
                  type="number"
                  min={0}
                  defaultValue={scoringSettings?.top_scorer_prediction_points}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstPlacePoints">1st Place Bonus</Label>
                <Input
                  id="firstPlacePoints"
                  name="firstPlacePoints"
                  type="number"
                  min={0}
                  defaultValue={scoringSettings?.first_place_points}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="secondPlacePoints">2nd Place Bonus</Label>
                <Input
                  id="secondPlacePoints"
                  name="secondPlacePoints"
                  type="number"
                  min={0}
                  defaultValue={scoringSettings?.second_place_points}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="thirdPlacePoints">3rd Place Bonus</Label>
                <Input
                  id="thirdPlacePoints"
                  name="thirdPlacePoints"
                  type="number"
                  min={0}
                  defaultValue={scoringSettings?.third_place_points}
                  required
                />
              </div>
            </div>

            <Button type="submit">Save scoring settings</Button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
