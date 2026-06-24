import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DecksChrome } from "@/components/decks/DecksChrome";
import { readUserProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DecksLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const profile = readUserProfile(data.user);

  return (
    <Suspense fallback={<div className="decks-app-shell min-h-screen bg-[var(--background)]" />}>
      <DecksChrome userEmail={profile.email} userProfile={profile}>
        {children}
      </DecksChrome>
    </Suspense>
  );
}
