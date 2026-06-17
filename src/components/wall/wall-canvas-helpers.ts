"use client";

import { NOTE_DEFAULTS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS, NOTE_TEXT_SIZES } from "@/features/wall/constants";
import type { Note, PersistedWallState } from "@/features/wall/types";
import { clamp } from "@/lib/wall-utils";

export const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isPersistedWallStateLike = (value: unknown): value is PersistedWallState => {
  if (!isObjectRecord(value)) {
    return false;
  }
  const notes = value.notes;
  const zones = value.zones;
  const zoneGroups = value.zoneGroups;
  const noteGroups = value.noteGroups;
  const links = value.links;
  const camera = value.camera;
  return (
    isObjectRecord(notes) &&
    isObjectRecord(zones) &&
    isObjectRecord(zoneGroups) &&
    (noteGroups === undefined || isObjectRecord(noteGroups)) &&
    isObjectRecord(links) &&
    isObjectRecord(camera) &&
    typeof camera.x === "number" &&
    typeof camera.y === "number" &&
    typeof camera.zoom === "number"
  );
};

export const tagGroupColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 360;
  }
  return `hsl(${hash} 80% 45%)`;
};

export const recencyIntensity = (updatedAt: number, referenceTs: number, windowMs = 1000 * 60 * 60 * 24 * 7) => {
  const age = Math.max(0, referenceTs - updatedAt);
  return clamp(1 - age / windowMs, 0, 1);
};

export const formatJournalDateLabel = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);

const textStyleBySize = Object.fromEntries(
  NOTE_TEXT_SIZES.map((entry) => [entry.value, { fontSize: entry.fontSize, lineHeight: entry.lineHeight }]),
) as Record<"sm" | "md" | "lg", { fontSize: number; lineHeight: number }>;

const clampTextSizePx = (value: number) => {
  const min = NOTE_TEXT_SIZE_OPTIONS[0] ?? 8;
  const max = NOTE_TEXT_SIZE_OPTIONS[NOTE_TEXT_SIZE_OPTIONS.length - 1] ?? 72;
  return Math.min(max, Math.max(min, value));
};

export const getNoteTextStyle = (size?: Note["textSize"], textSizePx?: number) => {
  if (typeof textSizePx === "number" && Number.isFinite(textSizePx)) {
    const fontSize = clampTextSizePx(textSizePx);
    const lineHeight = fontSize <= 12 ? 1.28 : fontSize <= 20 ? 1.35 : 1.4;
    return { fontSize, lineHeight };
  }
  return textStyleBySize[size ?? NOTE_DEFAULTS.textSize];
};

const noteFontFamilyByKey = Object.fromEntries(NOTE_TEXT_FONTS.map((entry) => [entry.value, entry.family])) as Record<
  NonNullable<Note["textFont"]>,
  string
>;

export const getNoteTextFontFamily = (font?: Note["textFont"]) => noteFontFamilyByKey[font ?? "nunito"];

export const truncateNoteText = (text: string, note: Note) => {
  const style = getNoteTextStyle(note.textSize, note.textSizePx);
  const charWidth = Math.max(6, style.fontSize * 0.54);
  const maxCharsPerLine = Math.max(10, Math.floor((note.w - 24) / charWidth));
  const maxLines = Math.max(2, Math.floor((note.h - 52) / (style.fontSize * style.lineHeight)));
  const maxChars = maxCharsPerLine * maxLines;
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}...`;
};

const hexToRgb = (hex?: string) => {
  const normalized = (hex ?? "#FEEA89").replace("#", "").trim();
  if (normalized.length !== 6) {
    return { r: 255, g: 255, b: 255 };
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return { r: 255, g: 255, b: 255 };
  }
  return { r, g, b };
};

const mixRgb = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, ratio: number) => {
  const r = Math.round(a.r * (1 - ratio) + b.r * ratio);
  const g = Math.round(a.g * (1 - ratio) + b.g * ratio);
  const b2 = Math.round(a.b * (1 - ratio) + b.b * ratio);
  return { r, g, b: b2 };
};

const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const rgbToCss = ({ r, g, b }: { r: number; g: number; b: number }, alpha = 1) =>
  alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;

export const noteTagChipPalette = (noteColor?: string) => {
  const base = hexToRgb(noteColor);
  const bg = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.62);
  const border = mixRgb(base, { r: 15, g: 23, b: 42 }, 0.22);
  const textIsDark = luminance(bg) > 0.46;
  const text = textIsDark ? { r: 35, g: 39, b: 47 } : { r: 246, g: 248, b: 252 };
  return {
    bg: rgbToCss(bg, 0.96),
    border: rgbToCss(border, 0.52),
    text: rgbToCss(text),
  };
};
