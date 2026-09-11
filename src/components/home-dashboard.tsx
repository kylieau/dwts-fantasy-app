"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormattedDeadline } from "@/lib/use-browser-time-zone";
import { RankBadge } from "@/components/rank-badge";
import { DeadlineStub } from "@/components/deadline-stub";

export function HomeDashboard({
  leagueId,
  rank,
  totalMembers,
  totalPoints,
  standingMessage,
  picksNeeded,
  categoryBreakdown,
  nextDeadline,
}: {
  leagueId: string;
  rank: number;
  totalMembers: number;
  totalPoints: number;
  standingMessage: { placement: string; comment: string };
  picksNeeded: boolean;
  categoryBreakdown: { label: string; points: number }[];
  nextDeadline: { label: string; iso: string } | null;
}) {
  const formattedDeadline = useFormattedDeadline(nextDeadline?.iso);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3.5">
        <RankBadge rank={rank} />
        <div>
          <p className="font-heading text-base font-semibold">{totalPoints} pts</p>
          <p className="text-sm text-muted-foreground">of {totalMembers} players</p>
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="flex gap-2">
          {categoryBreakdown.map((c) => (
            <div key={c.label} className="flex-1 rounded-xl border border-border bg-card px-2 py-2.5 text-center">
              <p className="font-heading text-base font-semibold">{c.points}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {picksNeeded && nextDeadline && formattedDeadline && (
        <DeadlineStub
          label={nextDeadline.label}
          headline={`Locks at ${formattedDeadline}`}
          ctaLabel="Make picks"
          href={`/leagues/${leagueId}?tab=yourpicks`}
        />
      )}

      {standingMessage.comment && (
        <Card>
          <CardHeader>
            <CardTitle>{standingMessage.placement}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{standingMessage.comment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
