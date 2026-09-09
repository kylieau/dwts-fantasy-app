"use client";

import { useState } from "react";
import { submitGrandFinalePrediction } from "@/app/leagues/[id]/predictions/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { coupleNameNode } from "@/components/couple-name";
import type { CoupleNameParts } from "@/lib/couple-display";

type Couple = { id: string; celebrity_name: string; pro_name: string; status: string; elimination_week: number | null };

function statusLabel(couple: Couple): string {
  switch (couple.status) {
    case "winner":
      return "Won the season";
    case "runner_up":
      return "Runner-up";
    case "third_place":
      return "Third place";
    case "eliminated":
      return `Eliminated — Week ${couple.elimination_week}`;
    case "withdrawn":
      return `Withdrew — Week ${couple.elimination_week}`;
    default:
      return "Still competing";
  }
}

export function GrandFinaleBox({
  leagueId,
  couples,
  coupleDisplayNames,
  existingOrder,
  deadline,
  isLocked,
}: {
  leagueId: string;
  couples: Couple[];
  coupleDisplayNames: Record<string, CoupleNameParts>;
  existingOrder: string[] | null;
  deadline: string | null;
  isLocked: boolean;
}) {
  const defaultOrder = [...couples]
    .sort((a, b) => a.celebrity_name.localeCompare(b.celebrity_name))
    .map((c) => c.id);

  const [order, setOrder] = useState<string[]>(existingOrder ?? defaultOrder);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const coupleById = new Map(couples.map((c) => [c.id, c]));

  function nameFor(coupleId: string) {
    const c = coupleById.get(coupleId);
    return coupleNameNode(
      coupleDisplayNames[coupleId] ?? { celebrity: c?.celebrity_name ?? "Unknown", pro: c?.pro_name ?? "Unknown" }
    );
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  async function handleSubmit() {
    setError(null);
    setSaved(false);
    setSubmitting(true);
    const result = await submitGrandFinalePrediction(leagueId, order);
    if (result.error) setError(result.error);
    else setSaved(true);
    setSubmitting(false);
  }

  if (isLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grand Finale</CardTitle>
          <CardDescription>Predictions are locked.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {!existingOrder ? (
            <p className="text-muted-foreground">
              You didn&apos;t submit a Full-Order Prediction before the deadline.
            </p>
          ) : (
            existingOrder.map((coupleId, i) => (
              <div key={coupleId} className="flex items-center justify-between border-b border-border py-1 last:border-b-0">
                <span>
                  {i + 1}. {nameFor(coupleId)}
                </span>
                <span className="text-muted-foreground">
                  {coupleById.get(coupleId) ? statusLabel(coupleById.get(coupleId)!) : "Unknown"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grand Finale</CardTitle>
        <CardDescription>
          Predict the full order of elimination, first out to season winner.
          {deadline ? ` Locks at ${new Date(deadline).toLocaleString()}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-muted-foreground">Prediction saved.</p>}

        <div className="flex flex-col gap-1">
          {order.map((coupleId, i) => (
            <div
              key={coupleId}
              className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
            >
              <span>
                {i + 1}. {nameFor(coupleId)}
              </span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === 0}
                  onClick={() => moveEntry(i, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === order.length - 1}
                  onClick={() => moveEntry(i, 1)}
                >
                  ↓
                </Button>
              </span>
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="self-start">
          {submitting ? "Saving..." : "Save prediction"}
        </Button>
      </CardContent>
    </Card>
  );
}
