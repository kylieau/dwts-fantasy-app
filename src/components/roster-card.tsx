import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RosterCouple = { celebrityName: string; proName: string; status: string };

export function RosterCard({
  couples,
  totalPoints,
}: {
  couples: RosterCouple[];
  totalPoints: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your roster</CardTitle>
        <CardDescription>{totalPoints} points this season</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {couples.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>
              {c.celebrityName} &amp; {c.proName}
            </span>
            <span
              className={
                c.status === "eliminated" ? "text-muted-foreground" : "text-foreground"
              }
            >
              {c.status === "active" ? "Active" : c.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
