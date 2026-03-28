import { redirect } from "next/navigation";

import { MediaPlayerPage } from "@/components/media/MediaPlayerPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MediaPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <MediaPlayerPage />;
}
