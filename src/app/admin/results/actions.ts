"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyEpisodeResults, type EpisodeResultsInput } from "@/lib/results";

export async function submitEpisodeResults(
  input: EpisodeResultsInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) return { error: "Not authorized" };

  return applyEpisodeResults(createAdminClient(), input);
}
