import { Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoupleName } from "@/components/couple-name";
import { buildPeopleDisplayNames, type CoupleNameParts } from "@/lib/couple-display";

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
type Episode = { id: string; week_number: number; airs_at: string; theme: string | null; is_finale: boolean };
type ManagerWeekScore = {
  managerId: string;
  rosterPoints: number;
  predictionPoints: number;
  grandFinalePoints: number;
  totalPoints: number;
};

function noteLabel(r: EpisodeResult): string {
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

export function WeeklyResultsView({
  episodes,
  episodeResults,
  danceScores,
  judgeScores,
  judges,
  danceStyles,
  couples,
  coupleDisplayNames,
  nameByManager,
  scoresByEpisode,
  danceCardOn,
  curtainCallOn,
  grandFinaleOn,
}: {
  episodes: Episode[];
  episodeResults: EpisodeResult[];
  danceScores: DanceScore[];
  judgeScores: JudgeScore[];
  judges: Named[];
  danceStyles: Named[];
  couples: Couple[];
  coupleDisplayNames: Record<string, CoupleNameParts>;
  nameByManager: Record<string, string>;
  scoresByEpisode: Record<string, ManagerWeekScore[]>;
  danceCardOn: boolean;
  curtainCallOn: boolean;
  grandFinaleOn: boolean;
}) {
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

  if (episodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Results</CardTitle>
          <CardDescription>No results entered yet this season.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {episodes.map((ep) => {
        const outcomes = episodeResults
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

        const managerScores = [...(scoresByEpisode[ep.id] ?? [])].sort((a, b) => b.totalPoints - a.totalPoints);

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
            <CardContent className="flex flex-col gap-5">
              {managerScores.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="p-2 font-medium">Manager</th>
                        {danceCardOn && <th className="p-2 font-medium">Dance Card</th>}
                        {curtainCallOn && <th className="p-2 font-medium">Curtain Call</th>}
                        {grandFinaleOn && <th className="p-2 font-medium">Grand Finale</th>}
                        <th className="p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managerScores.map((s) => (
                        <tr key={s.managerId} className="border-b border-border last:border-b-0">
                          <td className="whitespace-nowrap p-2">{nameByManager[s.managerId] ?? "Unknown"}</td>
                          {danceCardOn && <td className="p-2">{s.rosterPoints}</td>}
                          {curtainCallOn && <td className="p-2">{s.predictionPoints}</td>}
                          {grandFinaleOn && <td className="p-2">{s.grandFinalePoints}</td>}
                          <td className="p-2 font-medium">{s.totalPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="p-2 font-medium">Couple</th>
                      <th className="p-2 font-medium">Pts</th>
                      <th className="p-2 font-medium">Outcome</th>
                      <th className="p-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outcomes.map((r) => (
                      <Fragment key={r.couple_id}>
                        <tr className={r.dances.length === 0 ? "border-b border-border last:border-b-0" : undefined}>
                          <td className="whitespace-nowrap p-2">
                            {r.parts ? <CoupleName {...r.parts} /> : "Unknown"}
                          </td>
                          <td className="p-2">{r.total}</td>
                          <td className="whitespace-nowrap p-2 capitalize">{r.outcome.replace("_", " ")}</td>
                          <td className="p-2 text-muted-foreground">{noteLabel(r) || "—"}</td>
                        </tr>
                        {r.dances.map((d, i) => {
                          const scores = judgeScoresByDance.get(d.id) ?? [];
                          const values = scores.map((s) => s.score);
                          const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
                          const isLast = i === r.dances.length - 1;
                          return (
                            <tr key={d.id} className={isLast ? "border-b border-border last:border-b-0" : undefined}>
                              <td colSpan={4} className="px-2 pb-1.5 pl-6">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted-foreground">
                                  <span>
                                    {danceStyleById.get(d.dance_style_id) ?? "Unknown dance"}: {d.total_score}
                                    {scores.length > 0 && (
                                      <>
                                        {" "}
                                        ({scores.map((s) => `${judgeById.get(s.judge_id) ?? "?"}: ${s.score}`).join(", ")})
                                      </>
                                    )}
                                  </span>
                                  {spread > 0 && <span>spread: {spread}</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
