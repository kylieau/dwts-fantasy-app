import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LeagueSwitcher } from "@/components/league-switcher";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let leagues: { id: string; name: string }[] = [];
  let isSuperAdmin = false;
  if (user) {
    const [{ data: profile }, { data: memberships }] = await Promise.all([
      supabase.from("profiles").select("display_name, is_super_admin").eq("id", user.id).single(),
      supabase.from("league_members").select("leagues(id, name)").eq("user_id", user.id),
    ]);
    displayName = profile?.display_name ?? user.email ?? null;
    isSuperAdmin = profile?.is_super_admin ?? false;
    leagues = memberships?.map((m) => m.leagues!).filter(Boolean) ?? [];
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Mirrorball Madness
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            {leagues.length > 0 && <LeagueSwitcher leagues={leagues} />}
            <Button render={<Link href="/leagues" />} variant="ghost" size="sm">
              Leagues
            </Button>
            {isSuperAdmin && (
              <Button render={<Link href="/admin/results" />} variant="ghost" size="sm">
                Admin
              </Button>
            )}
            <span className="text-sm text-muted-foreground">{displayName}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button render={<Link href="/login" />} variant="ghost" size="sm">
              Sign in
            </Button>
            <Button render={<Link href="/sign-up" />} size="sm">
              Sign up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
