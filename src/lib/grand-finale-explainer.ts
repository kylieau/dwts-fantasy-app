export type GrandFinaleMethod = "exact_position" | "distance_based" | "binary_tier";

export function explainGrandFinaleMethod(
  method: GrandFinaleMethod,
  distancePenalty: number | null,
  tierSize: number | null,
  pointsPerCorrect: number
): string {
  switch (method) {
    case "exact_position":
      return `Full credit (${pointsPerCorrect}pts) only when you predict a couple's exact elimination position.`;
    case "distance_based":
      return `Full credit (${pointsPerCorrect}pts) for an exact match, minus ${distancePenalty ?? 0}pts for every position you're off.`;
    case "binary_tier":
      return `Full credit (${pointsPerCorrect}pts) for any couple you correctly predict will make the final ${tierSize ?? 0} — order within the top ${tierSize ?? 0} doesn't matter.`;
  }
}
