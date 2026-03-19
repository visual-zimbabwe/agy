const noteFallbackColor = "#FEEA89";

export const JOKER_NOTE_COLOR = "#D6FF57";
export const THRONE_NOTE_COLOR = "#FF2400";

const RESERVED_NOTE_COLORS = new Set([JOKER_NOTE_COLOR, THRONE_NOTE_COLOR]);

export const sanitizeStandardNoteColor = (color: string | undefined, fallback = noteFallbackColor) => {
  if (!color) {
    return fallback;
  }

  const normalized = color.toUpperCase();
  return RESERVED_NOTE_COLORS.has(normalized) ? fallback : color;
};
