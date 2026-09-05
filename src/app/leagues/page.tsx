import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLeague, joinLeague } from "@/app/leagues/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    .select("role, leagues(id, name, invite_code)")
    .eq("user_id", user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your leagues</h1>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      {memberships && memberships.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
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
          You haven&apos;t joined a league yet.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a league</CardTitle>
            <CardDescription>
              You&apos;ll be the commissioner and get an invite code to share.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createLeague} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">League name</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit">Create league</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join a league</CardTitle>
            <CardDescription>
              Enter the 6-character invite code from your commissioner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={joinLeague} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  maxLength={6}
                  className="uppercase"
                  required
                />
              </div>
              <Button type="submit">Join league</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
