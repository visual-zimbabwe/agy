import { DEFAULT_STANDARD_NOTE_COLOR, sanitizeStandardNoteColor } from "@/features/wall/special-notes";
import type { Note } from "@/features/wall/types";

export const atelierPalette = {
  paper: "#FFFCF8",
  paperShadow: "#1C1C19",
  paperStroke: "rgba(223,192,184,0.58)",
  paperStrokeStrong: "#A33818",
  text: "#1C1C19",
  mutedText: "#5A4B43",
  quietText: "#8C7C72",
  terracotta: "#A33818",
  forest: "#4D6356",
  gold: "#755717",
  glass: "rgba(252,249,244,0.72)",
};

export const resolveNoteFillColor = (note: Note) => sanitizeStandardNoteColor(note.color, DEFAULT_STANDARD_NOTE_COLOR);

export const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  if (![3, 6].includes(normalized.length)) {
    return { r: 28, g: 28, b: 25 };
  }

  const expanded = normalized.length === 3 ? normalized.split("").map((value) => `${value}${value}`).join("") : normalized;
  const intValue = Number.parseInt(expanded, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
};

export const colorWithAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const getContrastTextColor = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.56 ? atelierPalette.text : "#FFFCF8";
};

export const getNoteStrokeColor = ({
  isSelected,
  isHovered,
  isHighlighted,
  accent,
}: {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  accent: string;
}) => {
  if (isHighlighted) {
    return "#F59E0B";
  }
  if (isSelected) {
    return atelierPalette.paperStrokeStrong;
  }
  if (isHovered) {
    return colorWithAlpha(accent, 0.48);
  }
  return atelierPalette.paperStroke;
};

export const getNoteCornerRadius = (note: Note) => {
  if (note.noteKind === "standard") {
    return 18;
  }
  if (note.noteKind === "quote" || note.noteKind === "journal") {
    return 16;
  }
  return 14;
};
