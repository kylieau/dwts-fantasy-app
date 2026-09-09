import { describe, expect, it } from "vitest";
import {
  buildCoupleDisplayNames,
  buildPeopleDisplayNames,
  formatCoupleName,
  sortJudgesForDisplay,
} from "./couple-display";

describe("buildCoupleDisplayNames", () => {
  it("shows first name only when there's no collision", () => {
    const couples = [
      { id: "1", celebrity_name: "Tatyana Ali", pro_name: "Jan Ravnik" },
      { id: "2", celebrity_name: "Tyler Cameron", pro_name: "Sharna Burgess" },
    ];
    const names = buildCoupleDisplayNames(couples);
    expect(names.get("1")).toEqual({ celebrity: "Tatyana", pro: "Jan" });
    expect(names.get("2")).toEqual({ celebrity: "Tyler", pro: "Sharna" });
  });

  it("disambiguates Connor/Conner with a last initial despite different spelling", () => {
    const couples = [
      { id: "1", celebrity_name: "Conner Leavitt", pro_name: "Adele Zaikman" },
      { id: "2", celebrity_name: "Connor Wood", pro_name: "Rylee Arnold" },
    ];
    const names = buildCoupleDisplayNames(couples);
    expect(names.get("1")).toEqual({ celebrity: "Conner L.", pro: "Adele" });
    expect(names.get("2")).toEqual({ celebrity: "Connor W.", pro: "Rylee" });
  });

  it("keeps a known compound first name together instead of splitting on whitespace", () => {
    const couples = [
      { id: "1", celebrity_name: "Sarah Jane Nader", pro_name: "Hailey Bills" },
    ];
    const names = buildCoupleDisplayNames(couples);
    expect(names.get("1")).toEqual({ celebrity: "Sarah Jane", pro: "Hailey" });
  });

  it("disambiguates an exact first-name collision", () => {
    const couples = [
      { id: "1", celebrity_name: "Jordan Smith", pro_name: "Alan Bersten" },
      { id: "2", celebrity_name: "Jordan Chiles", pro_name: "Val Chmerkovskiy" },
    ];
    const names = buildCoupleDisplayNames(couples);
    expect(names.get("1")).toEqual({ celebrity: "Jordan S.", pro: "Alan" });
    expect(names.get("2")).toEqual({ celebrity: "Jordan C.", pro: "Val" });
  });

  it("checks celebrity and pro pools independently", () => {
    // Two celebrities share a first name, but the pros don't collide with
    // anyone — pros should stay first-name-only.
    const couples = [
      { id: "1", celebrity_name: "Alex Smith", pro_name: "Witney Carson" },
      { id: "2", celebrity_name: "Alex Jones", pro_name: "Emma Slater" },
    ];
    const names = buildCoupleDisplayNames(couples);
    expect(names.get("1")).toEqual({ celebrity: "Alex S.", pro: "Witney" });
    expect(names.get("2")).toEqual({ celebrity: "Alex J.", pro: "Emma" });
  });
});

describe("formatCoupleName", () => {
  it("joins celebrity and pro with an ampersand", () => {
    expect(formatCoupleName({ celebrity: "Tatyana", pro: "Jan" })).toBe("Tatyana & Jan");
  });
});

describe("buildPeopleDisplayNames", () => {
  it("shows judges by first name, keeping Carrie Ann's compound first name together", () => {
    const judges = [
      { id: "1", name: "Carrie Ann Inaba" },
      { id: "2", name: "Derek Hough" },
      { id: "3", name: "Bruno Tonioli" },
    ];
    const names = buildPeopleDisplayNames(judges);
    expect(names.get("1")).toBe("Carrie Ann");
    expect(names.get("2")).toBe("Derek");
    expect(names.get("3")).toBe("Bruno");
  });
});

describe("sortJudgesForDisplay", () => {
  it("orders the regular panel as Carrie Ann, Derek, Bruno regardless of input order", () => {
    const judges = [
      { id: "3", name: "Bruno Tonioli" },
      { id: "1", name: "Carrie Ann Inaba" },
      { id: "2", name: "Derek Hough" },
    ];
    const sorted = sortJudgesForDisplay(judges);
    expect(sorted.map((j) => j.name)).toEqual(["Carrie Ann Inaba", "Derek Hough", "Bruno Tonioli"]);
  });

  it("puts a guest judge alphabetically after the three regulars", () => {
    const judges = [
      { id: "4", name: "Anna Guest" },
      { id: "3", name: "Bruno Tonioli" },
      { id: "1", name: "Carrie Ann Inaba" },
      { id: "2", name: "Derek Hough" },
    ];
    const sorted = sortJudgesForDisplay(judges);
    expect(sorted.map((j) => j.name)).toEqual([
      "Carrie Ann Inaba",
      "Derek Hough",
      "Bruno Tonioli",
      "Anna Guest",
    ]);
  });
});
