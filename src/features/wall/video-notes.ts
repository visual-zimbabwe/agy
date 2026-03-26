import { type Note, type VideoNote } from "@/features/wall/types";
import {
  createFileNoteState,
  deriveFileNameFromUrl,
  formatFileSize,
  getFileKindLabel,
  inferMimeTypeFromFileName,
} from "@/features/wall/file-notes";

export const VIDEO_NOTE_DEFAULTS = {
  color: "#FFFFFF",
  width: 428,
  height: 338,
  textColor: "#1C1C19",
  textFont: "newsreader" as const,
  textSizePx: 16,
};

export type VideoPlayback =
  | { kind: "embed"; url: string }
  | { kind: "direct"; url: string };

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

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

export const getVideoPlayback = (video?: Partial<VideoNote> | null): VideoPlayback | undefined => {
  const source = clean(video?.url);
  if (!source) {
    return undefined;
  }

  if (isDirectVideoUrl(source) || video?.source === "upload") {
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

export const formatVideoDuration = (seconds?: number) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const createVideoNoteState = (partial?: Partial<VideoNote>): VideoNote => {
  const base = createFileNoteState({
    ...partial,
    mimeType: partial?.mimeType?.trim() || inferMimeTypeFromFileName(partial?.name) || partial?.mimeType,
  });

  return {
    ...base,
    name: partial?.name?.trim() || deriveFileNameFromUrl(base.url) || "Dawn_Atmosphere.mp4",
    durationSeconds: partial?.durationSeconds,
    posterDataUrl: partial?.posterDataUrl?.trim() || undefined,
  };
};

export const normalizeVideoNote = (value: unknown): VideoNote | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const candidate = createVideoNoteState({
    source: raw.source === "link" ? "link" : "upload",
    name: typeof raw.name === "string" ? raw.name : "",
    url: typeof raw.url === "string" ? raw.url : "",
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    extension: typeof raw.extension === "string" ? raw.extension : undefined,
    sizeBytes: asNumber(raw.sizeBytes),
    uploadedAt: asNumber(raw.uploadedAt),
    durationSeconds: asNumber(raw.durationSeconds),
    posterDataUrl: typeof raw.posterDataUrl === "string" ? raw.posterDataUrl : undefined,
  });

  return candidate.url || candidate.name ? candidate : undefined;
};

export const getVideoNoteTitle = (video?: Partial<VideoNote> | null) =>
  video?.name?.trim() || "Untitled video";

export const getVideoNoteMeta = (video?: Partial<VideoNote> | null) => {
  const kind = getFileKindLabel(video);
  const size = formatFileSize(video?.sizeBytes);
  const source = video?.source === "link" && !size ? "Link" : "";
  return [kind, size || source].filter(Boolean).join(" • ");
};

export const buildVideoNoteSearchText = (video?: Partial<VideoNote> | null) => {
  const title = getVideoNoteTitle(video);
  const meta = getVideoNoteMeta(video);
  return meta ? `${title}
${meta}` : title;
};

export const isVideoNote = (
  note?: Pick<Note, "noteKind" | "video"> | null,
): note is Pick<Note, "noteKind" | "video"> & { noteKind: "video"; video: VideoNote } =>
  Boolean(note && note.noteKind === "video" && note.video?.url);

export const toVideoNotePatch = (video: VideoNote): Partial<Note> => ({
  noteKind: "video",
  text: buildVideoNoteSearchText(video),
  quoteAuthor: undefined,
  quoteSource: undefined,
  canon: undefined,
  eisenhower: undefined,
  currency: undefined,
  bookmark: undefined,
  apod: undefined,
  poetry: undefined,
  economist: undefined,
  file: undefined,
  audio: undefined,
  video,
  imageUrl: undefined,
  vocabulary: undefined,
  color: VIDEO_NOTE_DEFAULTS.color,
  textFont: VIDEO_NOTE_DEFAULTS.textFont,
  textColor: VIDEO_NOTE_DEFAULTS.textColor,
  textSizePx: VIDEO_NOTE_DEFAULTS.textSizePx,
  textAlign: "left",
  textVAlign: "top",
  w: VIDEO_NOTE_DEFAULTS.width,
  h: VIDEO_NOTE_DEFAULTS.height,
  tags: ["video"],
});
