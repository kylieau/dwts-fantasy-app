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
import { buildPeopleDisplayNames, type CoupleNameParts } from "@/lib/couple-display";
import { CoupleName, coupleNameNode } from "@/components/couple-name";

type Couple = { id: string; celebrity_name: string; pro_name: string };
type Named = { id: string; name: string };
type ScheduledEpisode = {
  id: string;
  week_number: number;
  airs_at: string;
  theme: string | null;
  is_elimination_week: boolean;
  is_finale: boolean;
};
type Outcome = "safe" | "eliminated" | "withdrawn" | "bye" | "winner" | "runner_up" | "third_place";

type SubmittedDance = {
  key: string;
  weekNumber: number;
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
  immunity: boolean;
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
    immunity: false,
    winner: false,
    runnerUp: false,
    thirdPlace: false,
  };
}

type Bonus = { points: number; note: string };

function emptyBonus(): Bonus {
  return { points: 0, note: "" };
}

// Primary status buckets are mutually exclusive by priority (a couple marked
// both Eliminated and Winner is a data-entry mistake, not a valid state) —
// Bottom 2/3, Judges' Save, Team Dance, and Immunity are independent notes
// layered on top and don't affect this. Anyone with no primary bucket checked
// is Safe.
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
  episodes,
}: {
  couples: Couple[];
  coupleDisplayNames: Record<string, CoupleNameParts>;
  judges: Named[];
  danceStyles: Named[];
  episodes: ScheduledEpisode[];
}) {
  const sortedEpisodes = [...episodes].sort((a, b) => a.week_number - b.week_number);

  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const selectedEpisode = sortedEpisodes.find((e) => e.id === selectedEpisodeId) ?? null;
  // Falls back to 0 only when nothing is selected yet — every place this is
  // used for real (dances, buckets, submit) is already gated on
  // selectedEpisode being non-null, so the sentinel is never actually acted on.
  const weekNumber = selectedEpisode?.week_number ?? 0;

  const isFinale = selectedEpisode?.is_finale ?? false;

  const [expectedDanceCount, setExpectedDanceCount] = useState(1);
  const [selectedJudgeIds, setSelectedJudgeIds] = useState<Set<string>>(
    () => new Set(judges.map((j) => j.id))
  );

  const [isTeamDanceEntry, setIsTeamDanceEntry] = useState(false);
  const [selectedCoupleId, setSelectedCoupleId] = useState("");
  const [selectedTeamCoupleIds, setSelectedTeamCoupleIds] = useState<Set<string>>(new Set());
  const [selectedDanceStyleId, setSelectedDanceStyleId] = useState("");
  const [judgeScoreInputs, setJudgeScoreInputs] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [submittedDances, setSubmittedDances] = useState<SubmittedDance[]>([]);
  const [bucketsByWeek, setBucketsByWeek] = useState<Record<number, Record<string, Buckets>>>({});
  const [bonusByWeek, setBonusByWeek] = useState<Record<number, Record<string, Bonus>>>({});

  const [overviewConfirmed, setOverviewConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeJudges = judges.filter((j) => selectedJudgeIds.has(j.id));
  const liveTotal = activeJudges.reduce((sum, j) => {
    const n = Number(judgeScoreInputs[j.id]);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  function coupleParts(c: Couple): CoupleNameParts {
    return coupleDisplayNames[c.id] ?? { celebrity: c.celebrity_name, pro: c.pro_name };
  }
  const coupleItems = Object.fromEntries(couples.map((c) => [c.id, coupleNameNode(coupleParts(c))]));
  const danceStyleItems = Object.fromEntries(danceStyles.map((d) => [d.id, d.name]));
  const episodeItems = Object.fromEntries(
    sortedEpisodes.map((e) => [
      e.id,
      `Week ${e.week_number}${e.theme ? ` — ${e.theme}` : ""} — ${new Date(e.airs_at).toLocaleDateString()}${
        e.is_finale ? " · Finale" : !e.is_elimination_week ? " · No elimination" : ""
      }`,
    ])
  );
  const judgeDisplayNames = buildPeopleDisplayNames(judges);

  const editingCoupleId = submittedDances.find((d) => d.key === editingKey)?.coupleId;
  const danceCountByCouple = new Map<string, number>();
  for (const d of submittedDances) {
    if (d.key === editingKey || d.weekNumber !== weekNumber) continue;
    danceCountByCouple.set(d.coupleId, (danceCountByCouple.get(d.coupleId) ?? 0) + 1);
  }
  const availableCouples = couples.filter(
    (c) => c.id === editingCoupleId || (danceCountByCouple.get(c.id) ?? 0) < expectedDanceCount
  );

  const dancesForCurrentWeek = submittedDances.filter((d) => d.weekNumber === weekNumber);
  const dancesForOtherWeeks = submittedDances.filter((d) => d.weekNumber !== weekNumber);

  const buckets = bucketsByWeek[weekNumber] ?? Object.fromEntries(couples.map((c) => [c.id, emptyBuckets()]));
  const bonus = bonusByWeek[weekNumber] ?? {};
  function bonusFor(coupleId: string): Bonus {
    return bonus[coupleId] ?? emptyBonus();
  }

  function toggleJudge(judgeId: string) {
    setOverviewConfirmed(false);
    setSelectedJudgeIds((prev) => {
      const next = new Set(prev);
      if (next.has(judgeId)) next.delete(judgeId);
      else next.add(judgeId);
      return next;
    });
  }

  function toggleTeamCouple(coupleId: string) {
    setSelectedTeamCoupleIds((prev) => {
      const next = new Set(prev);
      if (next.has(coupleId)) next.delete(coupleId);
      else next.add(coupleId);
      return next;
    });
  }

  function submitDanceEntry() {
    const judgeScores = activeJudges
      .map((j) => ({ judgeId: j.id, score: Number(judgeScoreInputs[j.id]) }))
      .filter((js) => !Number.isNaN(js.score));

    if (editingKey) {
      if (!selectedCoupleId || !selectedDanceStyleId) return;
      setSubmittedDances((prev) =>
        prev.map((d) =>
          d.key === editingKey
            ? {
                ...d,
                weekNumber,
                coupleId: selectedCoupleId,
                danceStyleId: selectedDanceStyleId,
                judgeScores,
              }
            : d
        )
      );
      setEditingKey(null);
    } else if (isTeamDanceEntry) {
      if (selectedTeamCoupleIds.size === 0 || !selectedDanceStyleId) return;
      setSubmittedDances((prev) => [
        ...prev,
        ...[...selectedTeamCoupleIds].map((coupleId) => ({
          key: `${Date.now()}-${Math.random()}-${coupleId}`,
          weekNumber,
          coupleId,
          danceStyleId: selectedDanceStyleId,
          judgeScores,
        })),
      ]);
      setSelectedTeamCoupleIds(new Set());
    } else {
      if (!selectedCoupleId || !selectedDanceStyleId) return;
      setSubmittedDances((prev) => [
        ...prev,
        {
          key: `${Date.now()}-${Math.random()}`,
          weekNumber,
          coupleId: selectedCoupleId,
          danceStyleId: selectedDanceStyleId,
          judgeScores,
        },
      ]);
    }
    setSelectedCoupleId("");
    setSelectedDanceStyleId("");
    setJudgeScoreInputs({});
  }

  function startEditDanceSubmission(d: SubmittedDance) {
    const episodeForDance = sortedEpisodes.find((e) => e.week_number === d.weekNumber);
    if (episodeForDance) setSelectedEpisodeId(episodeForDance.id);
    setIsTeamDanceEntry(false);
    setSelectedTeamCoupleIds(new Set());
    setEditingKey(d.key);
    setSelectedCoupleId(d.coupleId);
    setSelectedDanceStyleId(d.danceStyleId);
    setJudgeScoreInputs(
      Object.fromEntries(d.judgeScores.map((js) => [js.judgeId, String(js.score)]))
    );
  }

  function cancelEditDanceSubmission() {
    setEditingKey(null);
    setSelectedCoupleId("");
    setSelectedDanceStyleId("");
    setJudgeScoreInputs({});
  }

  function deleteDanceSubmission(key: string) {
    setSubmittedDances((prev) => prev.filter((d) => d.key !== key));
    if (editingKey === key) cancelEditDanceSubmission();
  }

  function toggleBucket(coupleId: string, bucket: keyof Buckets) {
    setBucketsByWeek((prev) => {
      const week = prev[weekNumber] ?? Object.fromEntries(couples.map((c) => [c.id, emptyBuckets()]));
      const couple = week[coupleId] ?? emptyBuckets();
      return {
        ...prev,
        [weekNumber]: { ...week, [coupleId]: { ...couple, [bucket]: !couple[bucket] } },
      };
    });
  }

  function setBonusPoints(coupleId: string, points: number) {
    setBonusByWeek((prev) => {
      const week = prev[weekNumber] ?? {};
      const current = week[coupleId] ?? emptyBonus();
      return { ...prev, [weekNumber]: { ...week, [coupleId]: { ...current, points } } };
    });
  }

  function setBonusNote(coupleId: string, note: string) {
    setBonusByWeek((prev) => {
      const week = prev[weekNumber] ?? {};
      const current = week[coupleId] ?? emptyBonus();
      return { ...prev, [weekNumber]: { ...week, [coupleId]: { ...current, note } } };
    });
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!selectedEpisode || !overviewConfirmed) {
      setError("Confirm the Episode Overview above before saving.");
      return;
    }

    setSubmitting(true);

    const entries = couples
      .map((c) => {
        const dances = dancesForCurrentWeek
          .filter((d) => d.coupleId === c.id)
          .map((d) => ({ danceStyleId: d.danceStyleId, judgeScores: d.judgeScores }));
        const b = buckets[c.id] ?? emptyBuckets();
        const couplesBonus = bonusFor(c.id);
        return {
          coupleId: c.id,
          dances,
          outcome: computeOutcome(b, isFinale),
          wasBottomTwo: b.bottomTwo,
          wasBottomThree: b.bottomThree,
          savedByJudges: b.judgesSave,
          wasTeamDance: b.teamDance,
          hadImmunity: b.immunity,
          bonusPoints: couplesBonus.points,
          bonusNote: couplesBonus.note.trim() || null,
        };
      })
      // Skip couples nobody touched this week (no dances, no bucket, no
      // bonus, still default Safe) — e.g. someone eliminated weeks ago
      // sitting in the list.
      .filter(
        (e) =>
          e.dances.length > 0 ||
          e.outcome !== "safe" ||
          e.wasBottomTwo ||
          e.wasBottomThree ||
          e.savedByJudges ||
          e.wasTeamDance ||
          e.hadImmunity ||
          e.bonusPoints !== 0
      );

    const result = await submitEpisodeResults({
      weekNumber: selectedEpisode.week_number,
      airsAt: selectedEpisode.airs_at,
      theme: selectedEpisode.theme,
      expectedDanceCount,
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
    { key: "immunity", label: "Immunity" },
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
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Scheduled Episode</Label>
            {sortedEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No episodes scheduled yet — add one under the Set Schedule tab first.
              </p>
            ) : (
              <Select
                items={episodeItems}
                value={selectedEpisodeId}
                onValueChange={(v) => {
                  setOverviewConfirmed(false);
                  setSelectedEpisodeId(v ?? "");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Week" />
                </SelectTrigger>
                <SelectContent>
                  {sortedEpisodes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {episodeItems[e.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedEpisode && (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Week Number</Label>
                <p className="text-sm">{selectedEpisode.week_number}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Air Date</Label>
                <p className="text-sm">{new Date(selectedEpisode.airs_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Theme</Label>
                <p className="text-sm">{selectedEpisode.theme ?? "—"}</p>
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <Label>Dances (per Couple)</Label>
            <Input
              type="number"
              min={1}
              value={expectedDanceCount}
              onChange={(e) => {
                setOverviewConfirmed(false);
                setExpectedDanceCount(Number(e.target.value));
              }}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Judges</Label>
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
          <div className="flex items-center gap-3 sm:col-span-2">
            {overviewConfirmed ? (
              <>
                <span className="text-sm font-medium text-primary">
                  ✓ Episode Overview confirmed
                </span>
                <Button size="sm" variant="ghost" onClick={() => setOverviewConfirmed(false)}>
                  Edit
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setOverviewConfirmed(true)}
                disabled={!selectedEpisodeId}
              >
                Confirm Episode Overview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!overviewConfirmed && (
        <p className="text-sm text-muted-foreground">
          Confirm the Episode Overview above before entering dance results or
          eliminations — those settings apply to every dance result entered
          for this week.
        </p>
      )}

      {overviewConfirmed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Enter Dance Results — Week {weekNumber}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {!editingKey && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isTeamDanceEntry}
                    onChange={(e) => {
                      setIsTeamDanceEntry(e.target.checked);
                      setSelectedCoupleId("");
                      setSelectedTeamCoupleIds(new Set());
                    }}
                  />
                  Team Dance (one combined score for several couples)
                </label>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {isTeamDanceEntry ? (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Couples on this team</Label>
                    <div className="flex flex-wrap gap-3">
                      {availableCouples.map((c) => (
                        <label key={c.id} className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedTeamCoupleIds.has(c.id)}
                            onChange={() => toggleTeamCouple(c.id)}
                          />
                          <CoupleName {...coupleParts(c)} />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}
                <Select
                  items={danceStyleItems}
                  value={selectedDanceStyleId}
                  onValueChange={(v) => setSelectedDanceStyleId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Dance Style" />
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
                    <Label className="text-xs text-muted-foreground">
                      {judgeDisplayNames.get(j.id) ?? j.name}
                    </Label>
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
                  onClick={submitDanceEntry}
                  disabled={
                    (isTeamDanceEntry && !editingKey
                      ? selectedTeamCoupleIds.size === 0
                      : !selectedCoupleId) || !selectedDanceStyleId
                  }
                >
                  {editingKey ? "Save changes" : "Submit"}
                </Button>
                {editingKey && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteDanceSubmission(editingKey)}
                    >
                      Delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEditDanceSubmission}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {submittedDances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dance Results Submitted</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {dancesForOtherWeeks.length > 0 && (
                  <p className="text-sm text-destructive">
                    {dancesForOtherWeeks.length} entr
                    {dancesForOtherWeeks.length === 1 ? "y" : "ies"} below{" "}
                    {dancesForOtherWeeks.length === 1 ? "is" : "are"} tagged for a different week
                    than the one selected above, and won&apos;t be included when you Save
                    results. Edit each one to fix its week, or select that week above.
                  </p>
                )}
                {submittedDances.map((d) => {
                  const styleName =
                    danceStyles.find((s) => s.id === d.danceStyleId)?.name ?? "Unknown";
                  const total = d.judgeScores.reduce((sum, js) => sum + js.score, 0);
                  const weekMismatch = d.weekNumber !== weekNumber;
                  const danceCouple = couples.find((c) => c.id === d.coupleId);
                  return (
                    <div
                      key={d.key}
                      className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm"
                    >
                      <span className={weekMismatch ? "text-destructive" : undefined}>
                        Week {d.weekNumber} —{" "}
                        {danceCouple ? <CoupleName {...coupleParts(danceCouple)} /> : "Unknown"} —{" "}
                        {styleName}: {total}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => startEditDanceSubmission(d)}>
                        Edit
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Elimination — Week {weekNumber}</CardTitle>
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
                    <th className="whitespace-nowrap p-2 text-center">Bonus Pts</th>
                    <th className="whitespace-nowrap p-2 text-center">Bonus Note</th>
                  </tr>
                </thead>
                <tbody>
                  {couples.map((c) => {
                    const coupleBuckets = buckets[c.id] ?? emptyBuckets();
                    const coupleBonus = bonusFor(c.id);
                    return (
                      <tr key={c.id} className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap p-2">
                          <CoupleName {...coupleParts(c)} />
                        </td>
                        {visibleBucketColumns.map((col) => (
                          <td key={col.key} className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={coupleBuckets[col.key]}
                              onChange={() => toggleBucket(c.id, col.key)}
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <Input
                            type="number"
                            className="w-16"
                            value={coupleBonus.points}
                            onChange={(e) => setBonusPoints(c.id, Number(e.target.value))}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            className="w-32"
                            placeholder="e.g. Dance-off win"
                            value={coupleBonus.note}
                            onChange={(e) => setBonusNote(c.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="pt-2 text-xs text-muted-foreground">
                A couple with no box checked is Safe. Bonus points add directly
                to that couple&apos;s weekly score — use for dance-off wins,
                relay wins, or anything else that doesn&apos;t fit a checkbox.
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save results"}
          </Button>
        </>
      )}
    </div>
  );
}
