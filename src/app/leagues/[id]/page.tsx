import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, invite_code, commissioner_id")
    .eq("id", id)
    .single();

  if (!league) {
    notFound();
  }

  const { data: members } = await supabase
    .from("league_members")
    .select("role, joined_at, profiles(display_name)")
    .eq("league_id", id)
    .order("joined_at");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite code:{" "}
            <span className="font-mono font-medium text-foreground">
              {league.invite_code}
            </span>
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button render={<Link href={`/leagues/${id}/draft`} />} size="sm">
            Draft room
          </Button>
          {league.commissioner_id === user.id && (
            <Button render={<Link href={`/leagues/${id}/settings`} />} variant="outline" size="sm">
              Settings
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members?.length ?? 0} joined</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {members?.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>{m.profiles?.display_name}</span>
              <span className="capitalize text-muted-foreground">{m.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
