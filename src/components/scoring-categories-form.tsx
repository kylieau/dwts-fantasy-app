"use client";

import { useState } from "react";
import {
  updateScoringCategories,
  type ScoringCategoriesInput,
} from "@/app/leagues/[id]/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrowserTimeZone, airsAtToUtcIso, utcIsoToLocalInput } from "@/lib/use-browser-time-zone";

type ScoringMethod = "exact_position" | "distance_based" | "binary_tier";

type ScoringSettings = {
  judges_score_category_enabled: boolean;
  eliminations_category_enabled: boolean;
  bonus_picks_category_enabled: boolean;
  judges_score_category_weight: number;
  eliminations_category_weight: number;
  bonus_picks_category_weight: number;
  judges_score_starts_week: number;
  bonus_picks_deadline: string | null;
  bonus_picks_scoring_method: string | null;
  bonus_picks_distance_penalty: number | null;
  bonus_picks_tier_size: number | null;
};

const METHOD_ITEMS: Record<ScoringMethod, string> = {
  exact_position: "Exact position",
  distance_based: "Distance-based partial credit",
  binary_tier: "Binary tier (e.g. top 3)",
};

export function ScoringCategoriesForm({
  leagueId,
  scoringSettings,
}: {
  leagueId: string;
  scoringSettings: ScoringSettings | null;
}) {
  const browserTimeZone = useBrowserTimeZone();

  const [judgesEnabled, setJudgesEnabled] = useState(
    scoringSettings?.judges_score_category_enabled ?? true
  );
  const [eliminationsEnabled, setEliminationsEnabled] = useState(
    scoringSettings?.eliminations_category_enabled ?? true
  );
  const [bonusEnabled, setBonusEnabled] = useState(
    scoringSettings?.bonus_picks_category_enabled ?? false
  );

  const [judgesWeight, setJudgesWeight] = useState(
    scoringSettings?.judges_score_category_weight ?? 1
  );
  const [eliminationsWeight, setEliminationsWeight] = useState(
    scoringSettings?.eliminations_category_weight ?? 1
  );
  const [bonusWeight, setBonusWeight] = useState(
    scoringSettings?.bonus_picks_category_weight ?? 1
  );

  const [judgesStartsWeek, setJudgesStartsWeek] = useState<1 | 2>(
    (scoringSettings?.judges_score_starts_week as 1 | 2) ?? 1
  );

  const [bonusDeadline, setBonusDeadline] = useState(
    scoringSettings?.bonus_picks_deadline ? utcIsoToLocalInput(scoringSettings.bonus_picks_deadline) : ""
  );
  const [bonusMethod, setBonusMethod] = useState<ScoringMethod>(
    (scoringSettings?.bonus_picks_scoring_method as ScoringMethod) ?? "exact_position"
  );
  const [bonusDistancePenalty, setBonusDistancePenalty] = useState(
    scoringSettings?.bonus_picks_distance_penalty ?? 2
  );
  const [bonusTierSize, setBonusTierSize] = useState(scoringSettings?.bonus_picks_tier_size ?? 3);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);

    if (!judgesEnabled && !eliminationsEnabled && !bonusEnabled) {
      setError("At least one category must stay on.");
      return;
    }

    let bonusDeadlineUtc: string | null = null;
    if (bonusEnabled) {
      bonusDeadlineUtc = airsAtToUtcIso(bonusDeadline);
      if (!bonusDeadlineUtc) {
        setError("Set a valid Bonus Picks deadline.");
        return;
      }
    }

    setSubmitting(true);

    const input: ScoringCategoriesInput = {
      judgesScoreCategoryEnabled: judgesEnabled,
      eliminationsCategoryEnabled: eliminationsEnabled,
      bonusPicksCategoryEnabled: bonusEnabled,
      judgesScoreCategoryWeight: judgesWeight,
      eliminationsCategoryWeight: eliminationsWeight,
      bonusPicksCategoryWeight: bonusWeight,
      judgesScoreStartsWeek: judgesStartsWeek,
      bonusPicksDeadline: bonusDeadlineUtc,
      bonusPicksScoringMethod: bonusEnabled ? bonusMethod : null,
      bonusPicksDistancePenalty: bonusEnabled && bonusMethod === "distance_based" ? bonusDistancePenalty : null,
      bonusPicksTierSize: bonusEnabled && bonusMethod === "binary_tier" ? bonusTierSize : null,
    };

    const result = await updateScoringCategories(leagueId, input);
    if (result.error) setError(result.error);
    else setSuccess(true);
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoring Categories</CardTitle>
        <CardDescription>
          Turn each category on or off and weight how much it counts toward Standings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-muted-foreground">Scoring categories saved.</p>}

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={judgesEnabled}
                onChange={(e) => setJudgesEnabled(e.target.checked)}
              />
              Judges&apos; Scores (Draft Fantasy)
            </label>
            {judgesEnabled && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-20"
                  value={judgesWeight}
                  onChange={(e) => setJudgesWeight(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          {judgesEnabled && (
            <div className="flex items-center gap-2 pl-6">
              <Label className="text-xs text-muted-foreground">Draft counts from</Label>
              <Select
                items={{ "1": "Week 1", "2": "Week 2" }}
                value={String(judgesStartsWeek)}
                onValueChange={(v) => setJudgesStartsWeek(v === "2" ? 2 : 1)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Week 1</SelectItem>
                  <SelectItem value="2">Week 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={eliminationsEnabled}
              onChange={(e) => setEliminationsEnabled(e.target.checked)}
            />
            Eliminations (Weekly Pick)
          </label>
          {eliminationsEnabled && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Weight</Label>
              <Input
                type="number"
                step="0.1"
                min={0}
                className="w-20"
                value={eliminationsWeight}
                onChange={(e) => setEliminationsWeight(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={bonusEnabled}
                onChange={(e) => setBonusEnabled(e.target.checked)}
              />
              Bonus Picks (Full-Order Prediction)
            </label>
            {bonusEnabled && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-20"
                  value={bonusWeight}
                  onChange={(e) => setBonusWeight(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {bonusEnabled && (
            <div className="flex flex-col gap-3 pl-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Deadline{browserTimeZone ? ` (${browserTimeZone})` : ""}
                </Label>
                <Input
                  type="datetime-local"
                  className="w-64"
                  value={bonusDeadline}
                  onChange={(e) => setBonusDeadline(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Scoring method</Label>
                <Select
                  items={METHOD_ITEMS}
                  value={bonusMethod}
                  onValueChange={(v) => setBonusMethod((v as ScoringMethod) ?? "exact_position")}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_ITEMS) as ScoringMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {METHOD_ITEMS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {bonusMethod === "distance_based" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Points docked per position off</Label>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    value={bonusDistancePenalty}
                    onChange={(e) => setBonusDistancePenalty(Number(e.target.value))}
                  />
                </div>
              )}
              {bonusMethod === "binary_tier" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Tier size (top N)</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={bonusTierSize}
                    onChange={(e) => setBonusTierSize(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={submitting} className="self-start">
          {submitting ? "Saving..." : "Save scoring categories"}
        </Button>
      </CardContent>
    </Card>
  );
}
