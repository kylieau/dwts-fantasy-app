// Mirrors the snake-order math in the make_draft_pick Postgres function, for
// display only — the server is the actual authority on whose turn it is.
export function getPickAssignment(pickNumber: number, memberCount: number) {
  const round = Math.floor((pickNumber - 1) / memberCount) + 1;
  const positionInRound = pickNumber - (round - 1) * memberCount;
  const draftPosition =
    round % 2 === 1 ? positionInRound : memberCount - positionInRound + 1;
  return { round, draftPosition };
}
