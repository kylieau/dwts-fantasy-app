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
type Named = { id: string; name: string };
type Outcome = "safe" | "eliminated" | "withdrawn" | "bye" | "winner" | "runner_up" | "third_place";

type SubmittedDance = {
  key: string;
  coupleId: string;
  danceStyleId: string;
  judgeScores: { judgeId: string; score: number }[];
};

type Buckets = {
  eliminated: boolean;
  withdrawn: boolean;
  bye: boolean;
  bottomTwo: boolean;
  bottomThree: boolean;
  judgesSave: boolean;
  teamDance: boolean;
  winner: boolean;
  runnerUp: boolean;
  thirdPlace: boolean;
};

function emptyBuckets(): Buckets {
  return {
    eliminated: false,
    withdrawn: false,
    bye: false,
    bottomTwo: false,
    bottomThree: false,
    judgesSave: false,
    teamDance: false,
    winner: false,
    runnerUp: false,
    thirdPlace: false,
  };
}

// Primary status buckets are mutually exclusive by priority (a couple marked
// both Eliminated and Winner is a data-entry mistake, not a valid state) —
// Bottom 2/3, Judges' Save, and Team Dance are independent notes layered on
// top and don't affect this. Anyone with no primary bucket checked is Safe.
function computeOutcome(b: Buckets, isFinale: boolean): Outcome {
  if (b.eliminated) return "eliminated";
  if (b.withdrawn) return "withdrawn";
  if (isFinale && b.winner) return "winner";
  if (isFinale && b.runnerUp) return "runner_up";
  if (isFinale && b.thirdPlace) return "third_place";
  if (b.bye) return "bye";
  return "safe";
}

export function ResultsForm({
  couples,
  coupleDisplayNames,
  judges,
  danceStyles,
}: {
  couples: Couple[];
  coupleDisplayNames: Record<string, string>;
  judges: Named[];
  danceStyles: Named[];
}) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [airsAt, setAirsAt] = useState("");
  const [theme, setTheme] = useState("");
  const [expectedDanceCount, setExpectedDanceCount] = useState(1);
  const [isEliminationWeek, setIsEliminationWeek] = useState(true);
  const [isFinale, setIsFinale] = useState(false);
  const [selectedJudgeIds, setSelectedJudgeIds] = useState<Set<string>>(
    () => new Set(judges.map((j) => j.id))
  );

  const [selectedCoupleId, setSelectedCoupleId] = useState("");
  const [selectedDanceStyleId, setSelectedDanceStyleId] = useState("");
  const [judgeScoreInputs, setJudgeScoreInputs] = useState<Record<string, string>>({});

  const [submittedDances, setSubmittedDances] = useState<SubmittedDance[]>([]);
  const [buckets, setBuckets] = useState<Record<string, Buckets>>(() =>
    Object.fromEntries(couples.map((c) => [c.id, emptyBuckets()]))
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeJudges = judges.filter((j) => selectedJudgeIds.has(j.id));
  const liveTotal = activeJudges.reduce((sum, j) => {
    const n = Number(judgeScoreInputs[j.id]);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  const coupleItems = Object.fromEntries(
    couples.map((c) => [c.id, coupleDisplayNames[c.id] ?? `${c.celebrity_name} & ${c.pro_name}`])
  );
  const danceStyleItems = Object.fromEntries(danceStyles.map((d) => [d.id, d.name]));

  const danceCountByCouple = new Map<string, number>();
  for (const d of submittedDances) {
    danceCountByCouple.set(d.coupleId, (danceCountByCouple.get(d.coupleId) ?? 0) + 1);
  }
  const availableCouples = couples.filter(
    (c) => (danceCountByCouple.get(c.id) ?? 0) < expectedDanceCount
  );

  function toggleJudge(judgeId: string) {
    setSelectedJudgeIds((prev) => {
      const next = new Set(prev);
      if (next.has(judgeId)) next.delete(judgeId);
      else next.add(judgeId);
      return next;
    });
  }

  function addDanceSubmission() {
    if (!selectedCoupleId || !selectedDanceStyleId) return;
    const judgeScores = activeJudges
      .map((j) => ({ judgeId: j.id, score: Number(judgeScoreInputs[j.id]) }))
      .filter((js) => !Number.isNaN(js.score));

    setSubmittedDances((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        coupleId: selectedCoupleId,
        danceStyleId: selectedDanceStyleId,
        judgeScores,
      },
    ]);
    setSelectedCoupleId("");
    setSelectedDanceStyleId("");
    setJudgeScoreInputs({});
  }

  function removeDanceSubmission(key: string) {
    setSubmittedDances((prev) => prev.filter((d) => d.key !== key));
  }

  function toggleBucket(coupleId: string, bucket: keyof Buckets) {
    setBuckets((prev) => ({
      ...prev,
      [coupleId]: { ...prev[coupleId], [bucket]: !prev[coupleId][bucket] },
    }));
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const entries = couples
      .map((c) => {
        const dances = submittedDances
          .filter((d) => d.coupleId === c.id)
          .map((d) => ({ danceStyleId: d.danceStyleId, judgeScores: d.judgeScores }));
        const b = buckets[c.id];
        return {
          coupleId: c.id,
          dances,
          outcome: computeOutcome(b, isFinale),
          wasBottomTwo: b.bottomTwo,
          wasBottomThree: b.bottomThree,
          savedByJudges: b.judgesSave,
          wasTeamDance: b.teamDance,
        };
      })
      // Skip couples nobody touched this week (no dances, no bucket, still
      // default Safe) — e.g. someone eliminated weeks ago sitting in the list.
      .filter(
        (e) =>
          e.dances.length > 0 ||
          e.outcome !== "safe" ||
          e.wasBottomTwo ||
          e.wasBottomThree ||
          e.savedByJudges ||
          e.wasTeamDance
      );

    const result = await submitEpisodeResults({
      weekNumber,
      airsAt,
      theme: theme.trim() || null,
      expectedDanceCount,
      isEliminationWeek,
      isFinale,
      entries,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  }

  const bucketColumns: { key: keyof Buckets; label: string; finaleOnly?: boolean }[] = [
    { key: "eliminated", label: "Eliminated" },
    { key: "withdrawn", label: "Withdrawn" },
    { key: "bye", label: "Bye" },
    { key: "bottomTwo", label: "Bottom 2" },
    { key: "bottomThree", label: "Bottom 3" },
    { key: "judgesSave", label: "Judges' Save" },
    { key: "teamDance", label: "Team Dance" },
    { key: "winner", label: "Winner", finaleOnly: true },
    { key: "runnerUp", label: "Runner-up", finaleOnly: true },
    { key: "thirdPlace", label: "Third place", finaleOnly: true },
  ];
  const visibleBucketColumns = bucketColumns.filter((col) => !col.finaleOnly || isFinale);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Leave every couple&apos;s dances and Elimination assignments untouched
        to just schedule the episode ahead of air, without entering results
        yet. Each league locks its own Pick &apos;Em predictions some number
        of hours before this air time — set in that league&apos;s settings.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-muted-foreground">
          Results saved and scores recomputed for every league.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Episode Overview</CardTitle>
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
            <Input
              type="datetime-local"
              value={airsAt}
              onChange={(e) => setAirsAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Theme</Label>
            <Input
              placeholder="e.g. Villains Night"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Dances (per Couple)</Label>
            <Input
              type="number"
              min={1}
              value={expectedDanceCount}
              onChange={(e) => setExpectedDanceCount(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-4">
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
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Judges this episode</Label>
            <div className="flex flex-wrap gap-3">
              {judges.map((j) => (
                <label key={j.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedJudgeIds.has(j.id)}
                    onChange={() => toggleJudge(j.id)}
                  />
                  {j.name}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enter Dance Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              items={coupleItems}
              value={selectedCoupleId}
              onValueChange={(v) => setSelectedCoupleId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Couple" />
              </SelectTrigger>
              <SelectContent>
                {availableCouples.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {coupleItems[c.id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={danceStyleItems}
              value={selectedDanceStyleId}
              onValueChange={(v) => setSelectedDanceStyleId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dance style" />
              </SelectTrigger>
              <SelectContent>
                {danceStyles.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {activeJudges.map((j) => (
              <div key={j.id} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{j.name}</Label>
                <Input
                  className="w-20"
                  placeholder="—"
                  value={judgeScoreInputs[j.id] ?? ""}
                  onChange={(e) =>
                    setJudgeScoreInputs((prev) => ({ ...prev, [j.id]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Total</Label>
              <p className="flex h-8 w-16 items-center text-sm font-medium">{liveTotal}</p>
            </div>
            <Button
              size="sm"
              onClick={addDanceSubmission}
              disabled={!selectedCoupleId || !selectedDanceStyleId}
            >
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      {submittedDances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dances entered this episode</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {submittedDances.map((d) => {
              const styleName = danceStyles.find((s) => s.id === d.danceStyleId)?.name ?? "Unknown";
              const total = d.judgeScores.reduce((sum, js) => sum + js.score, 0);
              return (
                <div
                  key={d.key}
                  className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm"
                >
                  <span>
                    {coupleDisplayNames[d.coupleId] ?? "Unknown"} — {styleName}: {total}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => removeDanceSubmission(d.key)}>
                    Remove
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Elimination</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left">Couple</th>
                {visibleBucketColumns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap p-2 text-center">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {couples.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap p-2">
                    {coupleDisplayNames[c.id] ?? `${c.celebrity_name} & ${c.pro_name}`}
                  </td>
                  {visibleBucketColumns.map((col) => (
                    <td key={col.key} className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={buckets[c.id][col.key]}
                        onChange={() => toggleBucket(c.id, col.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-2 text-xs text-muted-foreground">
            A couple with no box checked is Safe.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving..." : "Save results"}
      </Button>
    </div>
  );
}
