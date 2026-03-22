import { APOD_NOTE_DEFAULTS } from "@/features/wall/apod";
import { WEB_BOOKMARK_DEFAULTS } from "@/features/wall/bookmarks";
import { EISENHOWER_NOTE_DEFAULTS, JOURNAL_NOTE_DEFAULTS, NOTE_DEFAULTS, POETRY_NOTE_DEFAULTS } from "@/features/wall/constants";
import { CURRENCY_NOTE_DEFAULTS } from "@/features/wall/currency";
import { ECONOMIST_NOTE_DEFAULTS } from "@/features/wall/economist";
import { JOKER_NOTE_DEFAULTS, THRONE_NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

export const resolveDefaultNoteTextColor = (noteKind?: Note["noteKind"]) => {
  switch (noteKind) {
    case "journal":
      return JOURNAL_NOTE_DEFAULTS.textColor;
    case "eisenhower":
      return EISENHOWER_NOTE_DEFAULTS.textColor;
    case "joker":
      return JOKER_NOTE_DEFAULTS.textColor;
    case "throne":
      return THRONE_NOTE_DEFAULTS.textColor;
    case "currency":
      return CURRENCY_NOTE_DEFAULTS.textColor;
    case "web-bookmark":
      return WEB_BOOKMARK_DEFAULTS.textColor;
    case "apod":
      return APOD_NOTE_DEFAULTS.textColor;
    case "poetry":
      return POETRY_NOTE_DEFAULTS.textColor;
    case "economist":
      return ECONOMIST_NOTE_DEFAULTS.textColor;
    default:
      return NOTE_DEFAULTS.textColor;
  }
};
