import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("page_docs")
    .select("doc_id,updated_at")
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    docs: (data ?? []).map((row) => ({
      docId: row.doc_id,
      updatedAt: row.updated_at,
    })),
  });
}
