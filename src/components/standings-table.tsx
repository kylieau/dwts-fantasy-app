import { cn } from "cn";

type StandingsRow = {
  managerId: string;
  displayName: string;
  totalPoints: number;
  change: "up" | "down" | null;
};

export function StandingsTable({
  standings,
  currentUserId,
  latestCompletedWeek,
}: {
  standings: StandingsRow[];
  currentUserId: string;
  latestCompletedWeek: number | null;
}) {
  const sorted = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Standings</h1>
      <div className="mt-2.5 mb-4 h-0.5 w-9 rounded-full bg-primary" />
      {latestCompletedWeek !== null && (
        <p className="mb-4 text-sm text-muted-foreground">Through week {latestCompletedWeek}</p>
      )}

      <div className="flex flex-col">
        {sorted.map((row, i) => {
          const isYou = row.managerId === currentUserId;
          return (
            <div
              key={row.managerId}
              className={cn(
                "flex items-center gap-3 border-t border-border py-2.5 first:border-t-0",
                isYou && "-mx-2 rounded-lg border-t-0 border-l-2 border-l-primary bg-primary/8 px-2"
              )}
            >
              <span
                className={cn(
                  "w-5 font-heading text-sm font-semibold",
                  isYou ? "text-accent" : "text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">
                {row.displayName}
                {isYou && " (you)"}
                <span className="block text-xs font-normal text-muted-foreground">
                  {row.totalPoints} pts
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                {row.totalPoints}
                {row.change === "up" && <span className="text-emerald-text">▲</span>}
                {row.change === "down" && <span className="text-danger-text">▼</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
