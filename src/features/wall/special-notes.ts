export const DEFAULT_STANDARD_NOTE_COLOR = "#FEEA89";

export const JOKER_NOTE_COLOR = "#D6FF57";
export const THRONE_NOTE_COLOR = "#FF2400";

const RESERVED_NOTE_COLORS = new Set([JOKER_NOTE_COLOR, THRONE_NOTE_COLOR]);

export const sanitizeStandardNoteColor = (color: string | undefined, fallback = DEFAULT_STANDARD_NOTE_COLOR) => {
  if (!color) {
    return fallback;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return fallback;
  }

  const normalized = trimmed.toUpperCase();
  return RESERVED_NOTE_COLORS.has(normalized) ? fallback : trimmed;
};

