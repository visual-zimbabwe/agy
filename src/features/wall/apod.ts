import type { ApodNote, Note } from "@/features/wall/types";

export const APOD_NOTE_DEFAULTS = {
  color: "#F4F7FB",
  width: 320,
  height: 280,
  textColor: "#0F172A",
  textFont: "work_sans" as const,
  textSizePx: 14,
};

export const APOD_NOTE_CACHE_KEY = "agy-apod-cache-v1";
export const APOD_NOTE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, "0");

export const getApodDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const defaultApodNoteState = (overrides?: Partial<ApodNote>): ApodNote => ({
  status: "idle",
  ...overrides,
});

export const buildApodNote = (id: string, x: number, y: number, existing?: Note): Note => {
  const now = Date.now();
  return {
    id: existing?.id ?? id,
    noteKind: "apod",
    text: existing?.text ?? "",
    quoteAuthor: undefined,
    quoteSource: undefined,
    canon: undefined,
    eisenhower: undefined,
    bookmark: undefined,
    apod: defaultApodNoteState(existing?.apod),
    imageUrl: existing?.imageUrl ?? existing?.apod?.imageUrl ?? existing?.apod?.fallbackImageUrl,
    textAlign: "left",
    textVAlign: "top",
    textFont: existing?.textFont ?? APOD_NOTE_DEFAULTS.textFont,
    textColor: existing?.textColor ?? APOD_NOTE_DEFAULTS.textColor,
    textSizePx: existing?.textSizePx ?? APOD_NOTE_DEFAULTS.textSizePx,
    tags: existing?.tags?.length ? existing.tags : ["space", "nasa", "apod"],
    textSize: existing?.textSize ?? "md",
    pinned: existing?.pinned ?? false,
    highlighted: existing?.highlighted ?? false,
    x: existing?.x ?? x,
    y: existing?.y ?? y,
    w: existing?.w ?? APOD_NOTE_DEFAULTS.width,
    h: existing?.h ?? APOD_NOTE_DEFAULTS.height,
    color: APOD_NOTE_DEFAULTS.color,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing?.updatedAt ?? now,
    vocabulary: undefined,
  };
};

export const isApodNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "apod" } =>
  Boolean(note && note.noteKind === "apod");

export const getApodCaption = (note?: Pick<Note, "text" | "apod"> | null) => {
  const title = note?.apod?.title?.trim() || "";
  const date = note?.apod?.date?.trim() || "";
  const meta = [title, date].filter(Boolean).join(" | ");
  return meta || note?.text?.trim() || "";
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "apod";

export const getApodDownloadFilename = (apod?: Pick<ApodNote, "date" | "title" | "imageUrl" | "fallbackImageUrl"> | null) => {
  const title = slugify(apod?.title?.trim() || "apod");
  const date = apod?.date?.trim() || getApodDateKey();
  const source = apod?.imageUrl || apod?.fallbackImageUrl || "";
  const extMatch = source.match(/\.([a-z0-9]{3,4})(?:$|[?#])/i);
  const ext = extMatch?.[1]?.toLowerCase() || "jpg";
  return `apod-${date}-${title}.${ext}`;
};

export const shouldRefreshApod = (apod?: Pick<ApodNote, "date" | "status"> | null, timestamp = Date.now()) => {
  if (!apod?.date) {
    return true;
  }
  if (apod.status === "loading") {
    return false;
  }
  return apod.date !== getApodDateKey(timestamp);
};
