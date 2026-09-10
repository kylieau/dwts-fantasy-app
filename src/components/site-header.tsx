import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? user.email ?? null;
  }

  return (
    <header className="border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between px-4 py-2">
        <Link href={user ? "/today" : "/"} className="text-sm font-semibold tracking-tight">
          Mirrorball Madness
        </Link>
        {user ? (
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
          >
            {displayName?.[0]?.toUpperCase() ?? "?"}
          </Link>
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
