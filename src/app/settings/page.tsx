import { redirect } from "next/navigation";

import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <SettingsWorkspace userEmail={data.user.email ?? "Signed in"} />;
}
