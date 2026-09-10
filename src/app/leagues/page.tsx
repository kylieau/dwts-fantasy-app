import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountTabBar } from "@/components/account-tab-bar";
import { CreateJoinLeagueDialogs } from "@/components/create-join-league-dialogs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("role, leagues(id, name)")
    .eq("user_id", user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <AccountTabBar />

      <div className="flex flex-col gap-6 pb-20 sm:pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Leagues</h1>
            <p className="mt-1 text-sm text-muted-foreground">Browse &amp; manage</p>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
          <CreateJoinLeagueDialogs />
        </div>

        {memberships && memberships.length > 0 ? (
          <div className="flex flex-col gap-2">
            {memberships.map((m) => (
              <Link key={m.leagues!.id} href={`/leagues/${m.leagues!.id}`}>
                <Card className="transition-colors hover:bg-muted">
                  <CardHeader>
                    <CardTitle>{m.leagues!.name}</CardTitle>
                    <CardDescription className="capitalize">{m.role}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t joined a league yet — create one or join with an invite code above.
          </p>
        )}
      </div>
    </div>
  );
}
