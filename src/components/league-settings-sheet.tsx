"use client";

import type { ComponentProps } from "react";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LeagueModulesForm } from "@/components/league-modules-form";

export function LeagueSettingsSheet({
  leagueId,
  league,
  scoringSettings,
  canEdit,
  premiereAirsAt,
  defaultOpen,
}: ComponentProps<typeof LeagueModulesForm> & { defaultOpen?: boolean }) {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="League settings" />
        }
      >
        <SettingsIcon />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>League Settings</SheetTitle>
          <SheetDescription>
            {canEdit
              ? "Modules, weights, and per-category rules for this league."
              : "View-only — only the commissioner can change these."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
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
