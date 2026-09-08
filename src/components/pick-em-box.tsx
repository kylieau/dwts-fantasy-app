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

type Couple = { id: string; celebrity_name: string; pro_name: string };

export function PickEmBox({
  leagueId,
  episode,
  activeCouples,
  existingPrediction,
  isLocked,
  revealedPredictions,
}: {
  leagueId: string;
  episode: { id: string; week_number: number; locks_at: string } | null;
  activeCouples: Couple[];
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

  if (!episode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pick &apos;Em</CardTitle>
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
        <CardTitle>Pick &apos;Em — Week {episode.week_number}</CardTitle>
        <CardDescription>
          {isLocked
            ? "Predictions are locked for this episode."
            : `Locks at ${new Date(episode.locks_at).toLocaleString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-muted-foreground">Prediction saved.</p>}

        {!isLocked ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Who gets eliminated?</label>
              <Select value={eliminatedId} onValueChange={(v) => setEliminatedId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a couple" />
                </SelectTrigger>
                <SelectContent>
                  {activeCouples.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.celebrity_name} &amp; {c.pro_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Who scores highest?</label>
              <Select value={topScorerId} onValueChange={(v) => setTopScorerId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a couple" />
                </SelectTrigger>
                <SelectContent>
                  {activeCouples.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.celebrity_name} &amp; {c.pro_name}
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
