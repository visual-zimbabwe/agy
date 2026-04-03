import { redirect } from "next/navigation";

import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { readUserProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const profile = readUserProfile(data.user);

  return <SettingsWorkspace userEmail={profile.email} initialProfile={profile} />;
}
