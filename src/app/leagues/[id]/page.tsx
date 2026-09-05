import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, invite_code")
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite code:{" "}
          <span className="font-mono font-medium text-foreground">
            {league.invite_code}
          </span>
        </p>
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
