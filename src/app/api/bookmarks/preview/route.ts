import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";
import { fetchBookmarkMetadata } from "@/lib/bookmark-preview";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";
  if (!url) {
    return NextResponse.json({ error: "Missing URL." }, { status: 400 });
  }

  try {
    const result = await fetchBookmarkMetadata(url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preview request failed." }, { status: 400 });
  }
}
