import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { computeWeeklyScores } from "@/lib/scoring";

type Outcome = "safe" | "eliminated" | "winner" | "runner_up" | "third_place";

export type EntrySubmission = {
  coupleId: string;
  danceScores: number[];
  outcome: Outcome;
  wasBottomTwo: boolean;
  savedByJudges: boolean;
};

export type EpisodeResultsInput = {
  weekNumber: number;
  airDate: string;
  locksAt: string;
  isEliminationWeek: boolean;
  isFinale: boolean;
  entries: EntrySubmission[];
};

// Takes an already-authorized admin (service-role) client — the caller is
// responsible for verifying profiles.is_super_admin first. Kept separate from
// the 'use server' action so it can be exercised directly in tests without a
// Next.js request context.
export async function applyEpisodeResults(
  admin: SupabaseClient<Database>,
  input: EpisodeResultsInput
): Promise<{ error: string | null }> {
  const { data: episode, error: episodeErr } = await admin
    .from("episodes")
    .upsert(
      {
        week_number: input.weekNumber,
        air_date: input.airDate,
        locks_at: input.locksAt,
        is_elimination_week: input.isEliminationWeek,
        is_finale: input.isFinale,
        status: "completed",
      },
      { onConflict: "week_number" }
    )
    .select()
    .single();

  if (episodeErr) return { error: episodeErr.message };

  await admin.from("dance_scores").delete().eq("episode_id", episode.id);
  await admin.from("episode_results").delete().eq("episode_id", episode.id);

  const danceScoreRows = input.entries.flatMap((e) =>
    e.danceScores.map((score) => ({
      episode_id: episode.id,
      couple_id: e.coupleId,
      total_score: score,
    }))
  );
  if (danceScoreRows.length > 0) {
    const { error } = await admin.from("dance_scores").insert(danceScoreRows);
    if (error) return { error: error.message };
  }

  const outcomeRows = input.entries.map((e) => ({
    episode_id: episode.id,
    couple_id: e.coupleId,
    outcome: e.outcome,
    was_bottom_two: e.wasBottomTwo,
    saved_by_judges: e.savedByJudges,
  }));
  if (outcomeRows.length > 0) {
    const { error } = await admin.from("episode_results").insert(outcomeRows);
    if (error) return { error: error.message };
  }

  for (const e of input.entries) {
    if (e.outcome !== "safe") {
      await admin
        .from("couples")
        .update({
          status: e.outcome,
          elimination_week: e.outcome === "eliminated" ? input.weekNumber : null,
        })
        .eq("id", e.coupleId);
    }
  }

  const { data: leagues, error: leaguesErr } = await admin.from("leagues").select("id");
  if (leaguesErr) return { error: leaguesErr.message };

  const danceScoreInputs = danceScoreRows.map((r) => ({
    coupleId: r.couple_id,
    totalScore: r.total_score,
  }));
  const episodeOutcomeInputs = outcomeRows.map((r) => ({
    coupleId: r.couple_id,
    outcome: r.outcome,
  }));

  for (const league of leagues ?? []) {
    const [{ data: scoringSettings }, { data: rosterSlots }, { data: predictions }] = await Promise.all([
      admin.from("scoring_settings").select("*").eq("league_id", league.id).single(),
      admin
        .from("roster_slots")
        .select("manager_id, couple_id")
        .eq("league_id", league.id)
        .lte("start_week", input.weekNumber)
        .or(`end_week.is.null,end_week.gte.${input.weekNumber}`),
      admin
        .from("predictions")
        .select("manager_id, predicted_eliminated_couple_id, predicted_top_scorer_couple_id")
        .eq("league_id", league.id)
        .eq("episode_id", episode.id),
    ]);

    if (!scoringSettings || !rosterSlots) continue;

    const scores = computeWeeklyScores({
      scoringSettings: {
        judgesScoreMultiplier: scoringSettings.judges_score_multiplier,
        survivalPoints: scoringSettings.survival_points,
        eliminationPredictionPoints: scoringSettings.elimination_prediction_points,
        topScorerPredictionPoints: scoringSettings.top_scorer_prediction_points,
        firstPlacePoints: scoringSettings.first_place_points,
        secondPlacePoints: scoringSettings.second_place_points,
        thirdPlacePoints: scoringSettings.third_place_points,
      },
      rosterSlots: rosterSlots
        .filter((r): r is { manager_id: string; couple_id: string } => r.couple_id !== null)
        .map((r) => ({ managerId: r.manager_id, coupleId: r.couple_id })),
      danceScores: danceScoreInputs,
      episodeOutcomes: episodeOutcomeInputs,
      predictions: (predictions ?? []).map((p) => ({
        managerId: p.manager_id,
        predictedEliminatedCoupleId: p.predicted_eliminated_couple_id,
        predictedTopScorerCoupleId: p.predicted_top_scorer_couple_id,
      })),
      isFinale: input.isFinale,
    });

    if (scores.length === 0) continue;

    const { error: upsertErr } = await admin.from("weekly_manager_scores").upsert(
      scores.map((s) => ({
        league_id: league.id,
        manager_id: s.managerId,
        episode_id: episode.id,
        roster_points: s.rosterPoints,
        prediction_points: s.predictionPoints,
        total_points: s.totalPoints,
      })),
      { onConflict: "league_id,manager_id,episode_id" }
    );
    if (upsertErr) return { error: upsertErr.message };
  }

  return { error: null };
}
