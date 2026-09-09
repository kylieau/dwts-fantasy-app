import { describe, expect, it } from "vitest";
import { computeWeeklyScores, type ScoringSettings } from "./scoring";

const settings: ScoringSettings = {
  judgesScoreMultiplier: 1,
  survivalPoints: 10,
  eliminationPredictionPoints: 20,
  topScorerPredictionPoints: 15,
  firstPlacePoints: 100,
  secondPlacePoints: 50,
  thirdPlacePoints: 25,
};

describe("computeWeeklyScores", () => {
  it("scores a single-dance week: roster points + survival, no points for the eliminated couple's owner", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [
        { managerId: "alice", coupleId: "couple-1" },
        { managerId: "bob", coupleId: "couple-2" },
      ],
      danceScores: [
        { coupleId: "couple-1", totalScore: 24 },
        { coupleId: "couple-2", totalScore: 18 },
      ],
      episodeOutcomes: [
        { coupleId: "couple-1", outcome: "safe", bonusPoints: 0 },
        { coupleId: "couple-2", outcome: "eliminated", bonusPoints: 0 },
      ],
      predictions: [],
      isFinale: false,
    });

    const alice = result.find((r) => r.managerId === "alice")!;
    const bob = result.find((r) => r.managerId === "bob")!;

    expect(alice.rosterPoints).toBe(24 + 10); // dance score + survival
    expect(bob.rosterPoints).toBe(18); // eliminated: dance score only, no survival
  });

  it("sums multiple dances for the same couple in a multi-dance week", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [{ managerId: "alice", coupleId: "couple-1" }],
      danceScores: [
        { coupleId: "couple-1", totalScore: 24 },
        { coupleId: "couple-1", totalScore: 27 },
      ],
      episodeOutcomes: [{ coupleId: "couple-1", outcome: "safe", bonusPoints: 0 }],
      predictions: [],
      isFinale: false,
    });

    expect(result[0].rosterPoints).toBe(24 + 27 + 10);
  });

  it("a judges'-save override (bottom two but saved) still counts as survived, not eliminated", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [{ managerId: "alice", coupleId: "couple-1" }],
      danceScores: [{ coupleId: "couple-1", totalScore: 20 }],
      // was_bottom_two/saved_by_judges are historical flags the DB stores, but
      // the scoring function only looks at the final `outcome` — this couple
      // was in the bottom two and saved by judges, so outcome is "safe".
      episodeOutcomes: [{ coupleId: "couple-1", outcome: "safe", bonusPoints: 0 }],
      predictions: [
        { managerId: "bob", predictedEliminatedCoupleId: "couple-1", predictedTopScorerCoupleId: null },
      ],
      isFinale: false,
    });

    const alice = result.find((r) => r.managerId === "alice")!;
    const bob = result.find((r) => r.managerId === "bob")!;

    expect(alice.rosterPoints).toBe(20 + 10); // survived despite bottom-two
    expect(bob.predictionPoints).toBe(0); // predicted elimination was wrong
  });

  it("awards podium bonuses at the finale on top of dance score and survival", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [
        { managerId: "alice", coupleId: "winner-couple" },
        { managerId: "bob", coupleId: "runner-up-couple" },
        { managerId: "carol", coupleId: "third-couple" },
      ],
      danceScores: [
        { coupleId: "winner-couple", totalScore: 30 },
        { coupleId: "runner-up-couple", totalScore: 29 },
        { coupleId: "third-couple", totalScore: 28 },
      ],
      episodeOutcomes: [
        { coupleId: "winner-couple", outcome: "winner", bonusPoints: 0 },
        { coupleId: "runner-up-couple", outcome: "runner_up", bonusPoints: 0 },
        { coupleId: "third-couple", outcome: "third_place", bonusPoints: 0 },
      ],
      predictions: [],
      isFinale: true,
    });

    const alice = result.find((r) => r.managerId === "alice")!;
    const bob = result.find((r) => r.managerId === "bob")!;
    const carol = result.find((r) => r.managerId === "carol")!;

    expect(alice.rosterPoints).toBe(30 + 10 + 100); // dance + survival + 1st
    expect(bob.rosterPoints).toBe(29 + 10 + 50); // dance + survival + 2nd
    expect(carol.rosterPoints).toBe(28 + 10 + 25); // dance + survival + 3rd
  });

  it("does not award podium bonuses outside the finale, even for a 'winner' outcome", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [{ managerId: "alice", coupleId: "couple-1" }],
      danceScores: [{ coupleId: "couple-1", totalScore: 30 }],
      episodeOutcomes: [{ coupleId: "couple-1", outcome: "winner", bonusPoints: 0 }],
      predictions: [],
      isFinale: false,
    });

    expect(result[0].rosterPoints).toBe(30 + 10);
  });

  it("a withdrawal earns no survival points and doesn't resolve an Eliminated prediction as correct", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [{ managerId: "alice", coupleId: "couple-1" }],
      danceScores: [],
      episodeOutcomes: [{ coupleId: "couple-1", outcome: "withdrawn", bonusPoints: 0 }],
      predictions: [
        { managerId: "bob", predictedEliminatedCoupleId: "couple-1", predictedTopScorerCoupleId: null },
      ],
      isFinale: false,
    });

    const alice = result.find((r) => r.managerId === "alice")!;
    const bob = result.find((r) => r.managerId === "bob")!;

    expect(alice.rosterPoints).toBe(0); // no dance, no survival bonus
    expect(bob.predictionPoints).toBe(0); // withdrawal isn't a resolved "Eliminated" guess
  });

  it("a bye week earns no survival points but isn't a wrong Eliminated guess either", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [{ managerId: "alice", coupleId: "couple-1" }],
      danceScores: [],
      episodeOutcomes: [{ coupleId: "couple-1", outcome: "bye", bonusPoints: 0 }],
      predictions: [],
      isFinale: false,
    });

    expect(result[0].rosterPoints).toBe(0);
  });

  it("adds bonus points directly to that couple's roster points, independent of survival/podium", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [{ managerId: "alice", coupleId: "couple-1" }],
      danceScores: [{ coupleId: "couple-1", totalScore: 20 }],
      episodeOutcomes: [{ coupleId: "couple-1", outcome: "safe", bonusPoints: 3 }],
      predictions: [],
      isFinale: false,
    });

    expect(result[0].rosterPoints).toBe(20 + 10 + 3); // dance + survival + dance-off bonus
  });

  it("awards top-scorer prediction points independent of roster ownership", () => {
    const result = computeWeeklyScores({
      scoringSettings: settings,
      rosterSlots: [],
      danceScores: [
        { coupleId: "couple-1", totalScore: 24 },
        { coupleId: "couple-2", totalScore: 27 },
      ],
      episodeOutcomes: [
        { coupleId: "couple-1", outcome: "safe", bonusPoints: 0 },
        { coupleId: "couple-2", outcome: "safe", bonusPoints: 0 },
      ],
      predictions: [
        { managerId: "alice", predictedEliminatedCoupleId: null, predictedTopScorerCoupleId: "couple-2" },
        { managerId: "bob", predictedEliminatedCoupleId: null, predictedTopScorerCoupleId: "couple-1" },
      ],
      isFinale: false,
    });

    const alice = result.find((r) => r.managerId === "alice")!;
    const bob = result.find((r) => r.managerId === "bob")!;

    expect(alice.predictionPoints).toBe(15);
    expect(bob.predictionPoints).toBe(0);
  });
});
