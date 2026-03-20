import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type NasaApodResponse = {
  date?: string;
  title?: string;
  explanation?: string;
  copyright?: string;
  media_type?: string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
};

const clean = (value?: string | null) => value?.trim() || undefined;

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
    const mediaType = payload.media_type === "image" || payload.media_type === "video" ? payload.media_type : "other";
    const imageUrl = clean(payload.hdurl) || clean(payload.url) || clean(payload.thumbnail_url);
    if (!imageUrl) {
      return NextResponse.json({ error: "NASA APOD did not include a usable preview image" }, { status: 502 });
    }

    return NextResponse.json({
      date: clean(payload.date),
      title: clean(payload.title),
      explanation: clean(payload.explanation),
      copyright: clean(payload.copyright),
      mediaType,
      imageUrl,
      fallbackImageUrl: clean(payload.url) || clean(payload.thumbnail_url),
      pageUrl: clean(payload.url) || clean(payload.hdurl),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NASA APOD request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
