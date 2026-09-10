type StandingTier =
  | "pre-season"
  | "tied-first"
  | "first"
  | "second"
  | "middle"
  | "close-to-last"
  | "last"
  | "tied-last";

const MESSAGES: Record<StandingTier, { placement: string; comment: string }[]> = {
  "pre-season": [
    { placement: "Standings haven't started yet.", comment: "Everyone's tied at zero — the mirrorball is still in the box." },
    { placement: "It's a clean slate for now.", comment: "No scores on the board yet. Save the trash talk for week one." },
    { placement: "The season hasn't kicked off yet.", comment: "Every manager in this league is exactly as good as every other one — for now." },
    { placement: "Everyone's tied at zero — anyone's mirrorball to lose.", comment: "" },
    { placement: "It's anyone's game. For now.", comment: "" },
    { placement: "No scores yet. No excuses yet either.", comment: "" },
    { placement: "The judges haven't said a word. Yet.", comment: "" },
    { placement: "Season hasn't started. Neither has the drama.", comment: "" },
    { placement: "Currently tied for first with everyone else. Enjoy it while it lasts.", comment: "" },
  ],
  "tied-first": [
    { placement: "You're tied for first place!", comment: "Sharing that mirrorball energy with someone else — for now." },
    { placement: "You're tied for first place!", comment: "Two perfect scores, one crown. May the best fan win." },
    { placement: "You're tied for first place!", comment: "Tied at the top — the judges would call that a photo finish." },
    { placement: "You're tied for first!", comment: "Sharing the mirrorball, very mature of you." },
    { placement: "Tied at the top!", comment: "Co-champions. The mirrorball has room for two, apparently." },
    { placement: "Neck and neck for first!", comment: "This is basically a dance-off at this point." },
    { placement: "You're sharing the crown!", comment: "Splitting first place — very diplomatic of you both." },
    { placement: "Deadlocked at the top!", comment: "The judges would need a tiebreaker dance for this one." },
  ],
  first: [
    { placement: "Sitting pretty at #1!", comment: "Full marks across the board — even Len would be speechless." },
    { placement: "First place, baby!", comment: "Sitting pretty at the top of the leaderboard. Own it." },
    { placement: "Undisputed top spot!", comment: "First place, and not sorry about it." },
    { placement: "Reigning champion energy!", comment: "Mirrorball energy only." },
    { placement: "Top of the leaderboard!", comment: "The judges would give you a 10." },
    { placement: "You're #1!", comment: "Actual perfect score." },
    { placement: "Leading the pack!", comment: "Nobody's catching you this week." },
    { placement: "King/queen of the mirrorball!", comment: "Crowned and comfortable." },
  ],
  second: [
    { placement: "So close to gold!", comment: "So close to the mirrorball you can hear it spinning." },
    { placement: "One spot from glory!", comment: "Silver medal energy — respectable, but you want gold." },
    { placement: "Runner-up status!", comment: "One spot from the top. Time to campaign for fan votes." },
    { placement: "Just off the top spot!", comment: "So close to the top you can taste the glitter." },
    { placement: "Silver medal standing!", comment: "Runner-up energy — respectable, but you know you want more." },
    { placement: "Second place, but make it fashion!", comment: "Silver looks good on you." },
    { placement: "Nipping at first place's heels!", comment: "The gap is closing — make your move." },
    { placement: "A hair behind the leader!", comment: "So close you can practically touch the mirrorball." },
  ],
  middle: [
    { placement: "You're smack in the middle of the pack.", comment: "Not first, not last — a very stable cha-cha of a season." },
    { placement: "You're in the middle of the pack.", comment: "Middle of the leaderboard, living your best low-key life." },
    { placement: "You're holding steady in the middle.", comment: "Right in the thick of it. Anyone's game from here." },
    { placement: "Solidly middle of the pack!", comment: "Solidly... fine." },
    { placement: "Right in the thick of it!", comment: "Not embarrassing, not impressive. A shrug of a ranking." },
    { placement: "Comfortably average!", comment: "Peak participation trophy energy." },
    { placement: "Smack in the middle!", comment: "Nobody's writing songs about you, but nobody's booing either." },
    { placement: "Hovering in the middle!", comment: "The judges would call this 'safe, but forgettable.'" },
    { placement: "Middle of the pack, as usual!", comment: "Very cha-cha energy — technically fine, nothing memorable." },
    { placement: "Neither here nor there!", comment: "You're the beige couch of this league." },
    { placement: "Dead center of the standings!", comment: "Coasting. Vibing. Doing nothing about it." },
    { placement: "Firmly in no-man's-land!", comment: "This is what mediocrity with confidence looks like." },
    { placement: "Blending in with the pack!", comment: "Not a redemption arc. Not a villain arc. Just... an arc." },
    { placement: "Solidly middle of the pack!", comment: "Give the judges something to talk about next week." },
    { placement: "Right in the thick of it!", comment: "You could move up. You could also not. No pressure." },
    { placement: "Comfortably average!", comment: "Middle child of the standings — going unnoticed and OK with it." },
    { placement: "Smack in the middle!", comment: "A very confident shrug." },
  ],
  "close-to-last": [
    { placement: "You're closing in on last place.", comment: "The judges are already reaching for the save." },
    { placement: "You're near the bottom of the pack.", comment: "Not quite in the bottom two, but you can see it from here." },
    { placement: "You're edging toward last place.", comment: "Dangerously close to elimination territory." },
    { placement: "You're in second-to-last place!", comment: "Someone's gotta be the safety net for last place." },
    { placement: "You're in second-to-last place!", comment: "At least you're not THEM." },
    { placement: "Hovering just above last!", comment: "One bad week from switching places." },
    { placement: "Skating on thin ice!", comment: "The bottom two is looking at you." },
    { placement: "Second-to-last and holding!", comment: "Not last. Yet." },
  ],
  last: [
    { placement: "You're in last place.", comment: "Somebody's gotta hold the wooden spoon." },
    { placement: "You're in last place.", comment: "Bottom of the leaderboard — but hey, nowhere to go but up." },
    { placement: "You're in last place.", comment: "The judges' paddles would not be kind right now." },
    { placement: "You're in last place!", comment: "Time to start actually watching the show." },
    { placement: "You're in last place!", comment: "Even the eliminated couples are outscoring you." },
    { placement: "You're in last place!", comment: "This is your villain-edit redemption arc." },
    { placement: "Dead last!", comment: "Someone's gotta be the cautionary tale." },
    { placement: "Bringing up the rear!", comment: "The mirrorball is not calling your name this week." },
  ],
  "tied-last": [
    { placement: "You're tied for last place.", comment: "Misery loves company, and at least you've got some." },
    { placement: "You're tied for last place.", comment: "Tied at the bottom — the producers love a good rivalry story." },
    { placement: "You're tied for last place.", comment: "Bringing up the rear, together." },
    { placement: "You're tied for last!", comment: "Misery loves company." },
    { placement: "Co-last place!", comment: "At least you've got matching wooden spoons." },
    { placement: "Neck and neck for the bottom!", comment: "This is one rivalry nobody asked for." },
    { placement: "Tied at the very bottom!", comment: "Two of you, one basement." },
    { placement: "Deadlocked in last!", comment: "The producers are thrilled with this storyline." },
  ],
};

export function resolveStandingTier(
  rank: number,
  totalMembers: number,
  isTiedForFirst: boolean,
  isTiedForLast: boolean,
  isPreSeason: boolean
): StandingTier {
  if (isPreSeason) return "pre-season";
  if (isTiedForFirst) return "tied-first";
  if (rank === 1) return "first";
  if (isTiedForLast) return "tied-last";
  if (rank === totalMembers) return "last";
  if (rank === 2) return "second";
  if (rank === totalMembers - 1) return "close-to-last";
  return "middle";
}

function pickVariant<T>(variants: T[]): T {
  return variants[Math.floor(Math.random() * variants.length)];
}

export function getStandingMessage({
  rank,
  totalMembers,
  isTiedForFirst,
  isTiedForLast,
  isPreSeason,
}: {
  rank: number;
  totalMembers: number;
  isTiedForFirst: boolean;
  isTiedForLast: boolean;
  isPreSeason: boolean;
}): { placement: string; comment: string } {
  const tier = resolveStandingTier(rank, totalMembers, isTiedForFirst, isTiedForLast, isPreSeason);
  return pickVariant(MESSAGES[tier]);
}
