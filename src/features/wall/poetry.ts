import { NOTE_DEFAULTS, POETRY_NOTE_DEFAULTS } from "@/features/wall/constants";
import { POETRY_NOTE_COLOR } from "@/features/wall/special-notes";
import type { Note, PoetryNote } from "@/features/wall/types";

export const POETRY_NOTE_CACHE_KEY = "agy-poetry-cache-v1";
export const POETRY_NOTE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
export const POETRY_NOTE_SOURCE = "PoetryDB";
export const poetryLoadingText = "Finding a poem from PoetryDB...";
export const poetryErrorText = "PoetryDB is unavailable right now.\n\nRefresh the Poetry note later to try again.";

const pad = (value: number) => String(value).padStart(2, "0");

export const getPoetryDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const defaultPoetryNoteState = (overrides?: Partial<PoetryNote>): PoetryNote => ({
  status: "idle",
  lines: [],
  ...overrides,
});

export const formatPoetryNoteText = (poetry?: Pick<PoetryNote, "lines"> | null) => poetry?.lines?.join("\n") ?? "";

const roughWrappedLines = (text: string, maxWidth: number, characterWidth: number) => {
  const roughChars = Math.max(18, Math.floor(maxWidth / characterWidth));
  return Math.max(1, Math.ceil(Math.max(1, text.length) / roughChars));
};

const measureWrappedLines = (text: string, maxWidth: number, fontSize: number, characterWidth = fontSize * 0.58) => {
  const paragraphs = text.split("\n");
  return paragraphs.reduce((total, paragraph) => total + roughWrappedLines(paragraph.trim() || " ", maxWidth, characterWidth), 0);
};

export const getPoetryNoteDimensions = (poetry?: Pick<PoetryNote, "title" | "author" | "lines"> | null) => {
  const width = POETRY_NOTE_DEFAULTS.width;
  const innerWidth = width - 36;
  const titleLines = measureWrappedLines(poetry?.title?.trim() || "Poetry", innerWidth, 20, 11);
  const authorLines = measureWrappedLines(poetry?.author?.trim() || POETRY_NOTE_SOURCE, innerWidth, 13, 7.2);
  const bodyLines = Math.max(
    3,
    (poetry?.lines?.length ?? 0) > 0
      ? poetry!.lines.reduce((sum, line) => sum + measureWrappedLines(line, innerWidth, POETRY_NOTE_DEFAULTS.textSizePx, 8), 0)
      : 3,
  );

  const height = Math.max(
    NOTE_DEFAULTS.minHeight,
    Math.round(48 + titleLines * 26 + authorLines * 18 + bodyLines * 22 + 44),
  );

  return { width, height };
};

export const buildPoetryNote = (id: string, x: number, y: number, existing?: Note): Note => {
  const now = Date.now();
  const poetry = defaultPoetryNoteState(existing?.poetry);
  const dimensions = getPoetryNoteDimensions(poetry);
  return {
    id: existing?.id ?? id,
    noteKind: "poetry",
    text: existing?.text ?? formatPoetryNoteText(poetry),
    quoteAuthor: existing?.quoteAuthor ?? poetry.author ?? "",
    quoteSource: existing?.quoteSource ?? POETRY_NOTE_SOURCE,
    canon: undefined,
    eisenhower: undefined,
    currency: undefined,
    bookmark: undefined,
    apod: undefined,
    poetry,
    imageUrl: undefined,
    textAlign: "left",
    textVAlign: "top",
    textFont: existing?.textFont ?? POETRY_NOTE_DEFAULTS.textFont,
    textColor: existing?.textColor ?? POETRY_NOTE_DEFAULTS.textColor,
    textSizePx: existing?.textSizePx ?? POETRY_NOTE_DEFAULTS.textSizePx,
    tags: existing?.tags?.length ? existing.tags : ["poetry", "poem"],
    textSize: existing?.textSize ?? "md",
    pinned: existing?.pinned ?? false,
    highlighted: existing?.highlighted ?? false,
    x: existing?.x ?? x,
    y: existing?.y ?? y,
    w: existing?.w ?? dimensions.width,
    h: existing?.h ?? dimensions.height,
    color: POETRY_NOTE_COLOR,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing?.updatedAt ?? now,
    vocabulary: undefined,
  };
};

export const isPoetryNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "poetry" } =>
  Boolean(note && note.noteKind === "poetry");

export const shouldRefreshPoetry = (poetry?: Pick<PoetryNote, "dateKey" | "status"> | null, timestamp = Date.now()) => {
  if (!poetry?.dateKey) {
    return true;
  }
  if (poetry.status === "loading") {
    return false;
  }
  return poetry.dateKey !== getPoetryDateKey(timestamp);
};

export const getPoetryTitle = (note?: Pick<Note, "poetry"> | null) => note?.poetry?.title?.trim() || "Poetry";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "poetry";

export const getPoetryExportBaseName = (poetry?: Pick<PoetryNote, "dateKey" | "title" | "author"> | null) => {
  const date = poetry?.dateKey?.trim() || getPoetryDateKey();
  const title = slugify(poetry?.title?.trim() || "poetry");
  const author = slugify(poetry?.author?.trim() || "poetrydb");
  return `poetry-${date}-${author}-${title}`;
};
