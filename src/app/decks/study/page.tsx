import { redirect } from "next/navigation";

import { DecksStudyView } from "@/components/decks/DecksStudyView";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DecksStudyPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  return <DecksStudyView />;
}
