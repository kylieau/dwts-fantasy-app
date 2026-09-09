"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createLeague(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_league", {
    p_name: formData.get("name") as string,
  });

  if (error) {
    redirect(`/leagues?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leagues", "layout");
  redirect(
    `/leagues/${data.id}/settings?message=${encodeURIComponent(
      "Review and save Scoring Categories to finish setting up your league"
    )}`
  );
}

export async function joinLeague(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("join_league", {
    p_invite_code: formData.get("inviteCode") as string,
  });

  if (error) {
    redirect(`/leagues?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leagues", "layout");
  redirect(`/leagues/${data.id}`);
}
