import type { Note } from "@/features/wall/types";

export const ECONOMIST_NOTE_DEFAULTS = {
  color: "#F6EFE2",
  width: 332,
  height: 508,
  textColor: "#241B12",
  textFont: "work_sans" as const,
  textSizePx: 13,
};

export const ECONOMIST_NOTE_CACHE_KEY = "agy-economist-cover-cache-v1";
export const ECONOMIST_NOTE_SOURCE_URL = "https://www.economist.com/printedition/covers";

export type EconomistCoverPayload = {
  sourceName: string;
  displayDate: string;
  displayLabel: string;
  imageUrl: string;
  sourceUrl: string;
  fetchedAt: number;
};

export const defaultEconomistCoverPayload = (payload?: Partial<EconomistCoverPayload>): EconomistCoverPayload => ({
  sourceName: payload?.sourceName?.trim() || "The Economist",
  displayDate: payload?.displayDate?.trim() || "",
  displayLabel: payload?.displayLabel?.trim() || payload?.displayDate?.trim() || "Latest cover",
  imageUrl: payload?.imageUrl?.trim() || "",
  sourceUrl: payload?.sourceUrl?.trim() || ECONOMIST_NOTE_SOURCE_URL,
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
    tags: ["economist", "cover", "magazine"],
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
