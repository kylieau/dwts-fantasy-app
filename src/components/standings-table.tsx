import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StandingsRow = { managerId: string; displayName: string; totalPoints: number };

export function StandingsTable({ standings }: { standings: StandingsRow[] }) {
  const sorted = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standings</CardTitle>
        <CardDescription>Cumulative points across the season</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sorted.map((row, i) => (
          <div key={row.managerId} className="flex items-center justify-between text-sm">
            <span>
              <span className="text-muted-foreground">{i + 1}.</span> {row.displayName}
            </span>
            <span className="font-medium">{row.totalPoints}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
