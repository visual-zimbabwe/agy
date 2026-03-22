import type { ApodNote } from "@/features/wall/types";

export type NasaApodResponse = {
  date?: string;
  title?: string;
  explanation?: string;
  copyright?: string;
  media_type?: string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
};

export type ResolvedApodMedia = {
  mediaType: "image" | "video" | "other";
  imageUrl?: string;
  fallbackImageUrl?: string;
  pageUrl?: string;
};

export type ApodPlayback =
  | { kind: "embed"; url: string }
  | { kind: "direct"; url: string };

const clean = (value?: string | null) => value?.trim() || undefined;
const directVideoExtensions = [".mp4", ".webm", ".ogg", ".mov"];

const parseUrl = (value?: string | null) => {
  const cleaned = clean(value);
  if (!cleaned) {
    return undefined;
  }

  try {
    return new URL(cleaned);
  } catch {
    return undefined;
  }
};

const getYouTubeEmbedUrl = (target: URL) => {
  const host = target.hostname.toLowerCase();
  const parts = target.pathname.split("/").filter(Boolean);
  let videoId: string | undefined;

  if (host.includes("youtu.be")) {
    videoId = parts.at(-1);
  } else if (host.includes("youtube.com")) {
    if (parts[0] === "watch") {
      videoId = target.searchParams.get("v") ?? undefined;
    } else if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
      videoId = parts[1];
    }
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
};

const getVimeoEmbedUrl = (target: URL) => {
  const host = target.hostname.toLowerCase();
  const parts = target.pathname.split("/").filter(Boolean);
  if (host.includes("player.vimeo.com") && parts[0] === "video" && parts[1]) {
    return `https://player.vimeo.com/video/${parts[1]}`;
  }
  if (host.includes("vimeo.com") && parts[0]) {
    return `https://player.vimeo.com/video/${parts[0]}`;
  }
  return undefined;
};

const isDirectVideoUrl = (value?: string | null) => {
  const target = parseUrl(value);
  if (!target) {
    return false;
  }
  const pathname = target.pathname.toLowerCase();
  return directVideoExtensions.some((extension) => pathname.endsWith(extension));
};

export const resolveApodMedia = (payload: NasaApodResponse): ResolvedApodMedia => {
  const mediaType = payload.media_type === "image" || payload.media_type === "video" ? payload.media_type : "other";
  const hdurl = clean(payload.hdurl);
  const url = clean(payload.url);
  const thumbnailUrl = clean(payload.thumbnail_url);

  if (mediaType === "video") {
    return {
      mediaType,
      imageUrl: thumbnailUrl,
      fallbackImageUrl: thumbnailUrl,
      pageUrl: url,
    };
  }

  return {
    mediaType,
    imageUrl: hdurl || url || thumbnailUrl,
    fallbackImageUrl: url || thumbnailUrl || hdurl,
    pageUrl: url || hdurl,
  };
};

export const getApodPlayback = (apod?: Pick<ApodNote, "mediaType" | "pageUrl"> | null): ApodPlayback | undefined => {
  if (apod?.mediaType !== "video") {
    return undefined;
  }

  const source = clean(apod.pageUrl);
  if (!source) {
    return undefined;
  }

  if (isDirectVideoUrl(source)) {
    return { kind: "direct", url: source };
  }

  const parsed = parseUrl(source);
  if (!parsed) {
    return undefined;
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(parsed);
  if (youtubeEmbedUrl) {
    return { kind: "embed", url: youtubeEmbedUrl };
  }

  const vimeoEmbedUrl = getVimeoEmbedUrl(parsed);
  if (vimeoEmbedUrl) {
    return { kind: "embed", url: vimeoEmbedUrl };
  }

  return undefined;
};

export const getApodDownloadUrl = (apod?: Pick<ApodNote, "mediaType" | "pageUrl" | "imageUrl" | "fallbackImageUrl"> | null) => {
  const pageUrl = clean(apod?.pageUrl);
  if (apod?.mediaType === "video" && pageUrl && isDirectVideoUrl(pageUrl)) {
    return pageUrl;
  }
  return clean(apod?.imageUrl) || clean(apod?.fallbackImageUrl);
};

export const cleanApodField = clean;
