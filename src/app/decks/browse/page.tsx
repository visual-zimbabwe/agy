import { redirect } from "next/navigation";

import { DecksBrowseView } from "@/components/decks/DecksBrowseView";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DecksBrowsePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  return <DecksBrowseView />;
}
