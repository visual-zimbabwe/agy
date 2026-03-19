import { NOTE_COLORS, NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

const jokerFallbackColor: string = NOTE_COLORS[0] ?? "#FEEA89";

export const JOKER_NOTE_COLOR = "#D6FF57";
export const JOKER_NOTE_TEXT_COLOR = "#2E1065";
export const JOKER_NOTE_SOURCE = "JokeAPI";
export const jokerLifecycleStorageKey = "agy-wall-joker-card-enabled-v1";
export const jokerPendingReplacementStorageKey = "agy-wall-joker-card-pending-v1";
export const jokerLoadingText = "Drawing a joke from JokeAPI...";
export const jokerErrorText = "JokeAPI is unavailable right now.\n\nCreate another standard note later to try again.";

export type JokeApiResponse =
  | {
      error: false;
      category: string;
      type: "single";
      joke: string;
      id: number;
    }
  | {
      error: false;
      category: string;
      type: "twopart";
      setup: string;
      delivery: string;
      id: number;
    }
  | {
      error: true;
      message?: string;
      additionalInfo?: string;
    };

export const isJokerNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "joker" } =>
  Boolean(note && note.noteKind === "joker");

export const hasJokerCard = (notes: Record<string, Note> | Note[]) => {
  const list = Array.isArray(notes) ? notes : Object.values(notes);
  return list.some((note) => isJokerNote(note));
};

export const hasJokerCardBeenActivated = () => Boolean(readStorageValue(jokerLifecycleStorageKey));

export const markJokerCardActivated = () => {
  writeStorageValue(jokerLifecycleStorageKey, "1");
};

export const isJokerReplacementPending = () => Boolean(readStorageValue(jokerPendingReplacementStorageKey));

export const setJokerReplacementPending = (pending: boolean) => {
  writeStorageValue(jokerPendingReplacementStorageKey, pending ? "1" : "");
};

export const sanitizeStandardNoteColor = (color: string | undefined, fallback = jokerFallbackColor) => {
  if (!color) {
    return fallback;
  }
  return color.toUpperCase() === JOKER_NOTE_COLOR ? fallback : color;
};

export const formatJokerNoteText = (response: Extract<JokeApiResponse, { error: false }>) =>
  response.type === "single" ? response.joke.trim() : `${response.setup.trim()}\n\n${response.delivery.trim()}`;

export const fetchJokerJoke = async (): Promise<Extract<JokeApiResponse, { error: false }>> => {
  const response = await fetch(
    "https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single,twopart&safe-mode",
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`JokeAPI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as JokeApiResponse;
  if (payload.error) {
    throw new Error(payload.message ?? payload.additionalInfo ?? "JokeAPI returned an error");
  }

  return payload;
};

export const buildJokerPlaceholderNote = (id: string, x: number, y: number, now: number): Note => ({
  id,
  noteKind: "joker",
  text: jokerLoadingText,
  quoteAuthor: JOKER_NOTE_SOURCE,
  quoteSource: "Loading...",
  imageUrl: undefined,
  textAlign: "left",
  textVAlign: NOTE_DEFAULTS.textVAlign,
  textFont: "nunito",
  textColor: JOKER_NOTE_TEXT_COLOR,
  textSizePx: 17,
  tags: ["joker"],
  textSize: NOTE_DEFAULTS.textSize,
  pinned: false,
  highlighted: false,
  x,
  y,
  w: 240,
  h: 184,
  color: JOKER_NOTE_COLOR,
  createdAt: now,
  updatedAt: now,
});

