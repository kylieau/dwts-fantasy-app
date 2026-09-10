import { describe, expect, it } from "vitest";
import { getStandingMessage } from "./standings-message";

function placementFor(rank: number, totalMembers: number, ties: { first?: boolean; last?: boolean } = {}) {
  return getStandingMessage({
    rank,
    totalMembers,
    isTiedForFirst: !!ties.first,
    isTiedForLast: !!ties.last,
    seed: "seed",
  }).placement;
}

describe("getStandingMessage tiers", () => {
  it("labels first and last place in a large league", () => {
    expect(placementFor(1, 10)).toMatch(/first place/);
    expect(placementFor(10, 10)).toMatch(/last place/);
    expect(placementFor(2, 10)).toMatch(/second place/);
    expect(placementFor(9, 10)).toMatch(/last place/); // close-to-last variant
    expect(placementFor(5, 10)).toMatch(/middle/);
  });

  it("prioritizes tie variants over the plain tier", () => {
    expect(placementFor(1, 4, { first: true })).toMatch(/tied for first/);
    expect(placementFor(4, 4, { last: true })).toMatch(/tied for last/);
  });

  it("collapses tiers gracefully for a 2-person league", () => {
    expect(placementFor(1, 2)).toMatch(/first place/);
    expect(placementFor(2, 2)).toMatch(/last place/);
  });

  it("collapses tiers gracefully for a 3-person league", () => {
    expect(placementFor(1, 3)).toMatch(/first place/);
    expect(placementFor(2, 3)).toMatch(/second place/);
    expect(placementFor(3, 3)).toMatch(/last place/);
  });

  it("has room for a close-to-last tier once the league is big enough", () => {
    expect(placementFor(3, 5)).toMatch(/middle/);
    expect(placementFor(4, 5)).not.toBe(placementFor(5, 5)); // close-to-last is distinct from last
  });

  it("returns a solo member as first place", () => {
    expect(placementFor(1, 1)).toMatch(/first place/);
  });

  it("rotates variants based on the seed", () => {
    const seeds = ["a", "b", "c", "d", "e", "f"];
    const comments = new Set(
      seeds.map(
        (seed) =>
          getStandingMessage({ rank: 1, totalMembers: 10, isTiedForFirst: false, isTiedForLast: false, seed })
            .comment
      )
    );
    expect(comments.size).toBeGreaterThan(1);
  });
});
