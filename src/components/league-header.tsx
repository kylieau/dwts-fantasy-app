"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LeagueModulesForm } from "@/components/league-modules-form";
import { LeagueInfoSection } from "@/components/league-info-section";

export function LeagueHeader({
  leagueId,
  leagueName,
  inviteCode,
  danceCardOn,
  waiversOn,
  league,
  scoringSettings,
  canEdit,
  premiereAirsAt,
  justCreated,
  scoringConfigured,
}: ComponentProps<typeof LeagueModulesForm> & {
  leagueName: string;
  inviteCode: string;
  danceCardOn: boolean;
  waiversOn: boolean;
  justCreated: boolean;
  scoringConfigured: boolean;
}) {
  return (
    <Sheet>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{leagueName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite code: <span className="font-mono font-medium text-foreground">{inviteCode}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {danceCardOn && (
            <Button render={<Link href={`/leagues/${leagueId}/draft`} />} size="sm">
              Draft room
            </Button>
          )}
          {danceCardOn && waiversOn && (
            <Button render={<Link href={`/leagues/${leagueId}/waivers`} />} variant="outline" size="sm">
              Waivers
            </Button>
          )}
          <SheetTrigger render={<Button variant="outline" size="icon-sm" aria-label="League settings" />}>
            <SettingsIcon />
          </SheetTrigger>
        </div>
      </div>

      {justCreated && canEdit && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>🎉 League created!</CardTitle>
            <CardDescription>Share this invite code with your league.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <span className="font-mono text-2xl font-bold tracking-widest">{inviteCode}</span>
            <SheetTrigger render={<Button size="sm" />}>Set league rules</SheetTrigger>
          </CardContent>
        </Card>
      )}

      {!justCreated && !scoringConfigured && canEdit && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <p className="text-sm">Finish setting up your league&apos;s scoring rules.</p>
            <SheetTrigger render={<Button size="sm" />}>Review Settings</SheetTrigger>
          </CardContent>
        </Card>
      )}

      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>League Settings</SheetTitle>
          <SheetDescription>
            {canEdit
              ? "Modules, weights, and per-category rules for this league."
              : "View-only — only the commissioner can change these."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-4">
          <LeagueInfoSection leagueId={leagueId} leagueName={leagueName} canEdit={canEdit} />
          <LeagueModulesForm
            leagueId={leagueId}
            league={league}
            scoringSettings={scoringSettings}
            canEdit={canEdit}
            premiereAirsAt={premiereAirsAt}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
