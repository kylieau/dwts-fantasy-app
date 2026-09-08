"use client";

import { useState } from "react";
import { submitEpisodeResults } from "@/app/admin/results/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Couple = { id: string; celebrity_name: string; pro_name: string };
type Outcome = "safe" | "eliminated" | "winner" | "runner_up" | "third_place";

type EntryState = {
  scoresText: string;
  outcome: Outcome;
  wasBottomTwo: boolean;
  savedByJudges: boolean;
};

const emptyEntry: EntryState = {
  scoresText: "",
  outcome: "safe",
  wasBottomTwo: false,
  savedByJudges: false,
};

export function ResultsForm({ couples }: { couples: Couple[] }) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [airDate, setAirDate] = useState("");
  const [locksAt, setLocksAt] = useState("");
  const [isEliminationWeek, setIsEliminationWeek] = useState(true);
  const [isFinale, setIsFinale] = useState(false);
  const [entries, setEntries] = useState<Record<string, EntryState>>(() =>
    Object.fromEntries(couples.map((c) => [c.id, emptyEntry]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateEntry(coupleId: string, patch: Partial<EntryState>) {
    setEntries((prev) => ({ ...prev, [coupleId]: { ...prev[coupleId], ...patch } }));
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const parsedEntries = Object.entries(entries)
      .map(([coupleId, e]) => ({
        coupleId,
        danceScores: e.scoresText
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "")
          .map(Number)
          .filter((n) => !Number.isNaN(n)),
        outcome: e.outcome,
        wasBottomTwo: e.wasBottomTwo,
        savedByJudges: e.savedByJudges,
      }))
      .filter((e) => e.danceScores.length > 0);

    const result = await submitEpisodeResults({
      weekNumber,
      airDate,
      locksAt,
      isEliminationWeek,
      isFinale,
      entries: parsedEntries,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Enter episode results</h1>
      <p className="text-sm text-muted-foreground">
        Leave every couple&apos;s scores blank to just schedule the episode
        (set its lock time) ahead of air, without entering results yet.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-muted-foreground">
          Results saved and scores recomputed for every league.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Episode</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Week number</Label>
            <Input
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Air date</Label>
            <Input type="date" value={airDate} onChange={(e) => setAirDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Predictions lock at</Label>
            <Input
              type="datetime-local"
              value={locksAt}
              onChange={(e) => setLocksAt(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isEliminationWeek}
                onChange={(e) => setIsEliminationWeek(e.target.checked)}
              />
              Elimination week
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFinale}
                onChange={(e) => setIsFinale(e.target.checked)}
              />
              Finale
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Couples</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {couples.map((c) => {
            const entry = entries[c.id];
            return (
              <div
                key={c.id}
                className="flex flex-col gap-2 border-b border-border pb-3 text-sm last:border-b-0 lg:grid lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-center lg:gap-3"
              >
                <span>
                  {c.celebrity_name} &amp; {c.pro_name}
                </span>
                <Input
                  className="w-full lg:w-32"
                  placeholder="e.g. 24, 27"
                  value={entry.scoresText}
                  onChange={(e) => updateEntry(c.id, { scoresText: e.target.value })}
                />
                <Select
                  value={entry.outcome}
                  onValueChange={(v) => updateEntry(c.id, { outcome: v as Outcome })}
                >
                  <SelectTrigger size="sm" className="w-full lg:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Safe</SelectItem>
                    <SelectItem value="eliminated">Eliminated</SelectItem>
                    <SelectItem value="winner">Winner</SelectItem>
                    <SelectItem value="runner_up">Runner-up</SelectItem>
                    <SelectItem value="third_place">Third place</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-4 lg:contents">
                  <label className="flex items-center gap-1 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={entry.wasBottomTwo}
                      onChange={(e) => updateEntry(c.id, { wasBottomTwo: e.target.checked })}
                    />
                    Bottom 2
                  </label>
                  <label className="flex items-center gap-1 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={entry.savedByJudges}
                      onChange={(e) => updateEntry(c.id, { savedByJudges: e.target.checked })}
                    />
                    Saved
                  </label>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving..." : "Save results"}
      </Button>
    </div>
  );
}
