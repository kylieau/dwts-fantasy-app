"use client";

import { useState } from "react";
import { submitPrediction } from "@/app/leagues/[id]/predictions/actions";
import { Button } from "@/components/ui/button";
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
import type { CoupleNameParts } from "@/lib/couple-display";
import { coupleNameNode } from "@/components/couple-name";

type Couple = { id: string; celebrity_name: string; pro_name: string };

export function PickEmBox({
  leagueId,
  episode,
  lockAt,
  activeCouples,
  coupleDisplayNames,
  existingPrediction,
  isLocked,
  revealedPredictions,
}: {
  leagueId: string;
  episode: { id: string; week_number: number } | null;
  lockAt: string | null;
  activeCouples: Couple[];
  coupleDisplayNames: Record<string, CoupleNameParts>;
  existingPrediction: {
    predicted_eliminated_couple_id: string | null;
    predicted_top_scorer_couple_id: string | null;
  } | null;
  isLocked: boolean;
  revealedPredictions?: {
    displayName: string;
    eliminatedLabel: string | null;
    topScorerLabel: string | null;
  }[];
}) {
  const [eliminatedId, setEliminatedId] = useState(
    existingPrediction?.predicted_eliminated_couple_id ?? ""
  );
  const [topScorerId, setTopScorerId] = useState(
    existingPrediction?.predicted_top_scorer_couple_id ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const coupleItems = Object.fromEntries(
    activeCouples.map((c) => [
      c.id,
      coupleNameNode(coupleDisplayNames[c.id] ?? { celebrity: c.celebrity_name, pro: c.pro_name }),
    ])
  );

  if (!episode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Curtain Call</CardTitle>
          <CardDescription>No upcoming episode scheduled yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleSubmit() {
    setError(null);
    setSaved(false);
    setSubmitting(true);
    const result = await submitPrediction(
      leagueId,
      episode!.id,
      eliminatedId || null,
      topScorerId || null
    );
    if (result.error) setError(result.error);
    else setSaved(true);
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curtain Call — Week {episode.week_number}</CardTitle>
        <CardDescription>
          {isLocked
            ? "Predictions are locked for this episode."
            : lockAt
              ? `Locks at ${new Date(lockAt).toLocaleString()}`
              : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-muted-foreground">Prediction saved.</p>}

        {!isLocked ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Who Gets Eliminated?</label>
              <Select items={coupleItems} value={eliminatedId} onValueChange={(v) => setEliminatedId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a Couple" />
                </SelectTrigger>
                <SelectContent>
                  {activeCouples.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {coupleItems[c.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Who Scores Highest?</label>
              <Select items={coupleItems} value={topScorerId} onValueChange={(v) => setTopScorerId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a Couple" />
                </SelectTrigger>
                <SelectContent>
                  {activeCouples.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {coupleItems[c.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save prediction"}
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {revealedPredictions?.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span>{p.displayName}</span>
                <span className="text-muted-foreground">
                  {p.eliminatedLabel ?? "—"} / {p.topScorerLabel ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
