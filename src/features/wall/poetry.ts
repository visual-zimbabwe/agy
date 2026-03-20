import { NOTE_DEFAULTS, POETRY_NOTE_DEFAULTS } from "@/features/wall/constants";
import { POETRY_NOTE_COLOR } from "@/features/wall/special-notes";
import type { Note, PoetryNote, PoetrySearchField, PoetrySearchMatchType } from "@/features/wall/types";

export const POETRY_NOTE_CACHE_KEY = "agy-poetry-cache-v1";
export const POETRY_NOTE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
export const POETRY_NOTE_SOURCE = "PoetryDB";
export const poetryLoadingText = "Finding a poem from PoetryDB...";
export const poetryErrorText = "PoetryDB is unavailable right now.\n\nRefresh the Poetry note later to try again.";
export const DEFAULT_POETRY_SEARCH_FIELD: PoetrySearchField = "random";
export const DEFAULT_POETRY_MATCH_TYPE: PoetrySearchMatchType = "partial";
export const POETRY_SEARCH_FIELD_OPTIONS: Array<{ value: PoetrySearchField; label: string; placeholder: string }> = [
  { value: "random", label: "Random", placeholder: "Load a daily random poem" },
  { value: "author", label: "Author", placeholder: "Emily Dickinson" },
  { value: "title", label: "Title", placeholder: "Ozymandias" },
  { value: "lines", label: "Lines", placeholder: "part of a line" },
  { value: "linecount", label: "Line Count", placeholder: "14" },
];

const pad = (value: number) => String(value).padStart(2, "0");

export const getPoetryDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const normalizePoetrySearchQuery = (value?: string | null) => value?.trim().replace(/\s+/g, " ") ?? "";

export const normalizePoetrySearchField = (value?: string | null): PoetrySearchField =>
  value === "author" || value === "title" || value === "lines" || value === "linecount" ? value : DEFAULT_POETRY_SEARCH_FIELD;

export const normalizePoetryMatchType = (value?: string | null): PoetrySearchMatchType =>
  value === "exact" ? "exact" : DEFAULT_POETRY_MATCH_TYPE;

export const buildPoetryCacheKey = ({
  dateKey,
  searchField,
  searchQuery,
  matchType,
}: {
  dateKey: string;
  searchField?: PoetrySearchField;
  searchQuery?: string;
  matchType?: PoetrySearchMatchType;
}) => {
  const normalizedField = normalizePoetrySearchField(searchField);
  const normalizedQuery = normalizePoetrySearchQuery(searchQuery).toLowerCase();
  const normalizedMatch = normalizePoetryMatchType(matchType);
  return `${dateKey}::${normalizedField}::${normalizedMatch}::${normalizedQuery || "-"}`;
};

export const defaultPoetryNoteState = (overrides?: Partial<PoetryNote>): PoetryNote => {
  const normalizedOverrides = overrides
    ? {
        ...overrides,
        searchField: normalizePoetrySearchField(overrides.searchField),
        searchQuery: normalizePoetrySearchQuery(overrides.searchQuery),
        matchType: normalizePoetryMatchType(overrides.matchType),
      }
    : undefined;

  return {
    status: "idle",
    lines: [],
    searchField: DEFAULT_POETRY_SEARCH_FIELD,
    searchQuery: "",
    matchType: DEFAULT_POETRY_MATCH_TYPE,
    ...normalizedOverrides,
  };
};

export const formatPoetryNoteText = (poetry?: Pick<PoetryNote, "lines"> | null) => poetry?.lines?.join("\n") ?? "";

const roughWrappedLines = (text: string, maxWidth: number, characterWidth: number) => {
  const roughChars = Math.max(12, Math.floor(maxWidth / characterWidth));
  return Math.max(1, Math.ceil(Math.max(1, text.length) / roughChars));
};

const measureWrappedLinesWithCanvas = (text: string, maxWidth: number, font: string, fallbackCharacterWidth: number) => {
  const paragraphs = text.split("\n");

  if (typeof document === "undefined") {
    return paragraphs.reduce(
      (total, paragraph) => total + roughWrappedLines(paragraph.trim() || " ", maxWidth, fallbackCharacterWidth),
      0,
    );
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return paragraphs.reduce(
      (total, paragraph) => total + roughWrappedLines(paragraph.trim() || " ", maxWidth, fallbackCharacterWidth),
      0,
    );
  }

  context.font = font;
  let lines = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines += 1;
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines += 1;
      }
      currentLine = word;
    }

    if (currentLine) {
      lines += 1;
    }
  }

  return Math.max(1, lines);
};

export const getPoetryHeaderHeight = (width: number, poetry?: Pick<PoetryNote, "title" | "author"> | null) => {
  const innerWidth = Math.max(24, width - 36);
  const titleLines = measureWrappedLinesWithCanvas(poetry?.title?.trim() || "Poetry", innerWidth, "600 20px Georgia", 11);
  const authorLines = measureWrappedLinesWithCanvas(poetry?.author?.trim() || POETRY_NOTE_SOURCE, innerWidth, "italic 13px Georgia", 7.2);
  return Math.round(18 + titleLines * 20 + 6 + authorLines * 14 + 10);
};

export const getPoetryNoteDimensions = (poetry?: Pick<PoetryNote, "title" | "author" | "lines"> | null) => {
  const width = POETRY_NOTE_DEFAULTS.width;
  const innerWidth = width - 36;
  const poetryHeaderHeight = getPoetryHeaderHeight(width, poetry);
  const bodyLines = Math.max(
    3,
    (poetry?.lines?.length ?? 0) > 0
      ? (poetry?.lines ?? []).reduce(
          (sum, line) => sum + measureWrappedLinesWithCanvas(line, innerWidth, `400 ${POETRY_NOTE_DEFAULTS.textSizePx}px Georgia`, 7.4),
          0,
        )
      : 3,
  );
  const stanzaBreaks = Math.max(0, (poetry?.lines ?? []).filter((line) => !line.trim()).length);

  const height = Math.max(
    NOTE_DEFAULTS.minHeight,
    Math.round(poetryHeaderHeight + bodyLines * 24 + stanzaBreaks * 10 + 64),
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
