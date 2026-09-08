import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResultsForm } from "@/components/results-form";

export default async function AdminResultsPage() {
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

  if (!profile?.is_super_admin) {
    redirect("/");
  }

  const { data: couples } = await supabase
    .from("couples")
    .select("id, celebrity_name, pro_name")
    .order("celebrity_name");

  return <ResultsForm couples={couples ?? []} />;
}
