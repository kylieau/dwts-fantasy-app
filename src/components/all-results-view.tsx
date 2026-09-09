"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPeopleDisplayNames, type CoupleNameParts } from "@/lib/couple-display";
import { CoupleName } from "@/components/couple-name";

type Couple = { id: string; celebrity_name: string; pro_name: string };
type Named = { id: string; name: string };
type DanceScore = {
  id: string;
  episode_id: string;
  couple_id: string;
  dance_style_id: string;
  total_score: number;
};
type JudgeScore = { dance_score_id: string; judge_id: string; score: number };
type EpisodeResult = {
  episode_id: string;
  couple_id: string;
  outcome: string;
  was_bottom_two: boolean;
  was_bottom_three: boolean;
  saved_by_judges: boolean;
  was_team_dance: boolean;
  had_immunity: boolean;
  bonus_points: number;
  bonus_note: string | null;
};
type Episode = {
  id: string;
  week_number: number;
  airs_at: string;
  theme: string | null;
  status: string;
  is_finale: boolean;
};

export function AllResultsView({
  episodes,
  danceScores,
  judgeScores,
  episodeResults,
  couples,
  coupleDisplayNames,
  judges,
  danceStyles,
}: {
  episodes: Episode[];
  danceScores: DanceScore[];
  judgeScores: JudgeScore[];
  episodeResults: EpisodeResult[];
  couples: Couple[];
  coupleDisplayNames: Record<string, CoupleNameParts>;
  judges: Named[];
  danceStyles: Named[];
}) {
  const [view, setView] = useState<"week" | "couple">("week");

  const danceStyleById = new Map(danceStyles.map((d) => [d.id, d.name]));
  const judgeById = buildPeopleDisplayNames(judges);
  const couplesById = new Map(couples.map((c) => [c.id, c]));

  function coupleParts(coupleId: string): CoupleNameParts | null {
    if (coupleDisplayNames[coupleId]) return coupleDisplayNames[coupleId];
    const c = couplesById.get(coupleId);
    return c ? { celebrity: c.celebrity_name, pro: c.pro_name } : null;
  }

  const judgeScoresByDance = new Map<string, JudgeScore[]>();
  for (const js of judgeScores) {
    const list = judgeScoresByDance.get(js.dance_score_id) ?? [];
    list.push(js);
    judgeScoresByDance.set(js.dance_score_id, list);
  }

  const danceScoresByEpisodeCouple = new Map<string, DanceScore[]>();
  for (const ds of danceScores) {
    const key = `${ds.episode_id}:${ds.couple_id}`;
    const list = danceScoresByEpisodeCouple.get(key) ?? [];
    list.push(ds);
    danceScoresByEpisodeCouple.set(key, list);
  }

  function noteLabel(r: EpisodeResult) {
    const notes: string[] = [];
    if (r.was_bottom_two) notes.push("bottom 2");
    if (r.was_bottom_three) notes.push("bottom 3");
    if (r.saved_by_judges) notes.push("judges' save");
    if (r.was_team_dance) notes.push("team dance");
    if (r.had_immunity) notes.push("immunity");
    if (r.bonus_points) {
      notes.push(`+${r.bonus_points} bonus${r.bonus_note ? ` (${r.bonus_note})` : ""}`);
    }
    return notes.join(", ");
  }

  function DanceBreakdown({ dance }: { dance: DanceScore }) {
    const scores = judgeScoresByDance.get(dance.id) ?? [];
    const values = scores.map((s) => s.score);
    const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
    return (
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 pl-4 text-xs text-muted-foreground">
        <span>
          {danceStyleById.get(dance.dance_style_id) ?? "Unknown dance"}: {dance.total_score}
          {scores.length > 0 && (
            <>
              {" "}
              ({scores.map((s) => `${judgeById.get(s.judge_id) ?? "?"}: ${s.score}`).join(", ")})
            </>
          )}
        </span>
        {spread > 0 && <span>spread: {spread}</span>}
      </div>
    );
  }

  const completedEpisodes = episodes
    .filter((e) => e.status === "completed")
    .sort((a, b) => b.week_number - a.week_number);

  const coupleIdsWithResults = new Set(episodeResults.map((r) => r.couple_id));
  const couplesWithHistory = couples
    .filter((c) => coupleIdsWithResults.has(c.id))
    .sort((a, b) => a.celebrity_name.localeCompare(b.celebrity_name));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={view === "week" ? "default" : "outline"}
          onClick={() => setView("week")}
        >
          By week
        </Button>
        <Button
          size="sm"
          variant={view === "couple" ? "default" : "outline"}
          onClick={() => setView("couple")}
        >
          By couple
        </Button>
      </div>

      {view === "week" ? (
        completedEpisodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No results entered yet.</p>
        ) : (
          completedEpisodes.map((ep) => {
            const results = episodeResults
              .filter((r) => r.episode_id === ep.id)
              .map((r) => ({
                ...r,
                parts: coupleParts(r.couple_id),
                dances: danceScoresByEpisodeCouple.get(`${ep.id}:${r.couple_id}`) ?? [],
                total: (danceScoresByEpisodeCouple.get(`${ep.id}:${r.couple_id}`) ?? []).reduce(
                  (sum, d) => sum + d.total_score,
                  0
                ),
              }))
              .sort((a, b) => b.total - a.total);

            return (
              <Card key={ep.id}>
                <CardHeader>
                  <CardTitle>
                    Week {ep.week_number}
                    {ep.theme ? ` — ${ep.theme}` : ""}
                  </CardTitle>
                  <CardDescription>
                    {new Date(ep.airs_at).toLocaleDateString()}
                    {ep.is_finale ? " · Finale" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {results.map((r) => (
                    <div key={r.couple_id} className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                        <span>{r.parts ? <CoupleName {...r.parts} /> : "Unknown"}</span>
                        <span className="text-muted-foreground">
                          {r.total} pts · {r.outcome.replace("_", " ")}
                          {noteLabel(r) ? ` · ${noteLabel(r)}` : ""}
                        </span>
                      </div>
                      {r.dances.map((d) => (
                        <DanceBreakdown key={d.id} dance={d} />
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        )
      ) : couplesWithHistory.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results entered yet.</p>
      ) : (
        couplesWithHistory.map((c) => {
          const history = episodeResults
            .filter((r) => r.couple_id === c.id)
            .map((r) => {
              const dances = danceScoresByEpisodeCouple.get(`${r.episode_id}:${c.id}`) ?? [];
              return {
                ...r,
                episode: episodes.find((e) => e.id === r.episode_id),
                dances,
                total: dances.reduce((sum, d) => sum + d.total_score, 0),
              };
            })
            .sort((a, b) => (a.episode?.week_number ?? 0) - (b.episode?.week_number ?? 0));

          return (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>
                  <CoupleName {...(coupleDisplayNames[c.id] ?? { celebrity: c.celebrity_name, pro: c.pro_name })} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                      <span>
                        Week {h.episode?.week_number}
                        {h.episode?.theme ? ` — ${h.episode.theme}` : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {h.total} pts · {h.outcome.replace("_", " ")}
                        {noteLabel(h) ? ` · ${noteLabel(h)}` : ""}
                      </span>
                    </div>
                    {h.dances.map((d) => (
                      <DanceBreakdown key={d.id} dance={d} />
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
