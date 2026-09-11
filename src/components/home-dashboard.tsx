"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormattedDeadline } from "@/lib/use-browser-time-zone";

export function HomeDashboard({
  standingMessage,
  picksNeeded,
  categoryBreakdown,
  nextDeadline,
}: {
  standingMessage: { placement: string; comment: string };
  picksNeeded: boolean;
  categoryBreakdown: { label: string; points: number }[];
  nextDeadline: { label: string; iso: string } | null;
}) {
  const formattedDeadline = useFormattedDeadline(nextDeadline?.iso);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Standing</CardTitle>
          <CardDescription>{standingMessage.placement}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {standingMessage.comment && (
            <p className="text-sm text-muted-foreground">{standingMessage.comment}</p>
          )}
          <span
            className={
              picksNeeded
                ? "inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                : "inline-flex w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            }
          >
            {picksNeeded ? "Picks needed" : "Picks locked in"}
          </span>
          {nextDeadline && formattedDeadline && (
            <p className="text-sm text-muted-foreground">
              {nextDeadline.label} locks at {formattedDeadline}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points by Category</CardTitle>
          <CardDescription>Your cumulative points this season, by module.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {categoryBreakdown.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0"
            >
              <span>{c.label}</span>
              <span className="font-medium">{c.points}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
