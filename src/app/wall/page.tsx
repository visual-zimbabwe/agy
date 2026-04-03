import { redirect } from "next/navigation";

import { WallCanvas } from "@/components/WallCanvas";
import { readUserProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WallPageProps = {
  searchParams: Promise<{
    snapshot?: string;
  }>;
};

export default async function WallPage({ searchParams }: WallPageProps) {
  const params = await searchParams;
  const isPublishedSnapshot = typeof params.snapshot === "string" && params.snapshot.length > 0;

  if (isPublishedSnapshot) {
    return <WallCanvas />;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  return <WallCanvas userProfile={readUserProfile(data.user)} />;
}
