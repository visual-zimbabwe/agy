import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: "Missing UNSPLASH_ACCESS_KEY." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as { location?: string } | null;
  const location = payload?.location?.trim();
  if (!location) {
    return NextResponse.json({ error: "Missing download location." }, { status: 400 });
  }

  const response = await fetch(location, {
    method: "GET",
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unsplash download tracking failed." }, { status: response.status || 502 });
  }

  return NextResponse.json({ ok: true });
}
