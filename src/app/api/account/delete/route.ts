import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) {
    return NextResponse.json({ error: error.message ?? "Failed to delete account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
