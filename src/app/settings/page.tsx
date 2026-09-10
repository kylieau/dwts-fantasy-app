import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { AccountTabBar } from "@/components/account-tab-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRightIcon } from "lucide-react";

const PLACEHOLDER_ROWS = ["Profile", "Notifications", "Appearance", "Account & data"];

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <AccountTabBar />

      <div className="flex flex-col gap-6 pb-20 sm:pb-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Account-wide</p>
        </div>

        <Card>
          <CardContent className="flex flex-col p-0">
            {PLACEHOLDER_ROWS.map((label) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-border px-4 py-3 text-sm text-muted-foreground last:border-b-0"
              >
                <span>{label}</span>
                <span className="text-xs">Coming soon</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {profile?.is_super_admin && (
          <Link href="/admin/results">
            <Card className="transition-colors hover:bg-muted">
              <CardContent className="flex items-center justify-between py-4">
                <span className="text-sm font-medium">Site Admin</span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
