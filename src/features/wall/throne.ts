import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { THRONE_NOTE_COLOR, sanitizeStandardNoteColor } from "@/features/wall/special-notes";
import type { Note } from "@/features/wall/types";

export { THRONE_NOTE_COLOR, sanitizeStandardNoteColor };

export const THRONE_NOTE_TEXT_COLOR = "#FFF5E6";
export const THRONE_NOTE_SOURCE = "Game of Thrones Quotes API";
export const throneLoadingText = "Summoning a line from Westeros...";
export const throneErrorText = "The Iron Throne is quiet right now.\n\nRefresh the Throne note later to try again.";

export type GameOfThronesQuoteResponse = {
  sentence: string;
  character?: {
    name?: string;
    slug?: string;
    house?: {
      name?: string;
      slug?: string;
    };
  };
};

export const isThroneNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "throne" } =>
  Boolean(note && note.noteKind === "throne");

export const formatThroneNoteText = (response: GameOfThronesQuoteResponse) => response.sentence.trim();

export const fetchThroneQuote = async (): Promise<GameOfThronesQuoteResponse> => {
  const response = await fetch("https://api.gameofthronesquotes.xyz/v1/random", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Game of Thrones Quotes API request failed with status ${response.status}`);
  }

  return (await response.json()) as GameOfThronesQuoteResponse;
};

export const buildThronePlaceholderNote = (id: string, x: number, y: number, now: number): Note => ({
  id,
  noteKind: "throne",
  text: throneLoadingText,
  quoteAuthor: THRONE_NOTE_SOURCE,
  quoteSource: "Loading...",
  imageUrl: undefined,
  textAlign: "left",
  textVAlign: NOTE_DEFAULTS.textVAlign,
  textFont: "nunito",
  textColor: THRONE_NOTE_TEXT_COLOR,
  textSizePx: 17,
  tags: ["throne", "quote"],
  textSize: NOTE_DEFAULTS.textSize,
  pinned: false,
  highlighted: false,
  x,
  y,
  w: 240,
  h: 184,
  color: THRONE_NOTE_COLOR,
  createdAt: now,
  updatedAt: now,
});
