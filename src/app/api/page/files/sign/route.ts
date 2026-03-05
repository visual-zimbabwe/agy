import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const pageFilesBucket = "page-files";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  let path = "";
  try {
    const body = (await request.json()) as { path?: string };
    path = body.path ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!path || !path.startsWith(`${auth.user.id}/`)) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(pageFilesBucket).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Failed to sign file URL." }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}

