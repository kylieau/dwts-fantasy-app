"use client";

import { useState } from "react";
import { addJudge, addDanceStyle } from "@/app/admin/results/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Named = { id: string; name: string };

export function JudgesDanceStylesManager({
  judges,
  danceStyles,
}: {
  judges: Named[];
  danceStyles: Named[];
}) {
  const [newJudgeName, setNewJudgeName] = useState("");
  const [newDanceStyleName, setNewDanceStyleName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAddJudge() {
    setError(null);
    setBusy(true);
    const result = await addJudge(newJudgeName);
    if (result.error) setError(result.error);
    else setNewJudgeName("");
    setBusy(false);
  }

  async function handleAddDanceStyle() {
    setError(null);
    setBusy(true);
    const result = await addDanceStyle(newDanceStyleName);
    if (result.error) setError(result.error);
    else setNewDanceStyleName("");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Judges</CardTitle>
          <CardDescription>
            Shown as an optional score input on every dance — leave blank for
            judges who didn&apos;t score a given dance (e.g. most weeks for a
            guest judge).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            {judges.map((j) => (
              <p key={j.id} className="text-sm">
                {j.name}
              </p>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Guest Judge Name"
              value={newJudgeName}
              onChange={(e) => setNewJudgeName(e.target.value)}
            />
            <Button onClick={handleAddJudge} disabled={busy || !newJudgeName.trim()}>
              Add judge
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dance Styles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            {danceStyles.map((d) => (
              <p key={d.id} className="text-sm">
                {d.name}
              </p>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New Dance Style"
              value={newDanceStyleName}
              onChange={(e) => setNewDanceStyleName(e.target.value)}
            />
            <Button
              onClick={handleAddDanceStyle}
              disabled={busy || !newDanceStyleName.trim()}
            >
              Add dance style
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
