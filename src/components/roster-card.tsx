import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoupleNameParts } from "@/lib/couple-display";
import { CoupleName } from "@/components/couple-name";

type RosterCouple = CoupleNameParts & { status: string };

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
        <CardTitle>Your Roster</CardTitle>
        <CardDescription>{totalPoints} points this season</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {couples.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>
              <CoupleName celebrity={c.celebrity} pro={c.pro} />
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
