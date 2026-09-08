"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResultsForm } from "@/components/results-form";
import { AllResultsView } from "@/components/all-results-view";

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

export function AdminResultsTabs({
  activeCouples,
  allCouples,
  activeCoupleDisplayNames,
  allCoupleDisplayNames,
  episodes,
  danceScores,
  episodeResults,
}: {
  activeCouples: Couple[];
  allCouples: Couple[];
  activeCoupleDisplayNames: Record<string, string>;
  allCoupleDisplayNames: Record<string, string>;
  episodes: Episode[];
  danceScores: DanceScore[];
  episodeResults: EpisodeResult[];
}) {
  const [tab, setTab] = useState<"enter" | "view">("enter");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Admin — Results</h1>
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
      </div>

      {tab === "enter" ? (
        <ResultsForm couples={activeCouples} coupleDisplayNames={activeCoupleDisplayNames} />
      ) : (
        <AllResultsView
          episodes={episodes}
          danceScores={danceScores}
          episodeResults={episodeResults}
          couples={allCouples}
          coupleDisplayNames={allCoupleDisplayNames}
        />
      )}
    </div>
  );
}
