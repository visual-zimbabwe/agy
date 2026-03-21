"use client";

import { NOTE_DEFAULTS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS, NOTE_TEXT_SIZES } from "@/features/wall/constants";
import type { Link, LinkType, Note, PersistedWallState, Zone } from "@/features/wall/types";
import { appSlug, legacyAppSlug } from "@/lib/brand";
import { clamp } from "@/lib/wall-utils";

export type Bounds = { x: number; y: number; w: number; h: number };
type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };
type Rect = { x: number; y: number; w: number; h: number };

export const toWorldPoint = (screenX: number, screenY: number, camera: Camera) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

export const toScreenPoint = (worldX: number, worldY: number, camera: Camera) => ({
  x: worldX * camera.zoom + camera.x,
  y: worldY * camera.zoom + camera.y,
});

export const zoneContainsNote = (zone: Zone, note: Note) =>
  note.x < zone.x + zone.w &&
  note.x + note.w > zone.x &&
  note.y < zone.y + zone.h &&
  note.y + note.h > zone.y;

export const noteInAnyZone = (note: Note, zones: Zone[]) => zones.some((zone) => zoneContainsNote(zone, note));

export const linkColorByType: Record<LinkType, string> = {
  cause_effect: "#ef4444",
  dependency: "#2563eb",
  idea_execution: "#16a34a",
  wiki: "#64748b",
};

export const linkStrokeByType: Record<LinkType, number[]> = {
  cause_effect: [0, 0],
  dependency: [8, 6],
  idea_execution: [2, 4],
  wiki: [4, 6],
};

const noteCenter = (note: Note) => ({
  x: note.x + note.w / 2,
  y: note.y + note.h / 2,
});

export const linkPoints = (from: Note, to: Note) => {
  const fromCenter = noteCenter(from);
  const toCenter = noteCenter(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const fromInset = Math.min(from.w, from.h) * 0.36;
  const toInset = Math.min(to.w, to.h) * 0.38;

  return {
    points: [
      fromCenter.x + ux * fromInset,
      fromCenter.y + uy * fromInset,
      toCenter.x - ux * toInset,
      toCenter.y - uy * toInset,
    ],
    mid: {
      x: (fromCenter.x + toCenter.x) / 2,
      y: (fromCenter.y + toCenter.y) / 2,
    },
  };
};

export const graphPathLinks = (selectedNoteId: string | undefined, links: Link[]) => {
  if (!selectedNoteId) {
    return new Set<string>();
  }

  const outgoing = new Map<string, Link[]>();
  const incoming = new Map<string, Link[]>();
  for (const link of links) {
    const out = outgoing.get(link.fromNoteId) ?? [];
    out.push(link);
    outgoing.set(link.fromNoteId, out);

    const inLinks = incoming.get(link.toNoteId) ?? [];
    inLinks.push(link);
    incoming.set(link.toNoteId, inLinks);
  }

  const traversed = new Set<string>();
  const seenOut = new Set<string>([selectedNoteId]);
  const seenIn = new Set<string>([selectedNoteId]);
  const outQueue = [selectedNoteId];
  const inQueue = [selectedNoteId];

  while (outQueue.length > 0) {
    const node = outQueue.shift();
    if (!node) {
      continue;
    }
    for (const link of outgoing.get(node) ?? []) {
      traversed.add(link.id);
      if (!seenOut.has(link.toNoteId)) {
        seenOut.add(link.toNoteId);
        outQueue.push(link.toNoteId);
      }
    }
  }

  while (inQueue.length > 0) {
    const node = inQueue.shift();
    if (!node) {
      continue;
    }
    for (const link of incoming.get(node) ?? []) {
      traversed.add(link.id);
      if (!seenIn.has(link.fromNoteId)) {
        seenIn.add(link.fromNoteId);
        inQueue.push(link.fromNoteId);
      }
    }
  }

  return traversed;
};

export const fitBoundsCamera = (bounds: Bounds, viewport: Viewport, padding = 64) => {
  const width = Math.max(1, bounds.w + padding * 2);
  const height = Math.max(1, bounds.h + padding * 2);
  const zoom = clamp(Math.min(viewport.w / width, viewport.h / height), 0.2, 2.2);
  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;

  return {
    x: viewport.w / 2 - centerX * zoom,
    y: viewport.h / 2 - centerY * zoom,
    zoom,
  };
};

const clampRectToViewport = (rect: Rect, camera: Camera, viewport: Viewport) => {
  const viewportLeft = -camera.x / camera.zoom;
  const viewportTop = -camera.y / camera.zoom;
  const viewportRight = viewportLeft + viewport.w / camera.zoom;
  const viewportBottom = viewportTop + viewport.h / camera.zoom;

  const minX = viewportLeft;
  const minY = viewportTop;
  const maxX = Math.max(minX, viewportRight - rect.w);
  const maxY = Math.max(minY, viewportBottom - rect.h);

  return {
    ...rect,
    x: clamp(rect.x, minX, maxX),
    y: clamp(rect.y, minY, maxY),
  };
};

const rectsOverlap = (left: Rect, right: Rect, padding: number) =>
  left.x < right.x + right.w + padding &&
  left.x + left.w + padding > right.x &&
  left.y < right.y + right.h + padding &&
  left.y + left.h + padding > right.y;

type FindOpenNotePositionOptions = {
  camera: Camera;
  viewport: Viewport;
  occupiedRects: Rect[];
  preferred: { x: number; y: number };
  size: { w: number; h: number };
  padding?: number;
};

export const findOpenNotePosition = ({
  camera,
  viewport,
  occupiedRects,
  preferred,
  size,
  padding = 20,
}: FindOpenNotePositionOptions) => {
  const baseRect = clampRectToViewport(
    {
      x: preferred.x,
      y: preferred.y,
      w: size.w,
      h: size.h,
    },
    camera,
    viewport,
  );
  const collides = (candidate: Rect) => occupiedRects.some((rect) => rectsOverlap(candidate, rect, padding));
  if (!collides(baseRect)) {
    return { x: baseRect.x, y: baseRect.y };
  }

  const stepX = Math.max(24, Math.round(size.w / 5));
  const stepY = Math.max(24, Math.round(size.h / 5));
  const viewportLeft = -camera.x / camera.zoom;
  const viewportTop = -camera.y / camera.zoom;
  const viewportRight = viewportLeft + viewport.w / camera.zoom;
  const viewportBottom = viewportTop + viewport.h / camera.zoom;
  const columns = Math.max(1, Math.ceil(Math.max(0, viewportRight - viewportLeft - size.w) / stepX));
  const rows = Math.max(1, Math.ceil(Math.max(0, viewportBottom - viewportTop - size.h) / stepY));
  const maxOffsetX = columns + 1;
  const maxOffsetY = rows + 1;
  const candidates = new Map<string, Rect>();

  for (let offsetX = -maxOffsetX; offsetX <= maxOffsetX; offsetX += 1) {
    for (let offsetY = -maxOffsetY; offsetY <= maxOffsetY; offsetY += 1) {
      const candidate = clampRectToViewport(
        {
          x: baseRect.x + offsetX * stepX,
          y: baseRect.y + offsetY * stepY,
          w: size.w,
          h: size.h,
        },
        camera,
        viewport,
      );
      candidates.set(`${candidate.x}:${candidate.y}`, candidate);
    }
  }

  const ordered = [...candidates.values()].sort((left, right) => {
    const leftDistance = Math.hypot(left.x - baseRect.x, left.y - baseRect.y);
    const rightDistance = Math.hypot(right.x - baseRect.x, right.y - baseRect.y);
    return leftDistance - rightDistance;
  });

  const available = ordered.find((candidate) => !collides(candidate));
  if (available) {
    return { x: available.x, y: available.y };
  }

  return { x: baseRect.x, y: baseRect.y };
};

export const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

export const downloadDataUrl = (filename: string, dataUrl: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadJsonFile = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

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
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(timestamp);

export const makeDownloadId = () => new Date().toISOString().replace(/[:.]/g, "-");
export const recallStorageKey = `${appSlug}-recall-searches`;
export const legacyRecallStorageKeys = [`${legacyAppSlug}-recall-searches`];
export const layoutPrefsStorageKey = `${appSlug}-layout-prefs`;
export const legacyLayoutPrefsStorageKeys = [`${legacyAppSlug}-layout-prefs`];
export const controlsModeStorageKey = `${appSlug}-controls-mode`;
export const legacyControlsModeStorageKeys = [`${legacyAppSlug}-controls-mode`];
export const spatialPrefsStorageKey = `${appSlug}-spatial-prefs`;
export const legacySpatialPrefsStorageKeys = [`${legacyAppSlug}-spatial-prefs`];
export const presentationPathsStorageKey = `${appSlug}-presentation-paths`;
export const legacyPresentationPathsStorageKeys = [`${legacyAppSlug}-presentation-paths`];
export const backupReminderCadenceStorageKey = `${appSlug}-backup-reminder-cadence`;
export const legacyBackupReminderCadenceStorageKeys = [`${legacyAppSlug}-backup-reminder-cadence`];
export const backupReminderLastPromptStorageKey = `${appSlug}-backup-reminder-last-prompt`;
export const legacyBackupReminderLastPromptStorageKeys = [`${legacyAppSlug}-backup-reminder-last-prompt`];
export const dragSnapThreshold = 10;

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




