export const DEFAULT_STANDARD_NOTE_COLOR = "#FEEA89";

export const sanitizeStandardNoteColor = (color: string | undefined, fallback = DEFAULT_STANDARD_NOTE_COLOR) => {
  if (!color) {
    return fallback;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
};
