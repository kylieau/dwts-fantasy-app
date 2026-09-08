"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Couple = { id: string; celebrity_name: string; pro_name: string };
type DanceScore = { episode_id: string; couple_id: string; total_score: number };
type EpisodeResult = {
  episode_id: string;
  couple_id: string;
  outcome: string;
  was_bottom_two: boolean;
  saved_by_judges: boolean;
};
type Episode = { id: string; week_number: number; airs_at: string; status: string; is_finale: boolean };

export function AllResultsView({
  episodes,
  danceScores,
  episodeResults,
  couples,
  coupleDisplayNames,
}: {
  episodes: Episode[];
  danceScores: DanceScore[];
  episodeResults: EpisodeResult[];
  couples: Couple[];
  coupleDisplayNames: Record<string, string>;
}) {
  const [view, setView] = useState<"week" | "couple">("week");

  const scoreTotalByEpisodeCouple = new Map<string, number>();
  for (const s of danceScores) {
    const key = `${s.episode_id}:${s.couple_id}`;
    scoreTotalByEpisodeCouple.set(key, (scoreTotalByEpisodeCouple.get(key) ?? 0) + s.total_score);
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
                score: scoreTotalByEpisodeCouple.get(`${ep.id}:${r.couple_id}`) ?? 0,
              }))
              .sort((a, b) => b.score - a.score);

            return (
              <Card key={ep.id}>
                <CardHeader>
                  <CardTitle>Week {ep.week_number}</CardTitle>
                  <CardDescription>
                    {new Date(ep.airs_at).toLocaleDateString()}
                    {ep.is_finale ? " · Finale" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  {results.map((r) => (
                    <div
                      key={r.couple_id}
                      className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm"
                    >
                      <span>{coupleDisplayNames[r.couple_id] ?? "Unknown"}</span>
                      <span className="text-muted-foreground">
                        {r.score} pts · {r.outcome.replace("_", " ")}
                        {r.was_bottom_two ? " · bottom 2" : ""}
                        {r.saved_by_judges ? " · saved" : ""}
                      </span>
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
            .map((r) => ({
              ...r,
              episode: episodes.find((e) => e.id === r.episode_id),
              score: scoreTotalByEpisodeCouple.get(`${r.episode_id}:${c.id}`) ?? 0,
            }))
            .sort((a, b) => (a.episode?.week_number ?? 0) - (b.episode?.week_number ?? 0));

          return (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{coupleDisplayNames[c.id] ?? `${c.celebrity_name} & ${c.pro_name}`}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {history.map((h, i) => (
                  <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                    <span>Week {h.episode?.week_number}</span>
                    <span className="text-muted-foreground">
                      {h.score} pts · {h.outcome.replace("_", " ")}
                    </span>
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
