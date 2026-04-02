import type { PageBookmarkData } from "@/features/page/types";

type SharedBookmarkPreviewResponse = {
  error?: string;
  normalizedUrl?: string;
  metadata?: {
    title?: string;
    description?: string;
    domain?: string;
    imageUrl?: string;
  };
};

export const fetchPageBookmarkPreview = async (url: string): Promise<Partial<PageBookmarkData>> => {
  const response = await fetch(`/api/bookmarks/preview?url=${encodeURIComponent(url)}`);
  const payload = (await response.json().catch(() => ({}))) as SharedBookmarkPreviewResponse;

  if (!response.ok || !payload.metadata) {
    throw new Error(payload.error || "Preview request failed.");
  }

  return {
    title: payload.metadata.title,
    description: payload.metadata.description,
    imageUrl: payload.metadata.imageUrl,
    hostname: payload.metadata.domain,
  };
};
