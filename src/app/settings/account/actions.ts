"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    redirect(`/settings/account?error=${encodeURIComponent("Email is required")}`);
  }

  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    redirect(`/settings/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/settings/account?message=${encodeURIComponent("Check your new email to confirm the change")}`
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    redirect(`/settings/account?error=${encodeURIComponent("Password must be at least 6 characters")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/settings/account?error=${encodeURIComponent("Passwords don't match")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/settings/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/settings/account?message=${encodeURIComponent("Password updated")}`);
}

export async function requestAccountDeletion(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: error.message };

  revalidatePath("/settings/account");
  return { error: null };
}

export async function cancelAccountDeletion() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_account_deletion");
  if (error) {
    redirect(`/settings/account?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/account");
  redirect(`/settings/account?message=${encodeURIComponent("Deletion request canceled")}`);
}
