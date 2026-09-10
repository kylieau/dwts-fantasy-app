"use client";

import { createLeague, joinLeague } from "@/app/leagues/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateJoinLeagueDialogs() {
  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger render={<Button />}>+ Create a League</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a League</DialogTitle>
            <DialogDescription>
              You&apos;ll be the commissioner and get an invite code to share.
            </DialogDescription>
          </DialogHeader>
          <form action={createLeague} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">League Name</Label>
              <Input id="name" name="name" required />
            </div>
            <DialogFooter>
              <Button type="submit">Create league</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Join with code</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a League</DialogTitle>
            <DialogDescription>
              Enter the 6-character invite code from your commissioner.
            </DialogDescription>
          </DialogHeader>
          <form action={joinLeague} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                maxLength={6}
                className="uppercase"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Join league</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
