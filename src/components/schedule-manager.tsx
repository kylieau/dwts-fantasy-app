"use client";

import { useState } from "react";
import { scheduleEpisode } from "@/app/admin/results/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrowserTimeZone, airsAtToUtcIso } from "@/lib/use-browser-time-zone";

type Episode = {
  id: string;
  week_number: number;
  airs_at: string;
  theme: string | null;
  is_elimination_week: boolean;
  is_finale: boolean;
};

// Converts a stored UTC timestamp back into the datetime-local input format
// (no timezone suffix, minute precision) in the viewer's own time zone.
function utcIsoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleManager({ episodes }: { episodes: Episode[] }) {
  const sortedEpisodes = [...episodes].sort((a, b) => a.week_number - b.week_number);
  const browserTimeZone = useBrowserTimeZone();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState(
    sortedEpisodes.length > 0 ? sortedEpisodes[sortedEpisodes.length - 1].week_number + 1 : 1
  );
  const [airsAt, setAirsAt] = useState("");
  const [theme, setTheme] = useState("");
  const [isEliminationWeek, setIsEliminationWeek] = useState(true);
  const [isFinale, setIsFinale] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(e: Episode) {
    setEditingId(e.id);
    setWeekNumber(e.week_number);
    setAirsAt(utcIsoToLocalInput(e.airs_at));
    setTheme(e.theme ?? "");
    setIsEliminationWeek(e.is_elimination_week);
    setIsFinale(e.is_finale);
  }

  function resetForm() {
    setEditingId(null);
    setWeekNumber(
      sortedEpisodes.length > 0 ? sortedEpisodes[sortedEpisodes.length - 1].week_number + 1 : 1
    );
    setAirsAt("");
    setTheme("");
    setIsEliminationWeek(true);
    setIsFinale(false);
  }

  async function handleSave() {
    setError(null);
    const airsAtUtc = airsAtToUtcIso(airsAt);
    if (!airsAtUtc) {
      setError("Enter a valid air date.");
      return;
    }

    setSubmitting(true);
    const result = await scheduleEpisode({
      weekNumber,
      airsAt: airsAtUtc,
      theme: theme.trim() || null,
      isEliminationWeek,
      isFinale,
    });
    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Scheduled Episode" : "Schedule a New Episode"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Week Number</Label>
              <Input
                type="number"
                min={1}
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Air Date{browserTimeZone ? ` (${browserTimeZone})` : ""}</Label>
              <Input
                type="datetime-local"
                value={airsAt}
                onChange={(e) => setAirsAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Theme Night</Label>
              <Input
                placeholder="e.g. Villains Night"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isEliminationWeek}
                  onChange={(e) => setIsEliminationWeek(e.target.checked)}
                />
                Elimination Week
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
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={submitting || !airsAt}>
              {submitting ? "Saving..." : editingId ? "Save changes" : "Add to schedule"}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Episodes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sortedEpisodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
          ) : (
            sortedEpisodes.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm"
              >
                <span>
                  Week {e.week_number}
                  {e.theme ? ` — ${e.theme}` : ""} — {new Date(e.airs_at).toLocaleString()}
                  {e.is_finale ? " · Finale" : !e.is_elimination_week ? " · No elimination" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={() => startEdit(e)}>
                  Edit
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
