"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResultsForm } from "@/components/results-form";
import { AllResultsView } from "@/components/all-results-view";
import { ScheduleManager } from "@/components/schedule-manager";
import { JudgesDanceStylesManager } from "@/components/judges-dance-styles-manager";

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
};
type Episode = {
  id: string;
  week_number: number;
  airs_at: string;
  theme: string | null;
  status: string;
  is_finale: boolean;
};

export function AdminResultsTabs({
  activeCouples,
  allCouples,
  activeCoupleDisplayNames,
  allCoupleDisplayNames,
  judges,
  danceStyles,
  episodes,
  danceScores,
  judgeScores,
  episodeResults,
}: {
  activeCouples: Couple[];
  allCouples: Couple[];
  activeCoupleDisplayNames: Record<string, string>;
  allCoupleDisplayNames: Record<string, string>;
  judges: Named[];
  danceStyles: Named[];
  episodes: Episode[];
  danceScores: DanceScore[];
  judgeScores: JudgeScore[];
  episodeResults: EpisodeResult[];
}) {
  const [tab, setTab] = useState<"enter" | "view" | "schedule" | "manage">("enter");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          size="sm"
          variant={tab === "enter" ? "default" : "ghost"}
          onClick={() => setTab("enter")}
        >
          Enter New Results
        </Button>
        <Button
          size="sm"
          variant={tab === "view" ? "default" : "ghost"}
          onClick={() => setTab("view")}
        >
          View All Results
        </Button>
        <Button
          size="sm"
          variant={tab === "schedule" ? "default" : "ghost"}
          onClick={() => setTab("schedule")}
        >
          Set Schedule
        </Button>
        <Button
          size="sm"
          variant={tab === "manage" ? "default" : "ghost"}
          onClick={() => setTab("manage")}
        >
          Additional Settings
        </Button>
      </div>

      {tab === "enter" && (
        <ResultsForm
          couples={activeCouples}
          coupleDisplayNames={activeCoupleDisplayNames}
          judges={judges}
          danceStyles={danceStyles}
          episodes={episodes}
        />
      )}
      {tab === "view" && (
        <AllResultsView
          episodes={episodes}
          danceScores={danceScores}
          judgeScores={judgeScores}
          episodeResults={episodeResults}
          couples={allCouples}
          coupleDisplayNames={allCoupleDisplayNames}
          judges={judges}
          danceStyles={danceStyles}
        />
      )}
      {tab === "schedule" && <ScheduleManager episodes={episodes} />}
      {tab === "manage" && (
        <JudgesDanceStylesManager judges={judges} danceStyles={danceStyles} />
      )}
    </div>
  );
}
