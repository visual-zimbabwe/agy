"use client";

import type { Note } from "@/features/wall/types";
import type { WallTimelineDensity } from "@/components/wall/wallTimelineViewLayout";

export type TimelineBucketMode = "day" | "week" | "month";

export type TimelineBucket = {
  key: string;
  label: string;
  count: number;
  x: number;
};

export const laneTopOffset = 146;
export const scrubberInset = 18;

export const cardHeightByDensity: Record<WallTimelineDensity, number> = {
  compact: 160,
  comfortable: 178,
  expanded: 204,
};

export const formatTimelineDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);

export const formatTimelineDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

export const formatBucketLabel = (timestamp: number, mode: TimelineBucketMode) => {
  if (mode === "month") {
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(timestamp);
  }
  if (mode === "week") {
    const start = new Date(timestamp);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    return `Week of ${formatTimelineDate(start.getTime())}`;
  }
  return formatTimelineDate(timestamp);
};

export const makeBucketKey = (timestamp: number, mode: TimelineBucketMode) => {
  const date = new Date(timestamp);
  if (mode === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (mode === "week") {
    const start = new Date(timestamp);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    return `${start.getFullYear()}-w-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const truncatePreviewText = (text: string, density: WallTimelineDensity) => {
  const limits: Record<WallTimelineDensity, number> = {
    compact: 96,
    comfortable: 140,
    expanded: 180,
  };
  const normalized = text.trim();
  const limit = limits[density];
  if (normalized.length <= limit) {
    return normalized || "(Empty note)";
  }
  return `${normalized.slice(0, Math.max(1, limit - 1)).trimEnd()}...`;
};

export const formatSpan = (minTs: number, maxTs: number) => {
  const days = Math.max(0, Math.round((maxTs - minTs) / 86_400_000));
  if (days === 0) {
    return "Single day";
  }
  if (days < 30) {
    return `${days} day span`;
  }
  const months = Math.max(1, Math.round(days / 30));
  return `${months} month span`;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;
  const parsed = Number.parseInt(expanded, 16);
  if (!Number.isFinite(parsed) || expanded.length !== 6) {
    return null;
  }
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const relativeChannel = (value: number) => {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 1;
  }
  return 0.2126 * relativeChannel(rgb.r) + 0.7152 * relativeChannel(rgb.g) + 0.0722 * relativeChannel(rgb.b);
};

export const readCardColors = (note: Note) => {
  const noteColor = typeof note.color === "string" && note.color.trim().length > 0 ? note.color : "#FFE27A";
  const noteLuminance = luminance(noteColor);
  const baseText = note.textColor?.trim() || (noteLuminance > 0.46 ? "#1F2937" : "#FFF8EB");
  const textLuminance = luminance(baseText);
  const contrastGap = Math.abs(noteLuminance - textLuminance);
  const readableText = contrastGap < 0.36 ? (noteLuminance > 0.46 ? "#1F2937" : "#FFF8EB") : baseText;
  const mutedText = noteLuminance > 0.46 ? "rgba(66,51,31,0.72)" : "rgba(255,248,235,0.78)";
  const softText = noteLuminance > 0.46 ? "rgba(66,51,31,0.62)" : "rgba(255,248,235,0.68)";
  const activeBackground = noteLuminance > 0.46 ? "rgba(77,57,31,0.14)" : "rgba(255,248,235,0.18)";
  const activeText = noteLuminance > 0.46 ? "rgba(77,57,31,0.82)" : "rgba(255,248,235,0.92)";
  return {
    readableText,
    mutedText,
    softText,
    activeBackground,
    activeText,
  };
};
