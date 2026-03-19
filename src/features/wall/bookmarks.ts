import type { Note, WebBookmarkKind, WebBookmarkMetadata, WebBookmarkNote } from "@/features/wall/types";
import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export const WEB_BOOKMARK_TTL_MS = 24 * 60 * 60 * 1000;
export const WEB_BOOKMARK_ACCENT = "#004753";
export const WEB_BOOKMARK_LIGHT_SURFACE = "#FFFFFF";
export const WEB_BOOKMARK_DARK_SURFACE = "#000000";
export const WEB_BOOKMARK_DEFAULTS = {
  width: 560,
  height: 126,
  compactHeight: 116,
  comfortableHeight: 126,
  expandedHeight: 170,
  compactWidth: 320,
  comfortableWidth: 560,
  expandedWidth: 640,
  color: WEB_BOOKMARK_LIGHT_SURFACE,
  textColor: "#052C33",
  textFont: "work_sans" as const,
  textSizePx: 15,
};

const cacheKey = `${appSlug}-bookmark-preview-cache-v2`;
const legacyCacheKeys = [`${legacyAppSlug}-bookmark-preview-cache-v2`, `${appSlug}-bookmark-preview-cache-v1`, `${legacyAppSlug}-bookmark-preview-cache-v1`];

const LEGACY_AUTO_RESIZE_SIZES = [
  { w: 320, h: 208 },
  { w: 320, h: 182 },
  { w: 320, h: 248 },
];

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

export const bookmarkDomainLabel = (value?: string) => {
  if (!value) {
    return "";
  }
  try {
    const parsed = value.includes("://") ? new URL(value) : undefined;
    return (parsed?.hostname ?? value).replace(/^www\./i, "");
  } catch {
    return value.replace(/^www\./i, "");
  }
};

export const bookmarkUrlLabel = (value?: string) => {
  if (!value) {
    return "";
  }
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return `${parsed.hostname.replace(/^www\./i, "")}${parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
};

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
  if (note.w < 420 || note.h < 120) {
    return "compact" as const;
  }
  if (note.w >= 620 || note.h >= 160) {
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

export const isBookmarkMetadataRich = (metadata?: WebBookmarkMetadata | null) => {
  if (!metadata) {
    return false;
  }
  const domain = bookmarkDomainLabel(metadata.domain || metadata.finalUrl || metadata.url);
  const title = metadata.title.trim();
  const description = metadata.description.trim();
  const siteName = metadata.siteName.trim();

  return Boolean(
    description ||
      metadata.imageUrl ||
      (title && title.toLowerCase() !== domain.toLowerCase()) ||
      (siteName && siteName.toLowerCase() !== domain.toLowerCase()),
  );
};

export const getBookmarkPreferredSize = (metadata?: WebBookmarkMetadata | null) => {
  if (metadata?.imageUrl) {
    return { w: WEB_BOOKMARK_DEFAULTS.comfortableWidth, h: WEB_BOOKMARK_DEFAULTS.comfortableHeight };
  }
  return { w: 460, h: 134 };
};

export const shouldAutoResizeBookmarkNote = (note: Pick<Note, "w" | "h">) =>
  LEGACY_AUTO_RESIZE_SIZES.some((size) => size.w === Math.round(note.w) && size.h === Math.round(note.h)) || note.h >= 180;

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
