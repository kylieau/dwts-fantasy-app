import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";

type StandingsRow = { managerId: string; displayName: string; totalPoints: number };

export function StandingsTable({
  standings,
  currentUserId,
}: {
  standings: StandingsRow[];
  currentUserId: string;
}) {
  const sorted = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standings</CardTitle>
        <CardDescription>Cumulative points across the season</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
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
              <span className={cn("w-5 font-heading text-sm font-semibold", isYou ? "text-accent" : "text-muted-foreground")}>
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">
                {row.displayName}
                {isYou && " (you)"}
              </span>
              <span className="text-sm font-semibold">{row.totalPoints}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
