import { redirect } from "next/navigation";

import { DecksDecksView } from "@/components/decks/DecksDecksView";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DecksDecksPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  return <DecksDecksView />;
}
