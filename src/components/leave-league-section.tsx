"use client";

import { useState } from "react";
import { leaveLeague } from "@/app/leagues/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type League = { id: string; name: string; isCommissioner: boolean };

export function LeaveLeagueSection({ leagues }: { leagues: League[] }) {
  const [error, setError] = useState<string | null>(null);
  const [leftIds, setLeftIds] = useState<Set<string>>(new Set());

  async function handleLeave(leagueId: string) {
    setError(null);
    const result = await leaveLeague(leagueId);
    if (result.error) setError(result.error);
    else setLeftIds((prev) => new Set(prev).add(leagueId));
  }

  const visibleLeagues = leagues.filter((l) => !leftIds.has(l.id));

  if (visibleLeagues.length === 0) {
    return <p className="text-sm text-muted-foreground">No leagues to leave.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {visibleLeagues.map((league) => (
        <div
          key={league.id}
          className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
        >
          <span>{league.name}</span>
          {league.isCommissioner ? (
            <span className="text-xs text-muted-foreground">Commissioners can&apos;t leave</span>
          ) : (
            <Dialog>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>Leave</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Leave {league.name}?</DialogTitle>
                  <DialogDescription>
                    You&apos;ll lose access to this league. Your historical scores stay on
                    the record for the league&apos;s own standings.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                  <Button variant="destructive" onClick={() => handleLeave(league.id)}>
                    Leave league
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      ))}
    </div>
  );
}
