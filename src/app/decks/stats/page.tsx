import { redirect } from "next/navigation";

import { DecksStatsView } from "@/components/decks/DecksStatsView";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DecksStatsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  return <DecksStatsView />;
}
