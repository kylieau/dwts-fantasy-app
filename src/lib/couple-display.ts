// The show refers to people by first name only — matches that on-screen
// convention, disambiguating with a last initial only when two people in the
// same pool (celebrities vs. pros, checked separately) would otherwise be
// indistinguishable.

// Sarah Jane Nader (Season 35) and judge Carrie Ann Inaba both have compound
// first names — plain whitespace-splitting would only catch "Sarah"/"Carrie".
const COMPOUND_FIRST_NAMES = ["Sarah Jane", "Carrie Ann"];

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  const compound = COMPOUND_FIRST_NAMES.find((n) => trimmed.startsWith(n + " "));
  return compound ?? trimmed.split(/\s+/)[0];
}

function lastInitial(fullName: string): string {
  const trimmed = fullName.trim();
  const first = firstName(trimmed);
  const rest = trimmed.slice(first.length).trim();
  return rest ? rest[0] : "";
}

// Connor Wood and Conner Leavitt (Season 35) are spelled differently but
// sound identical on-air, so they're treated as the same name here — plain
// case-insensitive matching wouldn't catch this pair.
function collisionKey(first: string): string {
  const lower = first.toLowerCase();
  return lower === "connor" || lower === "conner" ? "connor" : lower;
}

function buildFirstNameMap(fullNames: string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const name of fullNames) {
    const key = collisionKey(firstName(name));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result = new Map<string, string>();
  for (const name of fullNames) {
    const first = firstName(name);
    const key = collisionKey(first);
    result.set(name, (counts.get(key) ?? 0) > 1 ? `${first} ${lastInitial(name)}.` : first);
  }
  return result;
}

// The show's judging panel always appears in this order; a guest judge
// (not in this list) sorts alphabetically after the three regulars.
const JUDGE_DISPLAY_ORDER = ["Carrie Ann Inaba", "Derek Hough", "Bruno Tonioli"];

export function sortJudgesForDisplay<T extends { name: string }>(judges: T[]): T[] {
  return [...judges].sort((a, b) => {
    const indexA = JUDGE_DISPLAY_ORDER.indexOf(a.name);
    const indexB = JUDGE_DISPLAY_ORDER.indexOf(b.name);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

// For a flat list of people (e.g. judges) rather than couples — same
// first-name-only, collision-disambiguated treatment, just without the
// celebrity/pro pairing.
export function buildPeopleDisplayNames<T extends { id: string; name: string }>(
  people: T[]
): Map<string, string> {
  const nameMap = buildFirstNameMap(people.map((p) => p.name));
  const result = new Map<string, string>();
  for (const p of people) {
    result.set(p.id, nameMap.get(p.name)!);
  }
  return result;
}

export type CoupleNameParts = { celebrity: string; pro: string };

// Returns couple id -> {celebrity, pro} display names, collision-checked
// within this specific list of couples (so it stays correct per-season as
// the couples pool passed in changes). Kept as separate parts rather than a
// joined string so callers can style the celebrity name differently (the
// show bills them as the star, the pro as their partner).
export function buildCoupleDisplayNames<
  T extends { id: string; celebrity_name: string; pro_name: string },
>(couples: T[]): Map<string, CoupleNameParts> {
  const celebMap = buildFirstNameMap(couples.map((c) => c.celebrity_name));
  const proMap = buildFirstNameMap(couples.map((c) => c.pro_name));

  const result = new Map<string, CoupleNameParts>();
  for (const c of couples) {
    result.set(c.id, { celebrity: celebMap.get(c.celebrity_name)!, pro: proMap.get(c.pro_name)! });
  }
  return result;
}

export function formatCoupleName(parts: CoupleNameParts): string {
  return `${parts.celebrity} & ${parts.pro}`;
}
