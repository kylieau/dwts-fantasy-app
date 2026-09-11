import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Where a signed-in user lands after login/root visit, now that there's no
// account-level dashboard tab. Straight into their (first-joined) league's
// Home if they have one; otherwise /leagues, which renders the zero-state.
export async function getDefaultLandingPath(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string> {
  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return membership ? `/leagues/${membership.league_id}` : "/leagues";
}
