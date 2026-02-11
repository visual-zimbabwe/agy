import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const requireApiUser = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return {
    supabase,
    user: data.user,
  } as const;
};
