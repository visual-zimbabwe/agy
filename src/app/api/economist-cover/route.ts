import { NextResponse } from "next/server";
import { z } from "zod";

import { getEconomistMagazineSource, isEconomistSourceId } from "@/features/wall/economist";

const querySchema = z.object({
  refresh: z.enum(["true", "false"]).optional(),
  source: z.string().trim().optional(),
});

type EconomistApiResponse = {
  source_id?: string;
  source_name?: string;
  display_date?: string;
  display_label?: string;
  image_url?: string;
  source_url?: string;
};

const clean = (value?: string | null) => value?.trim() || undefined;

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    refresh: new URL(request.url).searchParams.get("refresh") ?? undefined,
    source: new URL(request.url).searchParams.get("source") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid magazine cover query" }, { status: 400 });
  }

  const sourceId = isEconomistSourceId(parsed.data.source) ? parsed.data.source : "economist";
  const fallbackSource = getEconomistMagazineSource(sourceId);
  const upstreamUrl = new URL("http://localhost:8000/latest-cover");
  upstreamUrl.searchParams.set("source", sourceId);
  if (parsed.data.refresh === "true") {
    upstreamUrl.searchParams.set("refresh", "true");
  }

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return NextResponse.json({ error: body || `Magazine cover request failed with ${response.status}` }, { status: response.status });
    }
    const payload = (await response.json()) as EconomistApiResponse;
    const imageUrl = clean(payload.image_url);
    if (!imageUrl) {
      return NextResponse.json({ error: "Magazine cover API did not return an image URL" }, { status: 502 });
    }
    return NextResponse.json({
      sourceId,
      sourceName: clean(payload.source_name) || fallbackSource.sourceName,
      displayDate: clean(payload.display_date) || "",
      displayLabel: clean(payload.display_label) || clean(payload.display_date) || "Latest cover",
      imageUrl,
      sourceUrl: clean(payload.source_url) || fallbackSource.sourceUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Magazine cover request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
