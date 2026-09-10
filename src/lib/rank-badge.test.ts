import { describe, expect, it } from "vitest";
import { getRankBadge } from "./rank-badge";

describe("getRankBadge", () => {
  it("gives medals to the top 3 distinct scores", () => {
    const points = [100, 90, 80, 70, 60];
    expect(getRankBadge(100, points)).toBe("🥇");
    expect(getRankBadge(90, points)).toBe("🥈");
    expect(getRankBadge(80, points)).toBe("🥉");
  });

  it("gives everyone outside the top 3 and not last a neutral icon", () => {
    const points = [100, 90, 80, 70, 60];
    expect(getRankBadge(70, points)).toBe("🚼");
  });

  it("gives last place its own icon, even in the bottom-3 middle", () => {
    const points = [100, 90, 80, 70, 60];
    expect(getRankBadge(60, points)).toBe("🫵🏻🤣");
  });

  it("has last place win out over bronze in a small league", () => {
    const points = [100, 90, 80];
    expect(getRankBadge(100, points)).toBe("🥇");
    expect(getRankBadge(90, points)).toBe("🥈");
    expect(getRankBadge(80, points)).toBe("🫵🏻🤣");
  });

  it("gives every tied-for-last member the last-place icon", () => {
    const points = [100, 50, 50];
    expect(getRankBadge(50, points)).toBe("🫵🏻🤣");
  });

  it("gives every tied-for-a-medal member the same medal", () => {
    const points = [100, 100, 80, 70];
    expect(getRankBadge(100, points)).toBe("🥇");
  });

  it("treats a solo member as first place, not last", () => {
    expect(getRankBadge(0, [0])).toBe("🥇");
  });

  it("treats an all-tied league as everyone in first, not last", () => {
    const points = [0, 0, 0, 0];
    expect(getRankBadge(0, points)).toBe("🥇");
  });
});
