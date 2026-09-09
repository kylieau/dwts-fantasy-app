"use client";

import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeagueSwitcher({
  leagues,
}: {
  leagues: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();

  const leagueItems = Object.fromEntries(leagues.map((league) => [league.id, league.name]));

  return (
    <Select
      items={leagueItems}
      value={params.id}
      onValueChange={(id) => router.push(`/leagues/${id}`)}
    >
      <SelectTrigger size="sm" className="w-28 sm:w-40">
        <SelectValue placeholder="Your Leagues" />
      </SelectTrigger>
      <SelectContent>
        {leagues.map((league) => (
          <SelectItem key={league.id} value={league.id}>
            {league.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
