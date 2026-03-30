import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ECONOMIST_COVER_FALLBACK_IMAGE_URL,
  getEconomistMagazineSource,
  isEconomistSourceId,
} from "@/features/wall/economist";

const querySchema = z.object({
  refresh: z.enum(["true", "false"]).optional(),
  source: z.string().trim().optional(),
  year: z.string().trim().optional(),
});

type EconomistApiResponse = {
  source_id?: string;
  source_name?: string;
  display_date?: string;
  display_label?: string;
  main_story?: string;
  image_url?: string;
  source_url?: string;
  items?: EconomistApiResponse[];
};

const clean = (value?: string | null) => value?.trim() || undefined;
const upstreamFetchInit: RequestInit = {
  cache: "no-store",
  headers: {
    "ngrok-skip-browser-warning": "true",
    accept: "application/json",
  },
};

const buildFallbackPayload = ({
  sourceId,
  sourceName,
  sourceUrl,
  year,
}: {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  year?: string;
}) => ({
  sourceId,
  sourceName,
  displayDate: "",
  displayLabel: year?.trim() ? `${year.trim()} archive unavailable` : "Cover temporarily unavailable",
  mainStory: `Unable to fetch the latest ${sourceName} cover right now.`,
  imageUrl: ECONOMIST_COVER_FALLBACK_IMAGE_URL,
  sourceUrl,
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    refresh: new URL(request.url).searchParams.get("refresh") ?? undefined,
    source: new URL(request.url).searchParams.get("source") ?? undefined,
    year: new URL(request.url).searchParams.get("year") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid magazine cover query" }, { status: 400 });
  }

  const sourceId = isEconomistSourceId(parsed.data.source) ? parsed.data.source : "economist";
  const fallbackSource = getEconomistMagazineSource(sourceId);
  const upstreamUrl = new URL("https://gregorio-unindulged-stephine.ngrok-free.dev/latest-cover");
  upstreamUrl.searchParams.set("source", sourceId);
  if (parsed.data.refresh === "true") {
    upstreamUrl.searchParams.set("refresh", "true");
  }
  if (parsed.data.year) {
    upstreamUrl.searchParams.set("year", parsed.data.year);
  }

  try {
    const response = await fetch(upstreamUrl, upstreamFetchInit);
    if (!response.ok) {
      if (sourceId === "newsweek" && response.status === 502) {
        return NextResponse.json({
          sourceId,
          sourceName: "Newsweek",
          displayDate: "2026-03-27",
          displayLabel: "2026-03-27",
          mainStory: undefined,
          imageUrl: "https://assets.newsweek.com/wp-content/uploads/2026/03/13_260327_Cover_1800%C3%972400_.jpg?w=1600&quality=80&webp=1",
          sourceUrl: fallbackSource.sourceUrl,
        });
      }
      return NextResponse.json(
        buildFallbackPayload({
          sourceId,
          sourceName: fallbackSource.sourceName,
          sourceUrl: fallbackSource.sourceUrl,
          year: parsed.data.year,
        }),
      );
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
      mainStory: clean(payload.main_story) || clean(payload.display_label) || undefined,
      imageUrl,
      sourceUrl: clean(payload.source_url) || fallbackSource.sourceUrl,
      items: payload.items?.map((item) => ({
        sourceId: clean(item.source_id) || sourceId,
        sourceName: clean(item.source_name) || clean(payload.source_name) || fallbackSource.sourceName,
        displayDate: clean(item.display_date) || "",
        displayLabel: clean(item.display_label) || clean(item.display_date) || "Latest cover",
        mainStory: clean(item.main_story) || clean(item.display_label) || undefined,
        imageUrl: clean(item.image_url),
        sourceUrl: clean(item.source_url) || clean(payload.source_url) || fallbackSource.sourceUrl,
      })),
    });
  } catch {
    return NextResponse.json(
      buildFallbackPayload({
        sourceId,
        sourceName: fallbackSource.sourceName,
        sourceUrl: fallbackSource.sourceUrl,
        year: parsed.data.year,
      }),
    );
  }
}
