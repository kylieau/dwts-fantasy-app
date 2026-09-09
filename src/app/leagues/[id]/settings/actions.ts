"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateLeagueSettings(leagueId: string, formData: FormData) {
  const supabase = await createClient();

  const waiverMode = formData.get("waiverMode") as string;
  const rawClaimMethod = formData.get("waiverClaimMethod") as string;

  const { error } = await supabase.rpc("update_league_settings", {
    p_league_id: leagueId,
    p_waiver_mode: waiverMode,
    // The generated RPC arg type doesn't model that this Postgres param accepts
    // NULL (required when waiver_mode is "locked"); the DB happily allows it.
    p_waiver_claim_method: (waiverMode === "waivers" ? rawClaimMethod : null) as string,
    p_pick_time_limit_seconds: Number(formData.get("pickTimeLimitSeconds")),
    p_prediction_lock_hours_before_air: Number(formData.get("predictionLockHoursBeforeAir")),
  });

  if (error) {
    redirect(`/leagues/${leagueId}/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/leagues/${leagueId}/settings`);
  redirect(`/leagues/${leagueId}/settings?message=${encodeURIComponent("League settings saved")}`);
}

export type ScoringCategoriesInput = {
  judgesScoreCategoryEnabled: boolean;
  eliminationsCategoryEnabled: boolean;
  bonusPicksCategoryEnabled: boolean;
  judgesScoreCategoryWeight: number;
  eliminationsCategoryWeight: number;
  bonusPicksCategoryWeight: number;
  judgesScoreStartsWeek: 1 | 2;
  bonusPicksDeadline: string | null;
  bonusPicksScoringMethod: "exact_position" | "distance_based" | "binary_tier" | null;
  bonusPicksDistancePenalty: number | null;
  bonusPicksTierSize: number | null;
};

export async function updateScoringCategories(
  leagueId: string,
  input: ScoringCategoriesInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_scoring_categories", {
    p_league_id: leagueId,
    p_judges_score_category_enabled: input.judgesScoreCategoryEnabled,
    p_eliminations_category_enabled: input.eliminationsCategoryEnabled,
    p_bonus_picks_category_enabled: input.bonusPicksCategoryEnabled,
    p_judges_score_category_weight: input.judgesScoreCategoryWeight,
    p_eliminations_category_weight: input.eliminationsCategoryWeight,
    p_bonus_picks_category_weight: input.bonusPicksCategoryWeight,
    p_judges_score_starts_week: input.judgesScoreStartsWeek,
    p_bonus_picks_deadline: input.bonusPicksDeadline,
    p_bonus_picks_scoring_method: input.bonusPicksScoringMethod,
    p_bonus_picks_distance_penalty: input.bonusPicksDistancePenalty,
    p_bonus_picks_tier_size: input.bonusPicksTierSize,
  });

  if (error) return { error: error.message };

  revalidatePath(`/leagues/${leagueId}/settings`);
  return { error: null };
}

export async function updateScoringSettings(leagueId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_scoring_settings", {
    p_league_id: leagueId,
    p_judges_score_multiplier: Number(formData.get("judgesScoreMultiplier")),
    p_survival_points: Number(formData.get("survivalPoints")),
    p_elimination_prediction_points: Number(formData.get("eliminationPredictionPoints")),
    p_top_scorer_prediction_points: Number(formData.get("topScorerPredictionPoints")),
    p_first_place_points: Number(formData.get("firstPlacePoints")),
    p_second_place_points: Number(formData.get("secondPlacePoints")),
    p_third_place_points: Number(formData.get("thirdPlacePoints")),
  });

  if (error) {
    redirect(`/leagues/${leagueId}/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/leagues/${leagueId}/settings`);
  redirect(`/leagues/${leagueId}/settings?message=${encodeURIComponent("Scoring settings saved")}`);
}
