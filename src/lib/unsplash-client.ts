import type { UnsplashSearchResponse } from "@/lib/unsplash";

export const searchUnsplashPhotos = async (query: string, perPage = 18) => {
  const response = await fetch(`/api/unsplash/search?q=${encodeURIComponent(query)}&per_page=${perPage}`);
  const payload = (await response.json().catch(() => null)) as UnsplashSearchResponse & { error?: string } | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? "Unsplash search failed.");
  }
  return payload;
};

export const trackUnsplashDownload = async (location: string) => {
  await fetch("/api/unsplash/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  }).catch(() => undefined);
};
