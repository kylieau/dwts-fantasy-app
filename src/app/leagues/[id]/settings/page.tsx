import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLeagueSettings, updateScoringSettings } from "./actions";
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

  if (league.commissioner_id !== user.id) {
    redirect(
      `/leagues/${id}?error=${encodeURIComponent("Only the commissioner can access league settings")}`
    );
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
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>League settings</CardTitle>
          <CardDescription>
            Waivers and draft timing. Roster size is set automatically when the
            draft starts (couples ÷ members).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={boundUpdateLeagueSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="waiverMode">Waiver mode</Label>
              <Select name="waiverMode" defaultValue={league.waiver_mode}>
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
                Waiver claim method (only used when waivers are enabled)
              </Label>
              <Select
                name="waiverClaimMethod"
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
              <Label htmlFor="pickTimeLimitSeconds">Draft pick timer (seconds)</Label>
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
                Pick &apos;Em lock (hours before air)
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring settings</CardTitle>
          <CardDescription>How points are awarded each week.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={boundUpdateScoringSettings} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="judgesScoreMultiplier">Judges&apos; score multiplier</Label>
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
                <Label htmlFor="survivalPoints">Survival points</Label>
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
                  Elimination prediction points
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
                  Top scorer prediction points
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
                <Label htmlFor="firstPlacePoints">1st place bonus</Label>
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
                <Label htmlFor="secondPlacePoints">2nd place bonus</Label>
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
                <Label htmlFor="thirdPlacePoints">3rd place bonus</Label>
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
        </CardContent>
      </Card>
    </div>
  );
}
