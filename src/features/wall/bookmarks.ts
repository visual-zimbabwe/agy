import type { Note, WebBookmarkKind, WebBookmarkMetadata, WebBookmarkNote } from "@/features/wall/types";
import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export const WEB_BOOKMARK_TTL_MS = 24 * 60 * 60 * 1000;
export const WEB_BOOKMARK_ACCENT = "#004753";
export const WEB_BOOKMARK_LIGHT_SURFACE = "#FFFFFF";
export const WEB_BOOKMARK_DARK_SURFACE = "#000000";
export const WEB_BOOKMARK_DEFAULTS = {
  width: 320,
  height: 208,
  compactHeight: 132,
  comfortableHeight: 182,
  expandedHeight: 248,
  color: WEB_BOOKMARK_LIGHT_SURFACE,
  textColor: "#052C33",
  textFont: "work_sans" as const,
  textSizePx: 15,
};

const cacheKey = `${appSlug}-bookmark-preview-cache-v1`;
const legacyCacheKeys = [`${legacyAppSlug}-bookmark-preview-cache-v1`];

type BookmarkCacheEntry = {
  metadata?: WebBookmarkMetadata;
  fetchedAt: number;
  lastSuccessAt?: number;
  error?: string;
};

type BookmarkCacheRecord = Record<string, BookmarkCacheEntry>;

const kindLabels: Record<WebBookmarkKind, string> = {
  article: "Article",
  video: "Video",
  repo: "Repo",
  docs: "Docs",
  product: "Product",
  post: "Post",
  paper: "Paper",
  website: "Website",
};

export const normalizeBookmarkUrl = (value: string) => {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    parsed.hash = "";
    if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) {
      parsed.port = "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
};

export const inferBookmarkKindLabel = (kind?: WebBookmarkKind) => (kind ? kindLabels[kind] : "Website");

export const bookmarkDomainLabel = (value?: string) => value?.replace(/^www\./i, "") ?? "";

export const bookmarkUpdatedLabel = (timestamp?: number) => {
  if (!timestamp) {
    return "Not fetched yet";
  }
  const elapsed = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(elapsed / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const resolveBookmarkDisplaySize = (note: Pick<Note, "w" | "h">) => {
  if (note.w < 260 || note.h < 150) {
    return "compact" as const;
  }
  if (note.w >= 320 && note.h >= 220) {
    return "expanded" as const;
  }
  return "comfortable" as const;
};

const readCache = (): BookmarkCacheRecord => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = readStorageValue(cacheKey, legacyCacheKeys);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? (parsed as BookmarkCacheRecord) : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: BookmarkCacheRecord) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    writeStorageValue(cacheKey, JSON.stringify(cache));
  } catch {
    // Ignore storage failures.
  }
};

export const readBookmarkCacheEntry = (url: string) => {
  const normalized = normalizeBookmarkUrl(url);
  if (!normalized) {
    return undefined;
  }
  return readCache()[normalized];
};

export const writeBookmarkCacheEntry = (url: string, entry: BookmarkCacheEntry) => {
  const normalized = normalizeBookmarkUrl(url);
  if (!normalized) {
    return;
  }
  const cache = readCache();
  cache[normalized] = entry;
  writeCache(cache);
};

export const isBookmarkCacheFresh = (entry?: Pick<BookmarkCacheEntry, "fetchedAt"> | null, ttlMs = WEB_BOOKMARK_TTL_MS) =>
  Boolean(entry?.fetchedAt && Date.now() - entry.fetchedAt < ttlMs);

export const buildBookmarkFallbackMetadata = (normalizedUrl: string): WebBookmarkMetadata => {
  const parsed = new URL(normalizedUrl);
  const domain = bookmarkDomainLabel(parsed.hostname);
  return {
    url: normalizedUrl,
    finalUrl: normalizedUrl,
    title: domain,
    description: "",
    siteName: domain,
    domain,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    kind: "website",
  };
};

export const createBookmarkNoteState = (url = ""): WebBookmarkNote => {
  const normalizedUrl = normalizeBookmarkUrl(url);
  return {
    url,
    normalizedUrl,
    metadata: normalizedUrl ? buildBookmarkFallbackMetadata(normalizedUrl) : undefined,
    status: "idle",
  };
};

export const noteHasBookmarkUrl = (note?: Pick<Note, "bookmark"> | null) => Boolean(note?.bookmark?.normalizedUrl || note?.bookmark?.url.trim());

export const isWebBookmarkNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "web-bookmark" } =>
  Boolean(note && note.noteKind === "web-bookmark");
