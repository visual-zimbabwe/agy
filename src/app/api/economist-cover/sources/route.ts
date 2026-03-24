import { NextResponse } from "next/server";

import { ECONOMIST_MAGAZINE_SOURCES, isEconomistSourceId, type EconomistMagazineSource } from "@/features/wall/economist";

type SourcesApiResponse = {
  sources?: Array<{
    source_id?: string;
    name?: string;
    archive_url?: string;
  }>;
};

const clean = (value?: string | null) => value?.trim() || undefined;

export async function GET() {
  try {
    const response = await fetch("https://gregorio-unindulged-stephine.ngrok-free.dev/sources", { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return NextResponse.json({ error: body || `Magazine sources request failed with ${response.status}` }, { status: response.status });
    }

    const payload = (await response.json()) as SourcesApiResponse;
    const sources = (payload.sources ?? [])
      .map((entry): EconomistMagazineSource | null => {
        const sourceId = clean(entry.source_id);
        if (!isEconomistSourceId(sourceId)) {
          return null;
        }
        const fallback = ECONOMIST_MAGAZINE_SOURCES.find((candidate) => candidate.sourceId === sourceId);
        return {
          sourceId,
          sourceName: clean(entry.name) || fallback?.sourceName || sourceId,
          sourceUrl: clean(entry.archive_url) || fallback?.sourceUrl || "",
        };
      })
      .filter((entry): entry is EconomistMagazineSource => Boolean(entry));

    return NextResponse.json({
      sources: sources.length > 0 ? sources : ECONOMIST_MAGAZINE_SOURCES,
    });
  } catch {
    return NextResponse.json({
      sources: ECONOMIST_MAGAZINE_SOURCES,
    });
  }
}
