import type { Note } from "@/features/wall/types";

export const ECONOMIST_NOTE_DEFAULTS = {
  color: "#F6EFE2",
  width: 332,
  height: 508,
  textColor: "#241B12",
  textFont: "work_sans" as const,
  textSizePx: 13,
};

export const ECONOMIST_NOTE_CACHE_KEY = "agy-economist-cover-cache-v2";
export const ECONOMIST_NOTE_SOURCE_URL = "https://www.economist.com/printedition/covers";

export type EconomistSourceId = "economist" | "barrons" | "newyorker" | "newsweek" | "forbes";

export type EconomistMagazineSource = {
  sourceId: EconomistSourceId;
  sourceName: string;
  sourceUrl: string;
};

export const ECONOMIST_MAGAZINE_SOURCES: EconomistMagazineSource[] = [
  {
    sourceId: "economist",
    sourceName: "The Economist",
    sourceUrl: ECONOMIST_NOTE_SOURCE_URL,
  },
  {
    sourceId: "barrons",
    sourceName: "Barron's",
    sourceUrl: "https://www.barrons.com/magazine/archives",
  },
  {
    sourceId: "newyorker",
    sourceName: "The New Yorker",
    sourceUrl: "https://www.newyorker.com/tag/covers",
  },
  {
    sourceId: "newsweek",
    sourceName: "Newsweek",
    sourceUrl: "https://www.newsweek.com/archive",
  },
  {
    sourceId: "forbes",
    sourceName: "Forbes",
    sourceUrl: "https://www.forbesmagazine.com/back-issues",
  },
];

const defaultMagazineSource: EconomistMagazineSource = ECONOMIST_MAGAZINE_SOURCES[0]!;

export const isEconomistSourceId = (value?: string | null): value is EconomistSourceId =>
  value === "economist" || value === "barrons" || value === "newyorker" || value === "newsweek" || value === "forbes";

export const findEconomistMagazineSourceById = (sourceId?: string | null) =>
  ECONOMIST_MAGAZINE_SOURCES.find((entry) => entry.sourceId === sourceId);

export const findEconomistMagazineSourceByUrl = (sourceUrl?: string | null) => {
  const normalized = sourceUrl?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return ECONOMIST_MAGAZINE_SOURCES.find((entry) => entry.sourceUrl.trim().toLowerCase() === normalized);
};

export const getEconomistMagazineSource = (sourceId?: string | null) =>
  findEconomistMagazineSourceById(sourceId) ?? defaultMagazineSource;

export type EconomistCoverPayload = {
  sourceId: EconomistSourceId;
  sourceName: string;
  displayDate: string;
  displayLabel: string;
  imageUrl: string;
  sourceUrl: string;
  fetchedAt: number;
};

export const defaultEconomistCoverPayload = (payload?: Partial<EconomistCoverPayload>): EconomistCoverPayload => ({
  sourceId: isEconomistSourceId(payload?.sourceId) ? payload.sourceId : "economist",
  sourceName: payload?.sourceName?.trim() || getEconomistMagazineSource(payload?.sourceId).sourceName,
  displayDate: payload?.displayDate?.trim() || "",
  displayLabel: payload?.displayLabel?.trim() || payload?.displayDate?.trim() || "Latest cover",
  imageUrl: payload?.imageUrl?.trim() || "",
  sourceUrl: payload?.sourceUrl?.trim() || getEconomistMagazineSource(payload?.sourceId).sourceUrl,
  fetchedAt: typeof payload?.fetchedAt === "number" ? payload.fetchedAt : 0,
});

export const formatEconomistNoteText = (payload: Pick<EconomistCoverPayload, "sourceName" | "displayLabel" | "displayDate">) => {
  const title = payload.sourceName?.trim() || "The Economist";
  const label = payload.displayLabel?.trim() || payload.displayDate?.trim();
  return label ? `${title}\n${label}` : title;
};

export const buildEconomistNote = (id: string, x: number, y: number, payload?: Partial<EconomistCoverPayload>): Note => {
  const now = Date.now();
  const cover = defaultEconomistCoverPayload(payload);
  return {
    id,
    noteKind: "economist",
    text: formatEconomistNoteText(cover),
    quoteAuthor: cover.sourceUrl,
    quoteSource: cover.displayDate || cover.displayLabel,
    imageUrl: cover.imageUrl || undefined,
    textAlign: "left",
    textVAlign: "top",
    textFont: ECONOMIST_NOTE_DEFAULTS.textFont,
    textColor: ECONOMIST_NOTE_DEFAULTS.textColor,
    textSizePx: ECONOMIST_NOTE_DEFAULTS.textSizePx,
    tags: [cover.sourceId, "cover", "magazine"],
    textSize: "md",
    pinned: false,
    highlighted: false,
    x,
    y,
    w: ECONOMIST_NOTE_DEFAULTS.width,
    h: ECONOMIST_NOTE_DEFAULTS.height,
    color: ECONOMIST_NOTE_DEFAULTS.color,
    createdAt: now,
    updatedAt: now,
  };
};

export const isEconomistNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "economist" } =>
  Boolean(note && note.noteKind === "economist");

export const getEconomistNoteSourceId = (note: Pick<Note, "noteKind" | "quoteAuthor" | "tags" | "text">) => {
  if (!isEconomistNote(note)) {
    return undefined;
  }

  const taggedSource = note.tags.find((tag) => isEconomistSourceId(tag));
  if (taggedSource) {
    return taggedSource;
  }

  const byUrl = findEconomistMagazineSourceByUrl(note.quoteAuthor);
  if (byUrl) {
    return byUrl.sourceId;
  }

  const title = note.text.split("\n")[0]?.trim().toLowerCase();
  const byTitle = ECONOMIST_MAGAZINE_SOURCES.find((entry) => entry.sourceName.trim().toLowerCase() === title);
  return byTitle?.sourceId ?? "economist";
};

export const shouldRefreshEconomistNote = (note: Note) => {
  if (!isEconomistNote(note)) {
    return false;
  }
  if (!note.imageUrl) {
    return true;
  }
  const lastUpdated = typeof note.updatedAt === "number" ? note.updatedAt : 0;
  return Date.now() - lastUpdated > 15 * 60 * 1000;
};

