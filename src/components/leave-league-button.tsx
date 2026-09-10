"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function LeaveLeagueButton({
  leagueId,
  leagueName,
  isCommissioner,
}: {
  leagueId: string;
  leagueName: string;
  isCommissioner: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isCommissioner) {
    return <span className="text-xs text-muted-foreground">Commissioners can&apos;t leave</span>;
  }

  async function handleLeave() {
    setError(null);
    setSubmitting(true);
    const result = await leaveLeague(leagueId);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.refresh();
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Leave</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave {leagueName}?</DialogTitle>
          <DialogDescription>
            You&apos;ll lose access to this league. Your historical scores stay on the
            record for the league&apos;s own standings.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleLeave} disabled={submitting}>
            {submitting ? "Leaving..." : "Leave league"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
