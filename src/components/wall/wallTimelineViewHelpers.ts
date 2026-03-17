"use client";

import type { Note } from "@/features/wall/types";

export type TimelineBucketMode = "day" | "week" | "month";
export type WallTimelineRangePreset = "7d" | "30d" | "90d" | "1y" | "all";

export type TimelineBucket = {
  key: string;
  label: string;
  count: number;
  startX: number;
  endX: number;
  x: number;
  timestamp: number;
};

export const laneTopOffset = 164;
export const scrubberInset = 18;

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

export const formatSpan = (minTs: number, maxTs: number) => {
  const days = Math.max(0, Math.round((maxTs - minTs) / 86_400_000));
  if (days === 0) {
    return "Single day";
  }
  if (days < 30) {
    return `${days} day span`;
  }
  if (days < 365) {
    return `${Math.max(1, Math.round(days / 30))} month span`;
  }
  return `${Math.max(1, Math.round(days / 365))} year span`;
};

export const getRangePresetStart = (maxTs: number, preset: WallTimelineRangePreset) => {
  if (preset === "all") {
    return Number.NEGATIVE_INFINITY;
  }
  const day = 86_400_000;
  if (preset === "7d") {
    return maxTs - 7 * day;
  }
  if (preset === "30d") {
    return maxTs - 30 * day;
  }
  if (preset === "90d") {
    return maxTs - 90 * day;
  }
  return maxTs - 365 * day;
};

export const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export const findClosestIndexByTimestamp = (timestamps: number[], target: number) => {
  if (timestamps.length === 0) {
    return -1;
  }
  let closestIndex = 0;
  let smallestDelta = Math.abs(timestamps[0]! - target);
  for (let index = 1; index < timestamps.length; index += 1) {
    const delta = Math.abs(timestamps[index]! - target);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closestIndex = index;
    }
  }
  return closestIndex;
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
