"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeIcon, TicketIcon, UsersIcon, ListChecksIcon, TrophyIcon } from "lucide-react";

const TABS = [
  { value: "home", label: "Home", icon: HomeIcon },
  { value: "pickem", label: "Pick 'Em", icon: TicketIcon },
  { value: "roster", label: "Roster", icon: UsersIcon },
  { value: "results", label: "Results", icon: ListChecksIcon },
  { value: "standings", label: "Standings", icon: TrophyIcon },
] as const;

export function LeagueTabs({
  home,
  pickEm,
  roster,
  results,
  standings,
}: {
  home: ReactNode;
  pickEm: ReactNode;
  roster: ReactNode;
  results: ReactNode;
  standings: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "home";

  function handleValueChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    // The "League created!" banner is a one-time toast tied to the first
    // Home visit — leaving Home counts as acknowledging it, so drop it from
    // the URL here rather than tracking dismissal separately. Once it's
    // gone from the params, nothing re-adds it, so it can't resurface.
    if (value !== "home") {
      params.delete("justCreated");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleValueChange}>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] sm:static sm:border-t-0 sm:border-b sm:pb-0">
        <TabsList className="h-auto w-full justify-around rounded-none bg-transparent p-1 sm:w-fit sm:justify-start sm:gap-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-auto flex-col gap-0.5 rounded-md px-2 py-1.5 sm:flex-row sm:gap-1.5 sm:px-3"
            >
              <Icon className="size-5 sm:size-4" />
              <span className="text-[10px] sm:text-sm">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="pb-20 sm:pb-0">
        <TabsContent value="home">{home}</TabsContent>
        <TabsContent value="pickem">{pickEm}</TabsContent>
        <TabsContent value="roster">{roster}</TabsContent>
        <TabsContent value="results">{results}</TabsContent>
        <TabsContent value="standings">{standings}</TabsContent>
      </div>
    </Tabs>
  );
}
