"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeMember } from "@/app/leagues/[id]/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type Member = { userId: string; displayName: string; role: string };

function RemoveMemberButton({ leagueId, member }: { leagueId: string; member: Member }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRemove() {
    setError(null);
    setSubmitting(true);
    const result = await removeMember(leagueId, member.userId);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.refresh();
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Remove</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {member.displayName}?</DialogTitle>
          <DialogDescription>
            They&apos;ll lose access to this league. Their historical scores stay on the
            record for the league&apos;s own standings.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleRemove} disabled={submitting}>
            {submitting ? "Removing..." : "Remove member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LeagueMembersSection({
  leagueId,
  members,
  canEdit,
}: {
  leagueId: string;
  members: Member[];
  canEdit: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>{members.length} joined</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-sm first:border-t-0"
          >
            <div>
              <span className="font-medium">{m.displayName}</span>
              <span className="ml-2 capitalize text-muted-foreground">{m.role}</span>
            </div>
            {canEdit && m.role !== "commissioner" && (
              <RemoveMemberButton leagueId={leagueId} member={m} />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
