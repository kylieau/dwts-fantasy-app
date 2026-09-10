import { describe, expect, it } from "vitest";
import { getStandingMessage, resolveStandingTier } from "./standings-message";

describe("resolveStandingTier", () => {
  it("labels first and last place in a large league", () => {
    expect(resolveStandingTier(1, 10, false, false, false)).toBe("first");
    expect(resolveStandingTier(10, 10, false, false, false)).toBe("last");
    expect(resolveStandingTier(2, 10, false, false, false)).toBe("second");
    expect(resolveStandingTier(9, 10, false, false, false)).toBe("close-to-last");
    expect(resolveStandingTier(5, 10, false, false, false)).toBe("middle");
  });

  it("prioritizes pre-season over every other signal", () => {
    expect(resolveStandingTier(1, 10, true, false, true)).toBe("pre-season");
    expect(resolveStandingTier(10, 10, false, true, true)).toBe("pre-season");
  });

  it("prioritizes tie variants over the plain tier", () => {
    expect(resolveStandingTier(1, 4, true, false, false)).toBe("tied-first");
    expect(resolveStandingTier(4, 4, false, true, false)).toBe("tied-last");
  });

  it("collapses tiers gracefully for a 2-person league", () => {
    expect(resolveStandingTier(1, 2, false, false, false)).toBe("first");
    expect(resolveStandingTier(2, 2, false, false, false)).toBe("last");
  });

  it("collapses tiers gracefully for a 3-person league", () => {
    expect(resolveStandingTier(1, 3, false, false, false)).toBe("first");
    expect(resolveStandingTier(2, 3, false, false, false)).toBe("second");
    expect(resolveStandingTier(3, 3, false, false, false)).toBe("last");
  });

  it("has room for a close-to-last tier once the league is big enough", () => {
    expect(resolveStandingTier(3, 5, false, false, false)).toBe("middle");
    expect(resolveStandingTier(4, 5, false, false, false)).toBe("close-to-last");
    expect(resolveStandingTier(5, 5, false, false, false)).toBe("last");
  });

  it("returns a solo member as first place", () => {
    expect(resolveStandingTier(1, 1, false, false, false)).toBe("first");
  });
});

describe("getStandingMessage", () => {
  it("returns non-empty copy for every tier", () => {
    const cases: [number, number, boolean, boolean, boolean][] = [
      [1, 10, false, false, false],
      [1, 10, true, false, false],
      [2, 10, false, false, false],
      [5, 10, false, false, false],
      [9, 10, false, false, false],
      [10, 10, false, false, false],
      [10, 10, false, true, false],
      [1, 10, false, false, true],
    ];
    for (const [rank, totalMembers, isTiedForFirst, isTiedForLast, isPreSeason] of cases) {
      const message = getStandingMessage({ rank, totalMembers, isTiedForFirst, isTiedForLast, isPreSeason });
      expect(message.placement.length).toBeGreaterThan(0);
    }
  });

  it("rotates variants randomly across calls", () => {
    const comments = new Set(
      Array.from(
        { length: 30 },
        () => getStandingMessage({ rank: 1, totalMembers: 10, isTiedForFirst: false, isTiedForLast: false, isPreSeason: false }).comment
      )
    );
    expect(comments.size).toBeGreaterThan(1);
  });

  it("only ever returns pre-season copy while pre-season, regardless of rank", () => {
    for (let i = 0; i < 20; i++) {
      const message = getStandingMessage({
        rank: 1,
        totalMembers: 10,
        isTiedForFirst: true,
        isTiedForLast: false,
        isPreSeason: true,
      });
      expect(message.placement).not.toMatch(/first place/);
    }
  });
});
