import { NextResponse } from "next/server";
import { z } from "zod";

import { cleanApodField, hasUsableApodPreview, resolveApodMedia, type NasaApodResponse } from "@/lib/apod";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    date: new URL(request.url).searchParams.get("date") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid APOD date" }, { status: 400 });
  }

  const apiKey = process.env.APOD_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing APOD_API_KEY" }, { status: 503 });
  }

  const upstreamUrl = new URL("https://api.nasa.gov/planetary/apod");
  upstreamUrl.searchParams.set("api_key", apiKey);
  upstreamUrl.searchParams.set("thumbs", "true");
  if (parsed.data.date) {
    upstreamUrl.searchParams.set("date", parsed.data.date);
  }

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return NextResponse.json({ error: body || `NASA APOD request failed with ${response.status}` }, { status: response.status });
    }

    const payload = (await response.json()) as NasaApodResponse;
    const resolvedMedia = resolveApodMedia(payload);
    if (!hasUsableApodPreview(resolvedMedia)) {
      return NextResponse.json({ error: "NASA APOD did not include a usable preview image or playable video" }, { status: 502 });
    }

    return NextResponse.json({
      date: cleanApodField(payload.date),
      title: cleanApodField(payload.title),
      explanation: cleanApodField(payload.explanation),
      copyright: cleanApodField(payload.copyright),
      ...resolvedMedia,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NASA APOD request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
