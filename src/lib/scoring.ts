export type ScoringSettings = {
  judgesScoreMultiplier: number;
  survivalPoints: number;
  eliminationPredictionPoints: number;
  topScorerPredictionPoints: number;
  firstPlacePoints: number;
  secondPlacePoints: number;
  thirdPlacePoints: number;
};

export type RosterSlot = { managerId: string; coupleId: string };

export type DanceScore = { coupleId: string; totalScore: number };

export type Outcome =
  | "safe"
  | "eliminated"
  | "withdrawn"
  | "bye"
  | "winner"
  | "runner_up"
  | "third_place";

export type EpisodeOutcome = {
  coupleId: string;
  outcome: Outcome;
  bonusPoints: number;
};

export type Prediction = {
  managerId: string;
  predictedEliminatedCoupleId: string | null;
  predictedTopScorerCoupleId: string | null;
};

export type WeeklyManagerScore = {
  managerId: string;
  rosterPoints: number;
  predictionPoints: number;
  totalPoints: number;
};

const PODIUM_POINTS_KEY: Record<string, keyof ScoringSettings> = {
  winner: "firstPlacePoints",
  runner_up: "secondPlacePoints",
  third_place: "thirdPlacePoints",
};

// Anything else (safe, winner, runner_up, third_place) earns survival points.
// eliminated: voted off. withdrawn: left mid-season (injury etc.) — didn't
// complete the week, but it's nobody's fault, so just no bonus rather than
// treating it like a vote-off. bye: sat out but still competing overall —
// also no bonus for a week they didn't dance, but see NO_SURVIVAL_OUTCOMES
// vs. the couples.status sync in applyEpisodeResults, where bye is different
// again (doesn't open the roster slot, unlike eliminated/withdrawn).
const NO_SURVIVAL_OUTCOMES = new Set<Outcome>(["eliminated", "withdrawn", "bye"]);

// Pure and DB-free by design: the caller is responsible for fetching
// already-week-scoped data (e.g. only roster_slots active this week) — this
// function just does the arithmetic, which is what makes it unit-testable
// without a database.
export function computeWeeklyScores({
  scoringSettings,
  rosterSlots,
  danceScores,
  episodeOutcomes,
  predictions,
  isFinale,
}: {
  scoringSettings: ScoringSettings;
  rosterSlots: RosterSlot[];
  danceScores: DanceScore[];
  episodeOutcomes: EpisodeOutcome[];
  predictions: Prediction[];
  isFinale: boolean;
}): WeeklyManagerScore[] {
  const coupleTotalScore = new Map<string, number>();
  for (const { coupleId, totalScore } of danceScores) {
    coupleTotalScore.set(coupleId, (coupleTotalScore.get(coupleId) ?? 0) + totalScore);
  }

  const outcomeByCouple = new Map(episodeOutcomes.map((o) => [o.coupleId, o.outcome]));
  const bonusPointsByCouple = new Map(episodeOutcomes.map((o) => [o.coupleId, o.bonusPoints]));

  const highestScore = Math.max(0, ...coupleTotalScore.values());
  const topScorerCoupleIds = new Set(
    [...coupleTotalScore.entries()]
      .filter(([, score]) => score === highestScore && highestScore > 0)
      .map(([coupleId]) => coupleId)
  );

  const eliminatedCoupleIds = new Set(
    episodeOutcomes.filter((o) => o.outcome === "eliminated").map((o) => o.coupleId)
  );

  const rosterPointsByManager = new Map<string, number>();
  for (const { managerId, coupleId } of rosterSlots) {
    let points = (coupleTotalScore.get(coupleId) ?? 0) * scoringSettings.judgesScoreMultiplier;

    const outcome = outcomeByCouple.get(coupleId);
    if (outcome && !NO_SURVIVAL_OUTCOMES.has(outcome)) {
      points += scoringSettings.survivalPoints;
    }

    if (isFinale && outcome && outcome in PODIUM_POINTS_KEY) {
      points += scoringSettings[PODIUM_POINTS_KEY[outcome]];
    }

    points += bonusPointsByCouple.get(coupleId) ?? 0;

    rosterPointsByManager.set(managerId, (rosterPointsByManager.get(managerId) ?? 0) + points);
  }

  const predictionPointsByManager = new Map<string, number>();
  for (const p of predictions) {
    let points = 0;
    if (p.predictedEliminatedCoupleId && eliminatedCoupleIds.has(p.predictedEliminatedCoupleId)) {
      points += scoringSettings.eliminationPredictionPoints;
    }
    if (p.predictedTopScorerCoupleId && topScorerCoupleIds.has(p.predictedTopScorerCoupleId)) {
      points += scoringSettings.topScorerPredictionPoints;
    }
    predictionPointsByManager.set(
      p.managerId,
      (predictionPointsByManager.get(p.managerId) ?? 0) + points
    );
  }

  const managerIds = new Set([...rosterPointsByManager.keys(), ...predictionPointsByManager.keys()]);

  return [...managerIds].map((managerId) => {
    const rosterPoints = rosterPointsByManager.get(managerId) ?? 0;
    const predictionPoints = predictionPointsByManager.get(managerId) ?? 0;
    return {
      managerId,
      rosterPoints,
      predictionPoints,
      totalPoints: rosterPoints + predictionPoints,
    };
  });
}
