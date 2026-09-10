type StandingTier = "tied-first" | "first" | "second" | "middle" | "close-to-last" | "last" | "tied-last";

const MESSAGES: Record<StandingTier, { placement: string; comment: string }[]> = {
  "tied-first": [
    { placement: "You're tied for first place!", comment: "Sharing that mirrorball energy with someone else — for now." },
    { placement: "You're tied for first place!", comment: "Two perfect scores, one crown. May the best fan win." },
    { placement: "You're tied for first place!", comment: "Tied at the top — the judges would call that a photo finish." },
  ],
  first: [
    { placement: "You're in first place!", comment: "Full marks across the board — even Len would be speechless." },
    { placement: "You're in first place!", comment: "Sitting pretty at the top of the leaderboard. Own it." },
    { placement: "You're in first place!", comment: "First place, and not sorry about it." },
  ],
  second: [
    { placement: "You're in second place!", comment: "So close to the mirrorball you can hear it spinning." },
    { placement: "You're in second place!", comment: "Silver medal energy — respectable, but you want gold." },
    { placement: "You're in second place!", comment: "One spot from the top. Time to campaign for fan votes." },
  ],
  middle: [
    { placement: "You're smack in the middle of the pack.", comment: "Not first, not last — a very stable cha-cha of a season." },
    { placement: "You're in the middle of the pack.", comment: "Middle of the leaderboard, living your best low-key life." },
    { placement: "You're holding steady in the middle.", comment: "Right in the thick of it. Anyone's game from here." },
  ],
  "close-to-last": [
    { placement: "You're closing in on last place.", comment: "The judges are already reaching for the save." },
    { placement: "You're near the bottom of the pack.", comment: "Not quite in the bottom two, but you can see it from here." },
    { placement: "You're edging toward last place.", comment: "Dangerously close to elimination territory." },
  ],
  last: [
    { placement: "You're in last place.", comment: "Somebody's gotta hold the wooden spoon." },
    { placement: "You're in last place.", comment: "Bottom of the leaderboard — but hey, nowhere to go but up." },
    { placement: "You're in last place.", comment: "The judges' paddles would not be kind right now." },
  ],
  "tied-last": [
    { placement: "You're tied for last place.", comment: "Misery loves company, and at least you've got some." },
    { placement: "You're tied for last place.", comment: "Tied at the bottom — the producers love a good rivalry story." },
    { placement: "You're tied for last place.", comment: "Bringing up the rear, together." },
  ],
};

function tierForRank(
  rank: number,
  totalMembers: number,
  isTiedForFirst: boolean,
  isTiedForLast: boolean
): StandingTier {
  if (isTiedForFirst) return "tied-first";
  if (rank === 1) return "first";
  if (isTiedForLast) return "tied-last";
  if (rank === totalMembers) return "last";
  if (rank === 2) return "second";
  if (rank === totalMembers - 1) return "close-to-last";
  return "middle";
}

function pickVariant<T>(variants: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return variants[Math.abs(hash) % variants.length];
}

export function getStandingMessage({
  rank,
  totalMembers,
  isTiedForFirst,
  isTiedForLast,
  seed,
}: {
  rank: number;
  totalMembers: number;
  isTiedForFirst: boolean;
  isTiedForLast: boolean;
  seed: string;
}): { placement: string; comment: string } {
  const tier = tierForRank(rank, totalMembers, isTiedForFirst, isTiedForLast);
  return pickVariant(MESSAGES[tier], seed);
}
