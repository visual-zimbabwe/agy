import { NextRequest, NextResponse } from "next/server";

import type { UnsplashPhoto, UnsplashSearchResponse } from "@/lib/unsplash";
import { withUnsplashAttributionParams } from "@/lib/unsplash";

const UNSPLASH_SEARCH_ENDPOINT = "https://api.unsplash.com/search/photos";
const DEFAULT_PER_PAGE = 18;
const MAX_PER_PAGE = 30;

type UnsplashApiResult = {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  width: number;
  height: number;
  color?: string | null;
  urls?: {
    thumb?: string;
    small?: string;
    regular?: string;
  };
  user?: {
    name?: string;
    username?: string;
    links?: {
      html?: string;
    };
  };
  links?: {
    html?: string;
    download_location?: string;
  };
};

const mapPhoto = (entry: UnsplashApiResult): UnsplashPhoto | null => {
  const thumb = entry.urls?.thumb?.trim();
  const small = entry.urls?.small?.trim();
  const regular = entry.urls?.regular?.trim();
  const username = entry.user?.username?.trim();
  const name = entry.user?.name?.trim();
  const profileUrl = entry.user?.links?.html?.trim() || entry.links?.html?.trim();
  const downloadLocation = entry.links?.download_location?.trim();
  if (!thumb || !small || !regular || !username || !name || !profileUrl || !downloadLocation) {
    return null;
  }

  return {
    id: entry.id,
    alt: entry.alt_description?.trim() || entry.description?.trim() || `Photo by ${name}`,
    description: entry.description?.trim() || undefined,
    width: entry.width,
    height: entry.height,
    color: entry.color?.trim() || undefined,
    urls: {
      thumb,
      small,
      regular,
    },
    user: {
      name,
      username,
      profileUrl: withUnsplashAttributionParams(profileUrl),
    },
    links: {
      html: withUnsplashAttributionParams(entry.links?.html?.trim() || profileUrl),
      downloadLocation,
    },
  };
};

export async function GET(request: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: "Missing UNSPLASH_ACCESS_KEY." }, { status: 500 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!query) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const requestedPerPage = Number.parseInt(request.nextUrl.searchParams.get("per_page") ?? `${DEFAULT_PER_PAGE}`, 10) || DEFAULT_PER_PAGE;
  const perPage = Math.max(1, Math.min(MAX_PER_PAGE, requestedPerPage));

  const searchUrl = new URL(UNSPLASH_SEARCH_ENDPOINT);
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("page", `${page}`);
  searchUrl.searchParams.set("per_page", `${perPage}`);
  searchUrl.searchParams.set("content_filter", "high");
  searchUrl.searchParams.set("orientation", "landscape");

  const response = await fetch(searchUrl.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { total?: number; total_pages?: number; results?: UnsplashApiResult[]; errors?: string[] } | null;
  if (!response.ok || !payload) {
    const message = payload?.errors?.[0] || "Unsplash search failed.";
    return NextResponse.json({ error: message }, { status: response.status || 502 });
  }

  const results = (payload.results ?? []).map(mapPhoto).filter((entry): entry is UnsplashPhoto => Boolean(entry));
  const body: UnsplashSearchResponse = {
    total: payload.total ?? results.length,
    totalPages: payload.total_pages ?? 1,
    results,
  };
  return NextResponse.json(body);
}
