"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = (formData.get("displayName") as string)?.trim();
  if (!displayName) {
    redirect(`/settings/profile?error=${encodeURIComponent("Display name is required")}`);
  }

  // Allowed by the existing column-level grant on profiles (display_name,
  // avatar_url only) — no RPC needed, RLS already scopes this to self.
  const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);

  if (error) {
    redirect(`/settings/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect(`/settings?message=${encodeURIComponent("Profile updated")}`);
}
