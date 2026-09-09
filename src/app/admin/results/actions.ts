"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyEpisodeResults, resultsEntryOpenToAll, type EpisodeResultsInput } from "@/lib/results";

async function requireResultsAccess(): Promise<{ error: string | null }> {
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

  if (!profile?.is_super_admin && !resultsEntryOpenToAll()) return { error: "Not authorized" };
  return { error: null };
}

export async function submitEpisodeResults(
  input: EpisodeResultsInput
): Promise<{ error: string | null }> {
  const access = await requireResultsAccess();
  if (access.error) return access;

  const result = await applyEpisodeResults(createAdminClient(), input);
  if (!result.error) revalidatePath("/admin/results");
  return result;
}

export async function addJudge(name: string): Promise<{ error: string | null }> {
  const access = await requireResultsAccess();
  if (access.error) return access;

  const trimmed = name.trim();
  if (!trimmed) return { error: "Judge name is required" };

  const { error } = await createAdminClient()
    .from("people")
    .insert({ name: trimmed, role: "judge" });
  if (error) return { error: error.message };

  revalidatePath("/admin/results");
  return { error: null };
}

export async function addDanceStyle(name: string): Promise<{ error: string | null }> {
  const access = await requireResultsAccess();
  if (access.error) return access;

  const trimmed = name.trim();
  if (!trimmed) return { error: "Dance style name is required" };

  const { error } = await createAdminClient().from("dance_styles").insert({ name: trimmed });
  if (error) return { error: error.message };

  revalidatePath("/admin/results");
  return { error: null };
}
