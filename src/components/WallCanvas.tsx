"use client";

import { type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer } from "react-konva";
import type Konva from "konva";
import Fuse from "fuse.js";

import { ExportModal } from "@/components/ExportModal";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteSwatches } from "@/components/NoteCard";
import { QuickCaptureBar } from "@/components/QuickCaptureBar";
import { SearchPalette } from "@/components/SearchPalette";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { WallDetailsPanel } from "@/components/wall/WallDetailsPanel";
import { WallDetailsContent } from "@/components/wall/WallDetailsContent";
import type { DetailsSectionKey, DetailsSectionState, RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { useWallActions } from "@/components/wall/useWallActions";
import { WallLinksZonesLayer } from "@/components/wall/WallLinksZonesLayer";
import { WallNotesLayer } from "@/components/wall/WallNotesLayer";
import { WallOverlaysLayer } from "@/components/wall/WallOverlaysLayer";
import { WallPresentationDock } from "@/components/wall/WallPresentationDock";
import { useWallCameraNavigation } from "@/components/wall/useWallCameraNavigation";
import { useWallExport } from "@/components/wall/useWallExport";
import { useWallSelection } from "@/components/wall/useWallSelection";
import { WallStage } from "@/components/wall/WallStage";
import { WallTimelineDock } from "@/components/wall/WallTimelineDock";
import { useWallTimeline } from "@/components/wall/useWallTimeline";
import { WallToolbar } from "@/components/wall/WallToolbar";
import { WallToolsPanel } from "@/components/wall/WallToolsPanel";
import { useWallKeyboard } from "@/components/wall/useWallKeyboard";
import {
  applyTemplate,
  assignZoneToGroup,
  createNote,
  createLink,
  createZone,
  createZoneGroup,
  deleteGroup,
  deleteLink,
  deleteNote,
  deleteZone,
  duplicateNote,
  duplicateNoteAt,
  moveNote,
  moveZone,
  toggleGroupCollapse,
  updateNote,
  updateLinkType,
  updateZone,
} from "@/features/wall/commands";
import { LINK_TYPES, NOTE_DEFAULTS, NOTE_TEXT_SIZES, TEMPLATE_TYPES, ZONE_DEFAULTS } from "@/features/wall/constants";
import { hasContent, mergeSnapshotsLww } from "@/features/wall/cloud";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { createSnapshotSaver, createTimelineRecorder, loadTimelineEntries, loadWallSnapshot, type TimelineEntry } from "@/features/wall/storage";
import type { Link, LinkType, Note, PersistedWallState, Zone } from "@/features/wall/types";
import { buildPublishedSnapshotUrl, decodeSnapshotFromUrl, readSnapshotParamFromLocation } from "@/lib/publish";
import { parseTaggedText } from "@/lib/tag-utils";
import { clamp, computeContentBounds, detectClusters, notesToMarkdown } from "@/lib/wall-utils";

type EditingState = {
  id: string;
  text: string;
};

type LinkContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  linkId?: string;
};

type Bounds = { x: number; y: number; w: number; h: number };
type TagGroup = { tag: string; noteIds: string[]; bounds: Bounds };
type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };
type LayoutPreferenceKey = "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags";
type LayoutPreferences = Record<LayoutPreferenceKey, boolean>;
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};
type TagLabelLayout = Record<string, { x: number; y: number }>;

const flashDurationMs = 1200;

const toWorldPoint = (screenX: number, screenY: number, camera: { x: number; y: number; zoom: number }) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

const toScreenPoint = (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => ({
  x: worldX * camera.zoom + camera.x,
  y: worldY * camera.zoom + camera.y,
});

const zoneContainsNote = (zone: Zone, note: Note) =>
  note.x < zone.x + zone.w &&
  note.x + note.w > zone.x &&
  note.y < zone.y + zone.h &&
  note.y + note.h > zone.y;

const noteInAnyZone = (note: Note, zones: Zone[]) => zones.some((zone) => zoneContainsNote(zone, note));

const linkColorByType: Record<LinkType, string> = {
  cause_effect: "#ef4444",
  dependency: "#2563eb",
  idea_execution: "#16a34a",
};

const linkStrokeByType: Record<LinkType, number[]> = {
  cause_effect: [0, 0],
  dependency: [8, 6],
  idea_execution: [2, 4],
};

const noteCenter = (note: Note) => ({
  x: note.x + note.w / 2,
  y: note.y + note.h / 2,
});

const linkPoints = (from: Note, to: Note) => {
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

const graphPathLinks = (selectedNoteId: string | undefined, links: Link[]) => {
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

const fitBoundsCamera = (bounds: Bounds, viewport: { w: number; h: number }, padding = 64) => {
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

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const downloadDataUrl = (filename: string, dataUrl: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadJsonFile = (filename: string, data: unknown) => {
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

const isPersistedWallStateLike = (value: unknown): value is PersistedWallState => {
  if (!isObjectRecord(value)) {
    return false;
  }
  const notes = value.notes;
  const zones = value.zones;
  const zoneGroups = value.zoneGroups;
  const links = value.links;
  const camera = value.camera;
  return (
    isObjectRecord(notes) &&
    isObjectRecord(zones) &&
    isObjectRecord(zoneGroups) &&
    isObjectRecord(links) &&
    isObjectRecord(camera) &&
    typeof camera.x === "number" &&
    typeof camera.y === "number" &&
    typeof camera.zoom === "number"
  );
};

const tagGroupColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 360;
  }
  return `hsl(${hash} 80% 45%)`;
};

const recencyIntensity = (updatedAt: number, referenceTs: number, windowMs = 1000 * 60 * 60 * 24 * 7) => {
  const age = Math.max(0, referenceTs - updatedAt);
  return clamp(1 - age / windowMs, 0, 1);
};

const makeDownloadId = () => new Date().toISOString().replace(/[:.]/g, "-");
const recallStorageKey = "idea-wall-recall-searches";
const layoutPrefsStorageKey = "idea-wall-layout-prefs";
const backupReminderCadenceStorageKey = "idea-wall-backup-reminder-cadence";
const backupReminderLastPromptStorageKey = "idea-wall-backup-reminder-last-prompt";
const compactPanelBreakpoint = 1120;
const dragSnapThreshold = 10;
const textStyleBySize = Object.fromEntries(
  NOTE_TEXT_SIZES.map((entry) => [entry.value, { fontSize: entry.fontSize, lineHeight: entry.lineHeight }]),
) as Record<"sm" | "md" | "lg", { fontSize: number; lineHeight: number }>;

const getNoteTextStyle = (size?: Note["textSize"]) => textStyleBySize[size ?? NOTE_DEFAULTS.textSize];

const truncateNoteText = (text: string, note: Note) => {
  const style = getNoteTextStyle(note.textSize);
  const charWidth = Math.max(6, style.fontSize * 0.54);
  const maxCharsPerLine = Math.max(10, Math.floor((note.w - 24) / charWidth));
  const maxLines = Math.max(2, Math.floor((note.h - 52) / (style.fontSize * style.lineHeight)));
  const maxChars = maxCharsPerLine * maxLines;
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
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

const noteTagChipPalette = (noteColor: string) => {
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

export const WallCanvas = () => {
  const notesMap = useWallStore((state) => state.notes);
  const zonesMap = useWallStore((state) => state.zones);
  const zoneGroupsMap = useWallStore((state) => state.zoneGroups);
  const linksMap = useWallStore((state) => state.links);
  const camera = useWallStore((state) => state.camera);
  const ui = useWallStore((state) => state.ui);
  const hydrated = useWallStore((state) => state.hydrated);

  const hydrate = useWallStore((state) => state.hydrate);
  const setCamera = useWallStore((state) => state.setCamera);
  const selectNote = useWallStore((state) => state.selectNote);
  const selectZone = useWallStore((state) => state.selectZone);
  const selectGroup = useWallStore((state) => state.selectGroup);
  const selectLink = useWallStore((state) => state.selectLink);
  const resetSelection = useWallStore((state) => state.resetSelection);
  const setLinkingFromNote = useWallStore((state) => state.setLinkingFromNote);
  const setLinkType = useWallStore((state) => state.setLinkType);
  const setTemplateType = useWallStore((state) => state.setTemplateType);
  const setSearchOpen = useWallStore((state) => state.setSearchOpen);
  const setExportOpen = useWallStore((state) => state.setExportOpen);
  const setShortcutsOpen = useWallStore((state) => state.setShortcutsOpen);
  const setLastColor = useWallStore((state) => state.setLastColor);
  const setFlashNote = useWallStore((state) => state.setFlashNote);
  const setShowClusters = useWallStore((state) => state.setShowClusters);
  const undo = useWallStore((state) => state.undo);
  const redo = useWallStore((state) => state.redo);
  const beginHistoryGroup = useWallStore((state) => state.beginHistoryGroup);
  const endHistoryGroup = useWallStore((state) => state.endHistoryGroup);
  const clearHistory = useWallStore((state) => state.clearHistory);
  const historyUndoDepth = useWallStore((state) => state.historyPast.length);
  const historyRedoDepth = useWallStore((state) => state.historyFuture.length);
  const canUndo = historyUndoDepth > 0;
  const canRedo = historyRedoDepth > 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const noteTransformerRef = useRef<Konva.Transformer | null>(null);
  const zoneTransformerRef = useRef<Konva.Transformer | null>(null);
  const noteNodeRefs = useRef<Record<string, Konva.Group | null>>({});
  const zoneNodeRefs = useRef<Record<string, Konva.Group | null>>({});

  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isMiddleDragging, setIsMiddleDragging] = useState(false);
  const [isLeftCanvasDragging, setIsLeftCanvasDragging] = useState(false);
  const [linkMenu, setLinkMenu] = useState<LinkContextMenuState>({ open: false, x: 0, y: 0 });
  const [tagInput, setTagInput] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [editTagRenameFrom, setEditTagRenameFrom] = useState<string | null>(null);
  const [groupLabelInput, setGroupLabelInput] = useState("New Group");
  const [showAutoTagGroups, setShowAutoTagGroups] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [timelineMode, setTimelineMode] = useState(false);
  const timelineModeRef = useRef(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [wallClockTs, setWallClockTs] = useState(() => Date.now());
  const [cloudWallId, setCloudWallId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudSyncInFlightRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const lastCloudSyncedAtRef = useRef<number>(0);
  const [recallQuery, setRecallQuery] = useState("");
  const [recallZoneId, setRecallZoneId] = useState("");
  const [recallTag, setRecallTag] = useState("");
  const [recallDateFilter, setRecallDateFilter] = useState<RecallDateFilter>("all");
  const [savedRecallSearches, setSavedRecallSearches] = useState<SavedRecallSearch[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(recallStorageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as SavedRecallSearch[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [layoutPrefs, setLayoutPrefs] = useState<LayoutPreferences>(() => {
    if (typeof window === "undefined") {
      return { showToolsPanel: true, showDetailsPanel: true, showContextBar: true, showNoteTags: false };
    }
    try {
      const raw = window.localStorage.getItem(layoutPrefsStorageKey);
      if (!raw) {
        return { showToolsPanel: true, showDetailsPanel: true, showContextBar: true, showNoteTags: false };
      }
      const parsed = JSON.parse(raw) as Partial<LayoutPreferences>;
      return {
        showToolsPanel: parsed.showToolsPanel ?? true,
        showDetailsPanel: parsed.showDetailsPanel ?? true,
        showContextBar: parsed.showContextBar ?? true,
        showNoteTags: parsed.showNoteTags ?? false,
      };
    } catch {
      return { showToolsPanel: true, showDetailsPanel: true, showContextBar: true, showNoteTags: false };
    }
  });
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [backupReminderCadence, setBackupReminderCadence] = useState<"off" | "daily" | "weekly">(() => {
    if (typeof window === "undefined") {
      return "off";
    }
    const raw = window.localStorage.getItem(backupReminderCadenceStorageKey);
    return raw === "daily" || raw === "weekly" ? raw : "off";
  });
  const [detailsSectionsOpen, setDetailsSectionsOpen] = useState<DetailsSectionState>({
    history: false,
    recall: true,
    zoneGroups: false,
    tagGroups: false,
  });
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [leftPanelOpen, setLeftPanelOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= compactPanelBreakpoint));
  const [rightPanelOpen, setRightPanelOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= compactPanelBreakpoint));
  const [publishedSnapshot] = useState<PersistedWallState | null>(() => {
    const encoded = readSnapshotParamFromLocation();
    if (!encoded) {
      return null;
    }
    return decodeSnapshotFromUrl(encoded);
  });
  const publishedReadOnly = Boolean(publishedSnapshot);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [boxSelectMode, setBoxSelectMode] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | undefined>(undefined);
  const [draggingNoteId, setDraggingNoteId] = useState<string | undefined>(undefined);
  const [resizingNoteDrafts, setResizingNoteDrafts] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const [guideLines, setGuideLines] = useState<GuideLineState>({});
  const dragSelectionStartRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const dragAnchorRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const dragSingleStartRef = useRef<{ id: string; x: number; y: number; altClone: boolean } | null>(null);
  const lastTimelineRecordedAt = useRef(0);
  const lastTimelineSerialized = useRef("");
  const activeTimelineEntry = timelineMode
    ? timelineEntries[Math.min(timelineIndex, Math.max(0, timelineEntries.length - 1))]
    : undefined;
  const activeTimelineSnapshot = activeTimelineEntry?.snapshot;
  const renderSnapshot: PersistedWallState = publishedSnapshot ?? activeTimelineSnapshot ?? {
    notes: notesMap,
    zones: zonesMap,
    zoneGroups: zoneGroupsMap,
    links: linksMap,
    camera,
    lastColor: ui.lastColor,
  };
  const notes = useMemo(() => Object.values(renderSnapshot.notes), [renderSnapshot.notes]);
  const zones = useMemo(() => Object.values(renderSnapshot.zones), [renderSnapshot.zones]);
  const zoneGroups = useMemo(() => Object.values(renderSnapshot.zoneGroups), [renderSnapshot.zoneGroups]);
  const links = useMemo(() => Object.values(renderSnapshot.links), [renderSnapshot.links]);
  const isTimeLocked = timelineMode || publishedReadOnly || presentationMode;
  const isCompactLayout = viewport.w < compactPanelBreakpoint;
  timelineModeRef.current = timelineMode;

  const commitEditedNoteText = useCallback((noteId: string, rawText: string) => {
    const current = renderSnapshot.notes[noteId];
    if (!current) {
      return;
    }
    const parsed = parseTaggedText(rawText);
    const mergedTags = [...new Set([...current.tags, ...parsed.tags])];
    updateNote(noteId, { text: parsed.text, tags: mergedTags });
  }, [renderSnapshot.notes]);

  const openEditor = useCallback((noteId: string, text: string) => {
    setEditTagInput("");
    setEditTagRenameFrom(null);
    setEditing({ id: noteId, text });
  }, []);

  const normalizeTag = (raw: string) => raw.trim().replace(/^#/, "").toLowerCase();

  const runHistoryGroup = useCallback(
    (run: () => void) => {
      beginHistoryGroup();
      try {
        run();
      } finally {
        endHistoryGroup();
      }
    },
    [beginHistoryGroup, endHistoryGroup],
  );

  const addTagToNote = (noteId: string, rawTag: string) => {
    const note = renderSnapshot.notes[noteId];
    if (!note || isTimeLocked) {
      return;
    }
    const tag = normalizeTag(rawTag);
    if (!tag || note.tags.includes(tag)) {
      return;
    }
    updateNote(noteId, { tags: [...note.tags, tag] });
  };

  const removeTagFromNote = (noteId: string, tag: string) => {
    const note = renderSnapshot.notes[noteId];
    if (!note || isTimeLocked) {
      return;
    }
    updateNote(noteId, { tags: note.tags.filter((value) => value !== tag) });
  };

  const renameTagOnNote = (noteId: string, from: string, rawTo: string) => {
    const note = renderSnapshot.notes[noteId];
    if (!note || isTimeLocked) {
      return;
    }
    const to = normalizeTag(rawTo);
    if (!to) {
      return;
    }
    const next = note.tags.map((tag) => (tag === from ? to : tag));
    updateNote(noteId, { tags: [...new Set(next)] });
  };

  const handleEditorBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (nextTarget?.dataset?.noteEditTags === "true") {
      return;
    }
    if (!editing) {
      return;
    }
    commitEditedNoteText(editing.id, editing.text);
    setEditing(null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setWallClockTs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(recallStorageKey, JSON.stringify(savedRecallSearches));
  }, [savedRecallSearches]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(layoutPrefsStorageKey, JSON.stringify(layoutPrefs));
  }, [layoutPrefs]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(backupReminderCadenceStorageKey, backupReminderCadence);
  }, [backupReminderCadence]);

  const syncSnapshotToCloud = useCallback(
    async (wallId: string, snapshot: PersistedWallState) => {
      if (publishedReadOnly) {
        return;
      }

      if (cloudSyncInFlightRef.current) {
        return;
      }

      cloudSyncInFlightRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const response = await fetch(`/api/walls/${wallId}/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...snapshot,
            clientSyncedAt: lastCloudSyncedAtRef.current || undefined,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Cloud sync failed");
        }

        const payload = (await response.json()) as { serverTime?: number };
        const syncedAt = payload.serverTime ?? Date.now();
        lastCloudSyncedAtRef.current = syncedAt;
        setLastSyncedAt(syncedAt);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Cloud sync failed";
        setSyncError(message);
      } finally {
        cloudSyncInFlightRef.current = false;
        setIsSyncing(false);
      }
    },
    [publishedReadOnly],
  );

  const scheduleCloudSync = useCallback(
    (snapshot: PersistedWallState) => {
      if (!cloudWallId || !cloudReadyRef.current || publishedReadOnly) {
        return;
      }

      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }

      cloudSyncTimerRef.current = setTimeout(() => {
        void syncSnapshotToCloud(cloudWallId, snapshot);
      }, 1400);
    },
    [cloudWallId, publishedReadOnly, syncSnapshotToCloud],
  );

  const syncNow = useCallback(() => {
    if (!cloudWallId) {
      return;
    }
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    void syncSnapshotToCloud(cloudWallId, snapshot);
  }, [cloudWallId, syncSnapshotToCloud]);

  useEffect(() => {
    const saver = createSnapshotSaver(320);
    const timelineRecorder = createTimelineRecorder({ delayMs: 1100, minIntervalMs: 1400, maxEntries: 500 });
    let cancelled = false;

    const load = async () => {
      const [snapshot, loadedTimeline] = await Promise.all([loadWallSnapshot(), loadTimelineEntries(500)]);
      if (!cancelled) {
        hydrate(snapshot);
        setTimelineEntries(loadedTimeline);
        if (loadedTimeline.length > 0) {
          setTimelineIndex(loadedTimeline.length - 1);
        }
      }

      if (publishedReadOnly || cancelled) {
        return;
      }

      try {
        const listResponse = await fetch("/api/walls", { cache: "no-store" });
        if (!listResponse.ok) {
          const payload = (await listResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to load walls");
        }

        const listPayload = (await listResponse.json()) as { walls: Array<{ id: string }> };
        let wallId = listPayload.walls[0]?.id;

        if (!wallId) {
          const createResponse = await fetch("/api/walls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "My Wall" }),
          });
          if (!createResponse.ok) {
            const payload = (await createResponse.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error ?? "Unable to create wall");
          }
          const createdPayload = (await createResponse.json()) as { wall: { id: string } };
          wallId = createdPayload.wall.id;
        }

        if (!wallId) {
          throw new Error("No wall available");
        }

        setCloudWallId(wallId);

        const snapshotResponse = await fetch(`/api/walls/${wallId}`, { cache: "no-store" });
        if (!snapshotResponse.ok) {
          const payload = (await snapshotResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to load cloud snapshot");
        }

        const snapshotPayload = (await snapshotResponse.json()) as { snapshot: PersistedWallState };
        const serverSnapshot = snapshotPayload.snapshot;
        const migrationKey = `idea-wall-cloud-imported-v1:${wallId}`;
        const canPromptImport = typeof window !== "undefined" && !window.localStorage.getItem(migrationKey);
        let nextSnapshot = mergeSnapshotsLww(serverSnapshot, snapshot);

        if (hasContent(snapshot) && !hasContent(serverSnapshot) && canPromptImport && typeof window !== "undefined") {
          const importLocal = window.confirm(
            "Import your existing local wall data to your cloud account now?",
          );
          if (importLocal) {
            nextSnapshot = snapshot;
            await syncSnapshotToCloud(wallId, snapshot);
          }
          window.localStorage.setItem(migrationKey, "1");
        } else if (JSON.stringify(nextSnapshot) !== JSON.stringify(serverSnapshot)) {
          await syncSnapshotToCloud(wallId, nextSnapshot);
        }

        if (!cancelled) {
          hydrate(nextSnapshot);
          cloudReadyRef.current = true;
          setSyncError(null);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Cloud sync unavailable";
          setSyncError(message);
          cloudReadyRef.current = false;
        }
      }
    };

    void load();

    const unsubscribe = useWallStore.subscribe((state) => {
      if (!state.hydrated) {
        return;
      }
      const snapshot = selectPersistedSnapshot(state);
      saver.schedule(snapshot);
      timelineRecorder.schedule(snapshot);
      scheduleCloudSync(snapshot);

      const serialized = JSON.stringify(snapshot);
      const now = Date.now();
      if (serialized !== lastTimelineSerialized.current && now - lastTimelineRecordedAt.current > 1400) {
        lastTimelineSerialized.current = serialized;
        lastTimelineRecordedAt.current = now;
        setTimelineEntries((previous) => {
          const next = [...previous, { ts: now, snapshot }];
          if (next.length > 500) {
            next.splice(0, next.length - 500);
          }
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      cloudReadyRef.current = false;
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
      void saver.flush();
      void timelineRecorder.flush();
    };
  }, [hydrate, publishedReadOnly, scheduleCloudSync, syncSnapshotToCloud]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setViewport({
        w: Math.max(600, Math.round(entry.contentRect.width)),
        h: Math.max(420, Math.round(entry.contentRect.height)),
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ui.selectedNoteId || !noteTransformerRef.current) {
      noteTransformerRef.current?.nodes([]);
      return;
    }

    const node = noteNodeRefs.current[ui.selectedNoteId];
    if (node) {
      noteTransformerRef.current.nodes([node]);
      noteTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [renderSnapshot.notes, ui.selectedNoteId]);

  useEffect(() => {
    if (!ui.selectedZoneId || !zoneTransformerRef.current) {
      zoneTransformerRef.current?.nodes([]);
      return;
    }

    const node = zoneNodeRefs.current[ui.selectedZoneId];
    if (node) {
      zoneTransformerRef.current.nodes([node]);
      zoneTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [renderSnapshot.zones, ui.selectedZoneId]);

  useEffect(() => {
    if (!editing?.id) {
      return;
    }

    const timer = setTimeout(() => {
      commitEditedNoteText(editing.id, editing.text);
    }, 280);

    return () => clearTimeout(timer);
  }, [commitEditedNoteText, editing]);

  useWallKeyboard({
    camera,
    viewport,
    notes,
    notesMap,
    renderNotesById: renderSnapshot.notes,
    ui: {
      isShortcutsOpen: ui.isShortcutsOpen,
      selectedNoteId: ui.selectedNoteId,
      selectedZoneId: ui.selectedZoneId,
      selectedLinkId: ui.selectedLinkId,
      selectedGroupId: ui.selectedGroupId,
      lastColor: ui.lastColor,
    },
    selectedNoteIds,
    editing,
    isTimeLocked,
    presentationMode,
    timelineEntriesLength: timelineEntries.length,
    timelineModeRef,
    setIsSpaceDown,
    setShortcutsOpen,
    setSearchOpen,
    setExportOpen,
    setQuickCaptureOpen,
    setEditing,
    clearGuideLines: () => setGuideLines({}),
    resetSelection,
    setSelectedNoteIds,
    selectNote,
    setTimelineMode,
    setTimelineIndex,
    setIsTimelinePlaying,
    setShowHeatmap,
    setPresentationMode,
    setPresentationIndex,
    createNote,
    openEditor,
    redo,
    undo,
    setLinkingFromNote,
    duplicateNote,
    deleteNote,
    deleteZone,
    deleteLink,
    deleteGroup,
  });

  const { jumpToTimelineDay } = useWallTimeline({
    timelineMode,
    isTimelinePlaying,
    timelineEntries,
    setTimelineMode,
    setIsTimelinePlaying,
    setTimelineIndex,
  });

  useEffect(() => {
    if (!ui.flashNoteId) {
      return;
    }

    const timer = setTimeout(() => setFlashNote(undefined), flashDurationMs);
    return () => clearTimeout(timer);
  }, [setFlashNote, ui.flashNoteId]);

  useEffect(() => {
    if (!linkMenu.open) {
      return;
    }

    const close = () => setLinkMenu((previous) => ({ ...previous, open: false }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [linkMenu.open]);

  const collapsedGroupIds = useMemo(
    () => new Set(zoneGroups.filter((group) => group.collapsed).map((group) => group.id)),
    [zoneGroups],
  );
  const visibleZones = useMemo(
    () => zones.filter((zone) => !zone.groupId || !collapsedGroupIds.has(zone.groupId)),
    [collapsedGroupIds, zones],
  );
  const hiddenNotes = useMemo(() => {
    const collapsedZones = zones.filter((zone) => zone.groupId && collapsedGroupIds.has(zone.groupId));
    return new Set(notes.filter((note) => noteInAnyZone(note, collapsedZones)).map((note) => note.id));
  }, [collapsedGroupIds, notes, zones]);
  const baseVisibleNotes = useMemo(() => notes.filter((note) => !hiddenNotes.has(note.id)), [hiddenNotes, notes]);
  const recallFuse = useMemo(
    () =>
      new Fuse(baseVisibleNotes, {
        keys: ["text", "tags"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [baseVisibleNotes],
  );
  const recallQueryIds = useMemo(() => {
    const query = recallQuery.trim();
    if (!query) {
      return new Set(baseVisibleNotes.map((note) => note.id));
    }
    return new Set(recallFuse.search(query, { limit: 500 }).map((r) => r.item.id));
  }, [baseVisibleNotes, recallFuse, recallQuery]);
  const visibleNotes = useMemo(() => {
    const now = wallClockTs;
    const selectedZone = recallZoneId ? renderSnapshot.zones[recallZoneId] : undefined;
    return baseVisibleNotes.filter((note) => {
      if (!recallQueryIds.has(note.id)) {
        return false;
      }
      if (selectedZone && !zoneContainsNote(selectedZone, note)) {
        return false;
      }
      if (recallTag && !note.tags.includes(recallTag)) {
        return false;
      }
      if (recallDateFilter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        if (note.updatedAt < start.getTime()) {
          return false;
        }
      }
      if (recallDateFilter === "7d" && now - note.updatedAt > 1000 * 60 * 60 * 24 * 7) {
        return false;
      }
      if (recallDateFilter === "30d" && now - note.updatedAt > 1000 * 60 * 60 * 24 * 30) {
        return false;
      }
      return true;
    });
  }, [baseVisibleNotes, recallDateFilter, recallQueryIds, recallTag, recallZoneId, renderSnapshot.zones, wallClockTs]);
  const visibleNoteIdSet = useMemo(() => new Set(visibleNotes.map((note) => note.id)), [visibleNotes]);
  const visibleLinks = useMemo(
    () => links.filter((link) => visibleNoteIdSet.has(link.fromNoteId) && visibleNoteIdSet.has(link.toNoteId)),
    [links, visibleNoteIdSet],
  );
  const availableRecallTags = useMemo(
    () => [...new Set(baseVisibleNotes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b)),
    [baseVisibleNotes],
  );
  const presentationNotes = useMemo(
    () => [...visibleNotes].sort((a, b) => a.updatedAt - b.updatedAt),
    [visibleNotes],
  );
  const presentationTarget = useMemo(() => {
    if (!presentationMode || presentationNotes.length === 0) {
      return undefined;
    }
    const clamped = clamp(presentationIndex, 0, presentationNotes.length - 1);
    return presentationNotes[clamped];
  }, [presentationIndex, presentationMode, presentationNotes]);

  useEffect(() => {
    if (!presentationTarget) {
      return;
    }
    const zoom = 1.25;
    setCamera({
      zoom,
      x: viewport.w / 2 - (presentationTarget.x + presentationTarget.w / 2) * zoom,
      y: viewport.h / 2 - (presentationTarget.y + presentationTarget.h / 2) * zoom,
    });
  }, [presentationTarget, setCamera, viewport.h, viewport.w]);

  const autoTagGroups = useMemo<TagGroup[]>(() => {
    const byTag = new Map<string, Note[]>();
    for (const note of visibleNotes) {
      const seen = new Set<string>();
      for (const rawTag of note.tags) {
        const tag = rawTag.trim().toLowerCase();
        if (!tag || seen.has(tag)) {
          continue;
        }
        seen.add(tag);
        const normalized = tag.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        const list = byTag.get(normalized) ?? [];
        list.push(note);
        byTag.set(normalized, list);
      }
    }

    return [...byTag.entries()]
      .filter(([, taggedNotes]) => taggedNotes.length > 1)
      .map(([tag, taggedNotes]) => {
        const bounds = computeContentBounds(taggedNotes, []);
        if (!bounds) {
          return null;
        }
        return {
          tag,
          noteIds: taggedNotes.map((note) => note.id),
          bounds: {
            x: bounds.x - 26,
            y: bounds.y - 26,
            w: bounds.w + 52,
            h: bounds.h + 52,
          },
        };
      })
      .filter((group): group is TagGroup => Boolean(group))
      .sort((a, b) => b.noteIds.length - a.noteIds.length || a.tag.localeCompare(b.tag));
  }, [visibleNotes]);
  const autoTagLabelLayout = useMemo<TagLabelLayout>(() => {
    const placements: TagLabelLayout = {};
    const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];

    const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    for (const group of autoTagGroups) {
      const text = `#${group.tag} (${group.noteIds.length})`;
      const width = Math.max(96, Math.min(240, 18 + text.length * 6));
      const height = 18;
      let x = group.bounds.x + 10;
      const y = group.bounds.y + 8;

      let attempts = 0;
      while (attempts < 18) {
        const box = { x, y, w: width, h: height };
        const hasCollision = occupied.some((entry) => intersects(box, entry));
        if (!hasCollision) {
          occupied.push(box);
          break;
        }
        x += width + 8;
        attempts += 1;
      }

      placements[group.tag] = { x, y };
    }

    return placements;
  }, [autoTagGroups]);
  const clusterBounds = useMemo(() => detectClusters(visibleNotes), [visibleNotes]);
  const pathLinkIds = useMemo(() => graphPathLinks(ui.selectedNoteId, visibleLinks), [ui.selectedNoteId, visibleLinks]);
  const maxViewportWidth = typeof window !== "undefined" ? window.innerWidth : viewport.w;
  const maxViewportHeight = typeof window !== "undefined" ? window.innerHeight : viewport.h;
  const {
    activeSelectedNoteIds,
    activeSelectedNoteIdSet,
    selectedNotes,
    syncPrimarySelection,
    toggleSelectNote,
    clearNoteSelection,
    finalizeBoxSelection,
  } = useWallSelection({
    notesById: renderSnapshot.notes,
    visibleNotes,
    selectedNoteIds,
    setSelectedNoteIds,
    selectNote,
    selectionBox,
    setSelectionBox,
  });
  const resolveSnappedPosition = (note: Note, candidateX: number, candidateY: number) => {
    const snapThreshold = dragSnapThreshold / Math.max(0.35, camera.zoom);
    const noteLeft = candidateX;
    const noteRight = candidateX + note.w;
    const noteCenterX = candidateX + note.w / 2;
    const noteTop = candidateY;
    const noteBottom = candidateY + note.h;
    const noteCenterY = candidateY + note.h / 2;
    const boundsY1 = Math.min(noteTop, noteBottom) - 240;
    const boundsY2 = Math.max(noteTop, noteBottom) + 240;
    const boundsX1 = Math.min(noteLeft, noteRight) - 280;
    const boundsX2 = Math.max(noteLeft, noteRight) + 280;

    let bestX: { value: number; dist: number; measure?: number; target?: number } | undefined;
    let bestY: { value: number; dist: number; measure?: number; target?: number } | undefined;

    for (const peer of visibleNotes) {
      if (peer.id === note.id) {
        continue;
      }
      if (activeSelectedNoteIdSet.has(peer.id)) {
        continue;
      }

      const peerLeft = peer.x;
      const peerRight = peer.x + peer.w;
      const peerCenterX = peer.x + peer.w / 2;
      const peerTop = peer.y;
      const peerBottom = peer.y + peer.h;
      const peerCenterY = peer.y + peer.h / 2;

      const xCandidates = [
        { target: peerLeft, value: peerLeft, measure: Math.abs(noteLeft - peerLeft) },
        { target: peerRight, value: peerRight - note.w, measure: Math.abs(noteLeft - peerRight) },
        { target: peerCenterX, value: peerCenterX - note.w / 2, measure: Math.abs(noteCenterX - peerCenterX) },
      ];
      for (const candidate of xCandidates) {
        const dist = Math.abs(candidate.value - candidateX);
        if (dist <= snapThreshold && (!bestX || dist < bestX.dist)) {
          bestX = { value: candidate.value, dist, measure: candidate.measure, target: candidate.target };
        }
      }

      const yCandidates = [
        { target: peerTop, value: peerTop, measure: Math.abs(noteTop - peerTop) },
        { target: peerBottom, value: peerBottom - note.h, measure: Math.abs(noteTop - peerBottom) },
        { target: peerCenterY, value: peerCenterY - note.h / 2, measure: Math.abs(noteCenterY - peerCenterY) },
      ];
      for (const candidate of yCandidates) {
        const dist = Math.abs(candidate.value - candidateY);
        if (dist <= snapThreshold && (!bestY || dist < bestY.dist)) {
          bestY = { value: candidate.value, dist, measure: candidate.measure, target: candidate.target };
        }
      }
    }

    const snappedX = bestX ? bestX.value : candidateX;
    const snappedY = bestY ? bestY.value : candidateY;
    setGuideLines({
      vertical: bestX
        ? {
            x: snappedX + note.w / 2,
            y1: boundsY1,
            y2: boundsY2,
            distance: bestX.measure,
          }
        : undefined,
      horizontal: bestY
        ? {
            y: snappedY + note.h / 2,
            x1: boundsX1,
            x2: boundsX2,
            distance: bestY.measure,
          }
        : undefined,
    });

    return { x: snappedX, y: snappedY };
  };

  const selectSingleNote = (noteId: string) => {
    syncPrimarySelection([noteId]);
    setEditing((previous) => (previous?.id === noteId ? previous : null));
  };

  const {
    applyColorToSelection,
    applyTextSizeToSelection,
    alignSelected,
    distributeSelected,
    makeNoteAtViewportCenter,
    makeZoneAtViewportCenter,
    applySelectedTemplate,
    addTagToSelectedNote,
    removeTagFromSelectedNote,
    createGroupFromSelectedZone,
    captureNotes,
  } = useWallActions({
    isTimeLocked,
    camera,
    viewport,
    selectedNoteId: ui.selectedNoteId,
    selectedZoneId: ui.selectedZoneId,
    lastColor: ui.lastColor,
    templateType: ui.templateType,
    tagInput,
    groupLabelInput,
    activeSelectedNoteIds,
    selectedNotes,
    setTagInput,
    setLastColor,
    syncPrimarySelection,
    toWorldPoint,
    createNote,
    createZone,
    applyTemplate,
    updateNote,
    addTagToNote,
    removeTagFromNote,
    createZoneGroup,
    runHistoryGroup,
  });

  const { resetView, focusBounds, focusNote, jumpToStaleNote, jumpToHighPriorityNote } = useWallCameraNavigation({
    camera,
    viewport,
    notesById: renderSnapshot.notes,
    visibleNotes,
    visibleZones,
    setCamera,
    setFlashNote,
    syncPrimarySelection,
    computeContentBounds,
    fitBoundsCamera,
  });

  const saveCurrentRecallSearch = () => {
    const activeCount = Number(Boolean(recallQuery)) + Number(Boolean(recallZoneId)) + Number(Boolean(recallTag)) + Number(recallDateFilter !== "all");
    if (activeCount === 0) {
      return;
    }
    const name = window.prompt("Name this recall search", `Recall ${savedRecallSearches.length + 1}`);
    if (!name) {
      return;
    }
    const item: SavedRecallSearch = {
      id: crypto.randomUUID(),
      name: name.trim(),
      query: recallQuery,
      zoneId: recallZoneId || undefined,
      tag: recallTag || undefined,
      dateFilter: recallDateFilter,
    };
    setSavedRecallSearches((previous) => [item, ...previous].slice(0, 20));
  };

  const applySavedRecallSearch = (item: SavedRecallSearch) => {
    setRecallQuery(item.query);
    setRecallZoneId(item.zoneId ?? "");
    setRecallTag(item.tag ?? "");
    setRecallDateFilter(item.dateFilter);
  };

  const { exportPng, exportPdf, exportMarkdown } = useWallExport({
    stageRef,
    camera,
    viewport,
    visibleNotes,
    visibleZones,
    activeSelectedNoteIds,
    selectedZoneId: ui.selectedZoneId,
    zonesById: renderSnapshot.zones,
    selectedNoteId: ui.selectedNoteId,
    allZones: zones,
    setCamera,
    setExportOpen,
    computeContentBounds,
    fitBoundsCamera,
    waitForPaint,
    makeDownloadId,
    downloadDataUrl,
    downloadTextFile,
    notesToMarkdown,
    zoneContainsNote,
  });

  const exportJson = useCallback(() => {
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    downloadJsonFile(`idea-wall-backup-${makeDownloadId()}.json`, snapshot);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(backupReminderLastPromptStorageKey, String(Date.now()));
    }
    setExportOpen(false);
  }, [setExportOpen]);

  const importJson = useCallback(
    async (file: File) => {
      try {
        const raw = await file.text();
        const parsed: unknown = JSON.parse(raw);
        if (!isPersistedWallStateLike(parsed)) {
          window.alert("Invalid backup file format.");
          return;
        }
        const ok = window.confirm("Import JSON backup and replace current wall state?");
        if (!ok) {
          return;
        }
        hydrate(parsed);
        setSelectedNoteIds([]);
        setExportOpen(false);
        window.alert("Backup imported successfully.");
      } catch {
        window.alert("Unable to import JSON backup.");
      }
    },
    [hydrate, setExportOpen],
  );

  useEffect(() => {
    if (typeof window === "undefined" || publishedReadOnly || backupReminderCadence === "off") {
      return;
    }
    const now = Date.now();
    const lastPromptRaw = window.localStorage.getItem(backupReminderLastPromptStorageKey);
    const lastPrompt = lastPromptRaw ? Number(lastPromptRaw) : 0;
    const intervalMs = backupReminderCadence === "daily" ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 24 * 7;
    if (Number.isFinite(lastPrompt) && now - lastPrompt < intervalMs) {
      return;
    }
    window.localStorage.setItem(backupReminderLastPromptStorageKey, String(now));
    const wantsExport = window.confirm(
      `Backup reminder (${backupReminderCadence}): export a full JSON backup now?`,
    );
    if (wantsExport) {
      exportJson();
    }
  }, [backupReminderCadence, exportJson, publishedReadOnly]);

  const publishReadOnlySnapshot = async () => {
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    const url = buildPublishedSnapshotUrl(snapshot);
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      window.alert("Read-only snapshot link copied to clipboard.");
    } catch {
      window.prompt("Copy read-only snapshot URL", url);
    }
  };

  const setLayoutPreference = (key: LayoutPreferenceKey, value: boolean) => {
    if (!value) {
      if (key === "showToolsPanel") {
        setLeftPanelOpen(false);
      }
      if (key === "showDetailsPanel") {
        setRightPanelOpen(false);
      }
    }
    setLayoutPrefs((previous) => ({ ...previous, [key]: value }));
  };

  const toggleDetailsSection = (key: DetailsSectionKey) => {
    setDetailsSectionsOpen((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const togglePresentationMode = () => {
    const next = !presentationMode;
    setPresentationMode(next);
    if (next) {
      setPresentationIndex(0);
      setQuickCaptureOpen(false);
      setSearchOpen(false);
      setExportOpen(false);
    }
  };

  const toggleTimelineMode = () => {
    const next = !timelineModeRef.current;
    setTimelineMode(next);
    if (next && timelineEntries.length > 0) {
      setTimelineIndex(timelineEntries.length - 1);
    }
    if (!next) {
      setIsTimelinePlaying(false);
    }
  };

  const selectedNote = ui.selectedNoteId ? renderSnapshot.notes[ui.selectedNoteId] : undefined;
  const primarySelectedNoteId = activeSelectedNoteIds[0] ?? ui.selectedNoteId;
  const primarySelectedNote = primarySelectedNoteId ? renderSnapshot.notes[primarySelectedNoteId] : undefined;
  const selectedZone = ui.selectedZoneId ? renderSnapshot.zones[ui.selectedZoneId] : undefined;
  const selectedGroup = ui.selectedGroupId ? renderSnapshot.zoneGroups[ui.selectedGroupId] : undefined;
  const hasNoteSelection = activeSelectedNoteIds.length > 0 || Boolean(ui.selectedNoteId);
  const showContextColor = hasNoteSelection;
  const showContextTextSize = hasNoteSelection;
  const showContextAlign = selectedNotes.length >= 2;
  const hasContextActions = showContextColor || showContextTextSize || showContextAlign;
  const displayedTags =
    selectedNotes.length > 1
      ? selectedNotes
          .map((note) => note.tags)
          .reduce<string[]>((common, tags) => (common.length === 0 ? [...tags] : common.filter((tag) => tags.includes(tag))), [])
      : selectedNote?.tags ?? [];
  const toolbarBtn =
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40";
  const toolbarBtnPrimary =
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40";
  const toolbarBtnActive =
    "inline-flex items-center gap-1.5 rounded-lg border border-sky-400 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40";
  const toolbarBtnCompact =
    "rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-40";
  const toolbarSelect =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-sky-400";
  const toolbarDivider = "mx-1 h-6 w-px bg-zinc-300";
  const toolbarLabel = "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
  const toolbarSurface = "rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-md backdrop-blur";
  const statusMessage = publishedReadOnly
    ? "Read-only published snapshot"
    : activeSelectedNoteIds.length > 1
    ? `${activeSelectedNoteIds.length} notes selected`
    : ui.linkingFromNoteId
    ? `Link mode: pick a target note for ${renderSnapshot.notes[ui.linkingFromNoteId]?.text.split("\n")[0] || "selected note"}`
    : "";
  const quickActionScreen =
    primarySelectedNote && !isTimeLocked
      ? toScreenPoint(primarySelectedNote.x + primarySelectedNote.w / 2, primarySelectedNote.y - 16, camera)
      : undefined;
  const tagPreviewNote = hoveredNoteId ? renderSnapshot.notes[hoveredNoteId] : primarySelectedNote;
  const tagPreviewPalette = tagPreviewNote ? noteTagChipPalette(tagPreviewNote.color) : undefined;
  const tagPreviewScreen =
    tagPreviewNote && tagPreviewNote.tags.length > 0
      ? toScreenPoint(tagPreviewNote.x + tagPreviewNote.w / 2, tagPreviewNote.y - 10, camera)
      : undefined;

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,_#fdf1b2_0,_#fff6d8_35%,_#f8f6f1_100%)] text-zinc-900">
      <header className="mx-2 mt-2 flex flex-col gap-1.5 md:mx-3 md:mt-3">
        <WallToolbar
          presentationMode={presentationMode}
          publishedReadOnly={publishedReadOnly}
          layoutPrefs={layoutPrefs}
          leftPanelOpen={leftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          layoutMenuOpen={layoutMenuOpen}
          quickCaptureOpen={quickCaptureOpen}
          isTimeLocked={isTimeLocked}
          canUndo={canUndo}
          canRedo={canRedo}
          historyUndoDepth={historyUndoDepth}
          historyRedoDepth={historyRedoDepth}
          timelineMode={timelineMode}
          showHeatmap={showHeatmap}
          onToggleLeftPanel={() => setLeftPanelOpen((previous) => !previous)}
          onToggleRightPanel={() => setRightPanelOpen((previous) => !previous)}
          onToggleLayoutMenu={() => setLayoutMenuOpen((previous) => !previous)}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleQuickCapture={() => setQuickCaptureOpen((previous) => !previous)}
          onOpenExport={() => setExportOpen(true)}
          onUndo={undo}
          onRedo={redo}
          onTogglePresentationMode={togglePresentationMode}
          onResetView={resetView}
          onToggleTimelineMode={toggleTimelineMode}
          onToggleHeatmap={() => setShowHeatmap((previous) => !previous)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onSetLayoutPreference={setLayoutPreference}
        />

        {!publishedReadOnly && !presentationMode && layoutPrefs.showContextBar && hasContextActions && (
          <div className={`${toolbarSurface} flex flex-wrap items-center gap-2`}>
            <span className={toolbarLabel}>Context</span>
            {showContextColor && (
              <>
                <div className={toolbarDivider} />
                <div className="flex items-center gap-2">
                  <span className={toolbarLabel}>Color</span>
                  <NoteSwatches
                    value={selectedNotes[0]?.color ?? selectedNote?.color ?? ui.lastColor}
                    onSelect={(color) => {
                      applyColorToSelection(color);
                    }}
                  />
                </div>
              </>
            )}
            {showContextTextSize && (
              <div className="flex items-center gap-1">
                <span className={toolbarLabel}>Text</span>
                {NOTE_TEXT_SIZES.map((size) => (
                  <button
                    key={`context-size-${size.value}`}
                    type="button"
                    onClick={() => applyTextSizeToSelection(size.value)}
                    disabled={isTimeLocked}
                    className={
                      (primarySelectedNote?.textSize ?? NOTE_DEFAULTS.textSize) === size.value
                        ? toolbarBtnActive
                        : toolbarBtnCompact
                    }
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
            {showContextAlign && (
              <div className="flex items-center gap-1">
                <span className={toolbarLabel}>Align</span>
                <button type="button" onClick={() => alignSelected("left")} disabled={isTimeLocked} className={toolbarBtnCompact}>
                  L
                </button>
                <button type="button" onClick={() => alignSelected("center")} disabled={isTimeLocked} className={toolbarBtnCompact}>
                  C
                </button>
                <button type="button" onClick={() => alignSelected("right")} disabled={isTimeLocked} className={toolbarBtnCompact}>
                  R
                </button>
                <button type="button" onClick={() => alignSelected("top")} disabled={isTimeLocked} className={toolbarBtnCompact}>
                  T
                </button>
                <button type="button" onClick={() => alignSelected("middle")} disabled={isTimeLocked} className={toolbarBtnCompact}>
                  M
                </button>
                <button type="button" onClick={() => alignSelected("bottom")} disabled={isTimeLocked} className={toolbarBtnCompact}>
                  B
                </button>
                <button
                  type="button"
                  onClick={() => distributeSelected("horizontal")}
                  disabled={selectedNotes.length < 3 || isTimeLocked}
                  className={toolbarBtnCompact}
                >
                  Dist H
                </button>
                <button
                  type="button"
                  onClick={() => distributeSelected("vertical")}
                  disabled={selectedNotes.length < 3 || isTimeLocked}
                  className={toolbarBtnCompact}
                >
                  Dist V
                </button>
              </div>
            )}
          </div>
        )}

        {statusMessage && (
          <div className="inline-flex w-fit max-w-[min(96vw,40rem)] self-start items-center rounded-xl border border-zinc-200 bg-white/85 px-3 py-1.5 text-xs text-zinc-600 shadow-sm">
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        {!publishedReadOnly && (
          <div className="inline-flex w-fit items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white/85 px-3 py-1.5 text-xs text-zinc-600 shadow-sm">
            <button
              type="button"
              onClick={syncNow}
              disabled={!cloudWallId || isSyncing}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync now"}
            </button>
            <span>
              {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : "Waiting for first sync"}
            </span>
          </div>
        )}
      </header>

      <div
        ref={containerRef}
        className={`relative flex-1 overflow-hidden ${
          isSpaceDown || isMiddleDragging || isLeftCanvasDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseUp={() => {
          setIsMiddleDragging(false);
          setIsLeftCanvasDragging(false);
          setGuideLines({});
          finalizeBoxSelection();
        }}
        onMouseLeave={() => {
          setIsMiddleDragging(false);
          setIsLeftCanvasDragging(false);
          setGuideLines({});
          finalizeBoxSelection();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
        {!hydrated && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
            <p className="rounded-lg bg-white px-4 py-2 text-sm text-zinc-700 shadow">Loading wall...</p>
          </div>
        )}

        {!publishedReadOnly && syncError && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[45] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
            Sync error: {syncError}
          </div>
        )}

        {!presentationMode &&
          isCompactLayout &&
          ((layoutPrefs.showToolsPanel && leftPanelOpen) || (layoutPrefs.showDetailsPanel && rightPanelOpen)) && (
          <button
            type="button"
            aria-label="Close side panels"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
            className="absolute inset-0 z-[34] bg-zinc-900/20"
          />
        )}

        {!presentationMode && !publishedReadOnly && layoutPrefs.showToolsPanel && (
          <WallToolsPanel
            isCompactLayout={isCompactLayout}
            leftPanelOpen={leftPanelOpen}
            isTimeLocked={isTimeLocked}
            selectedNoteId={ui.selectedNoteId}
            linkingFromNoteId={ui.linkingFromNoteId}
            linkType={ui.linkType}
            linkTypeOptions={LINK_TYPES}
            showClusters={ui.showClusters}
            toolbarBtn={toolbarBtn}
            toolbarBtnPrimary={toolbarBtnPrimary}
            toolbarBtnActive={toolbarBtnActive}
            toolbarSelect={toolbarSelect}
            onClose={() => setLeftPanelOpen(false)}
            onCreateNote={makeNoteAtViewportCenter}
            onCreateZone={makeZoneAtViewportCenter}
            onToggleBoxSelect={() => setBoxSelectMode((value) => !value)}
            boxSelectMode={boxSelectMode}
            onStartLinking={() => {
              if (isTimeLocked || !ui.selectedNoteId) {
                return;
              }
              setLinkingFromNote(ui.selectedNoteId);
            }}
            onLinkTypeChange={(value) => setLinkType(value)}
            onToggleClusters={() => setShowClusters(!ui.showClusters)}
          />
        )}

        <WallStage
          stageRef={stageRef}
          viewport={viewport}
          camera={camera}
          setCamera={setCamera}
          isSpaceDown={isSpaceDown}
          isMiddleDragging={isMiddleDragging}
          isLeftCanvasDragging={isLeftCanvasDragging}
          setIsMiddleDragging={setIsMiddleDragging}
          setIsLeftCanvasDragging={setIsLeftCanvasDragging}
          boxSelectMode={boxSelectMode}
          isTimeLocked={isTimeLocked}
          selectionBox={selectionBox}
          setSelectionBox={setSelectionBox}
          toWorldPoint={toWorldPoint}
          onEmptyCanvasClick={() => {
            resetSelection();
            clearNoteSelection();
            setEditing(null);
          }}
        >
          <Layer>
            <WallLinksZonesLayer
              visibleLinks={visibleLinks}
              visibleZones={visibleZones}
              notesById={renderSnapshot.notes}
              selectedLinkId={ui.selectedLinkId}
              selectedNoteId={ui.selectedNoteId}
              selectedZoneId={ui.selectedZoneId}
              pathLinkIds={pathLinkIds}
              linkColorByType={linkColorByType}
              linkStrokeByType={linkStrokeByType}
              linkPoints={linkPoints}
              zoneNodeRefs={zoneNodeRefs}
              isTimeLocked={isTimeLocked}
              onSelectLink={(linkId) => {
                setLinkMenu((previous) => ({ ...previous, open: false }));
                clearNoteSelection();
                selectLink(linkId);
              }}
              onOpenLinkMenu={(x, y, linkId) => {
                clearNoteSelection();
                selectLink(linkId);
                setLinkMenu({
                  open: true,
                  x,
                  y,
                  linkId,
                });
              }}
              onSelectZone={(zoneId, groupId) => {
                clearNoteSelection();
                selectZone(zoneId);
                if (groupId) {
                  selectGroup(groupId);
                }
              }}
              onMoveZone={moveZone}
              onResizeZone={updateZone}
            />

            <WallNotesLayer
              visibleNotes={visibleNotes}
              activeSelectedNoteIds={activeSelectedNoteIds}
              selectedNoteId={ui.selectedNoteId}
              flashNoteId={ui.flashNoteId}
              hoveredNoteId={hoveredNoteId}
              draggingNoteId={draggingNoteId}
              resizingNoteDrafts={resizingNoteDrafts}
              notesById={renderSnapshot.notes}
              linkingFromNoteId={ui.linkingFromNoteId}
              linkType={ui.linkType}
              isTimeLocked={isTimeLocked}
              showHeatmap={showHeatmap}
              heatmapReferenceTs={activeTimelineEntry?.ts ?? wallClockTs}
              showNoteTags={layoutPrefs.showNoteTags}
              noteNodeRefs={noteNodeRefs}
              dragSelectionStartRef={dragSelectionStartRef}
              dragAnchorRef={dragAnchorRef}
              dragSingleStartRef={dragSingleStartRef}
              setHoveredNoteId={setHoveredNoteId}
              setDraggingNoteId={setDraggingNoteId}
              setGuideLines={setGuideLines}
              setResizingNoteDrafts={setResizingNoteDrafts}
              syncPrimarySelection={syncPrimarySelection}
              selectSingleNote={selectSingleNote}
              toggleSelectNote={toggleSelectNote}
              setLinkingFromNote={setLinkingFromNote}
              setEditing={setEditing}
              openEditor={openEditor}
              createLink={createLink}
              resolveSnappedPosition={resolveSnappedPosition}
              runHistoryGroup={runHistoryGroup}
              moveNote={moveNote}
              updateNote={updateNote}
              duplicateNoteAt={duplicateNoteAt}
              getNoteTextStyle={getNoteTextStyle}
              truncateNoteText={truncateNoteText}
              noteTagChipPalette={noteTagChipPalette}
              recencyIntensity={recencyIntensity}
              editingId={editing?.id}
            />

            <WallOverlaysLayer
              showClusters={ui.showClusters}
              clusterBounds={clusterBounds}
              showAutoTagGroups={showAutoTagGroups}
              autoTagGroups={autoTagGroups}
              autoTagLabelLayout={autoTagLabelLayout}
              tagGroupColor={tagGroupColor}
              selectionBox={selectionBox}
              guideLines={guideLines}
              noteTransformerRef={noteTransformerRef}
              zoneTransformerRef={zoneTransformerRef}
              isCompactLayout={isCompactLayout}
              noteMinWidth={NOTE_DEFAULTS.minWidth}
              noteMinHeight={NOTE_DEFAULTS.minHeight}
              zoneMinWidth={ZONE_DEFAULTS.minWidth}
              zoneMinHeight={ZONE_DEFAULTS.minHeight}
            />
          </Layer>
        </WallStage>

        {editing && renderSnapshot.notes[editing.id] && !isTimeLocked && (
          <div
            className="absolute z-[46]"
            style={(() => {
              const note = renderSnapshot.notes[editing.id];
              const screen = toScreenPoint(note.x, note.y, camera);
              return {
                left: `${screen.x}px`,
                top: `${screen.y}px`,
                width: `${note.w * camera.zoom}px`,
              };
            })()}
          >
            <textarea
              autoFocus
              value={editing.text}
              onChange={(event) => setEditing({ id: editing.id, text: event.target.value })}
              onBlur={handleEditorBlur}
              className="w-full resize-none rounded-xl border border-zinc-700/40 bg-white/95 p-3 text-[16px] leading-6 shadow-xl outline-none"
              style={(() => {
                const note = renderSnapshot.notes[editing.id];
                return {
                  height: `${note.h * camera.zoom}px`,
                };
              })()}
            />
            <div
              data-note-edit-tags="true"
              className="mt-2 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Tags</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {renderSnapshot.notes[editing.id].tags.length === 0 && <span className="text-[11px] text-zinc-500">No tags yet.</span>}
                {renderSnapshot.notes[editing.id].tags.map((tag) => (
                  <span key={`edit-tag-${tag}`} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700">
                    <button
                      type="button"
                      data-note-edit-tags="true"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setEditTagRenameFrom(tag);
                        setEditTagInput(tag);
                      }}
                      className="text-zinc-700 hover:text-zinc-900"
                    >
                      #{tag}
                    </button>
                    <button
                      type="button"
                      data-note-edit-tags="true"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => removeTagFromNote(editing.id, tag)}
                      className="text-zinc-500 hover:text-red-700"
                      title="Delete tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  data-note-edit-tags="true"
                  value={editTagInput}
                  onChange={(event) => setEditTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.preventDefault();
                    if (!editTagInput.trim()) {
                      return;
                    }
                    if (editTagRenameFrom) {
                      renameTagOnNote(editing.id, editTagRenameFrom, editTagInput);
                      setEditTagRenameFrom(null);
                    } else {
                      addTagToNote(editing.id, editTagInput);
                    }
                    setEditTagInput("");
                  }}
                  placeholder={editTagRenameFrom ? "Rename tag" : "Add tag"}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                />
                <button
                  type="button"
                  data-note-edit-tags="true"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (!editTagInput.trim()) {
                      return;
                    }
                    if (editTagRenameFrom) {
                      renameTagOnNote(editing.id, editTagRenameFrom, editTagInput);
                      setEditTagRenameFrom(null);
                    } else {
                      addTagToNote(editing.id, editTagInput);
                    }
                    setEditTagInput("");
                  }}
                  className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
                >
                  {editTagRenameFrom ? "Rename" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tagPreviewScreen && tagPreviewNote && !editing && (
          <div
            className="pointer-events-none absolute z-[44] -translate-x-1/2 -translate-y-full"
            style={{
              left: `${tagPreviewScreen.x}px`,
              top: `${tagPreviewScreen.y}px`,
            }}
          >
            <div className="max-w-[min(70vw,34rem)] overflow-x-auto whitespace-nowrap rounded-xl border border-zinc-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-1">
                {tagPreviewNote.tags.map((tag) => (
                  <span
                    key={`hover-tag-${tag}`}
                    className="rounded-full border px-2 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: tagPreviewPalette?.bg,
                      borderColor: tagPreviewPalette?.border,
                      color: tagPreviewPalette?.text,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {quickActionScreen && primarySelectedNote && !editing && (
          <div
            className="pointer-events-auto absolute z-[45] -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-300 bg-white/96 px-2 py-1.5 shadow-xl backdrop-blur-sm"
            style={{
              left: `${quickActionScreen.x}px`,
              top: `${quickActionScreen.y}px`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              {NOTE_TEXT_SIZES.map((size) => (
                <button
                  key={`quick-size-${size.value}`}
                  type="button"
                  className={
                    (primarySelectedNote.textSize ?? NOTE_DEFAULTS.textSize) === size.value ? toolbarBtnActive : toolbarBtnCompact
                  }
                  onClick={() => applyTextSizeToSelection(size.value)}
                  title={`Text size ${size.label}`}
                >
                  {size.label}
                </button>
              ))}
              <div className="mx-1 h-5 w-px bg-zinc-300" />
              <NoteSwatches
                value={primarySelectedNote.color}
                onSelect={(color) => {
                  applyColorToSelection(color);
                }}
              />
              <div className="mx-1 h-5 w-px bg-zinc-300" />
              <button
                type="button"
                onClick={() => duplicateNote(primarySelectedNote.id)}
                className={toolbarBtnCompact}
                title="Duplicate (Ctrl/Cmd+D)"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm("Delete selected note?");
                  if (ok) {
                    deleteNote(primarySelectedNote.id);
                    clearNoteSelection();
                  }
                }}
                className={toolbarBtnCompact}
                title="Delete"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setLinkingFromNote(primarySelectedNote.id)}
                className={ui.linkingFromNoteId ? toolbarBtnActive : toolbarBtnCompact}
                title="Start link (Ctrl/Cmd+L)"
              >
                Link
              </button>
            </div>
          </div>
        )}

        {linkMenu.open && linkMenu.linkId && renderSnapshot.links[linkMenu.linkId] && (
          <div
            className="fixed z-[70] w-56 rounded-xl border border-zinc-300 bg-white p-2 shadow-2xl"
            style={{
              left: `${Math.max(8, Math.min(linkMenu.x, maxViewportWidth - 232))}px`,
              top: `${Math.max(8, Math.min(linkMenu.y, maxViewportHeight - 210))}px`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Link Actions</p>
            <button
              type="button"
              className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              disabled={isTimeLocked}
              onClick={() => {
                if (linkMenu.linkId) {
                  deleteLink(linkMenu.linkId);
                }
                setLinkMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              Delete link
            </button>
            <div className="mt-2 border-t border-zinc-200 pt-2">
              <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Change Type</p>
              <div className="space-y-1">
                {LINK_TYPES.map((option) => (
                  <button
                    key={`ctx-${option.value}`}
                    type="button"
                    disabled={isTimeLocked}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      if (linkMenu.linkId) {
                        updateLinkType(linkMenu.linkId, option.value as LinkType);
                      }
                      setLinkMenu((previous) => ({ ...previous, open: false }));
                    }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!presentationMode && layoutPrefs.showDetailsPanel && (
          <WallDetailsPanel
            isCompactLayout={isCompactLayout}
            rightPanelOpen={rightPanelOpen}
            onClose={() => setRightPanelOpen(false)}
          >
            <WallDetailsContent
              templateType={ui.templateType}
              templateOptions={TEMPLATE_TYPES}
              isTimeLocked={isTimeLocked}
              onTemplateTypeChange={(value) => setTemplateType(value)}
              onApplyTemplate={applySelectedTemplate}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onAddTag={addTagToSelectedNote}
              selectedNoteId={ui.selectedNoteId}
              selectedNoteIdsCount={activeSelectedNoteIds.length}
              displayedTags={displayedTags}
              onRemoveTag={removeTagFromSelectedNote}
              detailsSectionsOpen={detailsSectionsOpen}
              onToggleDetailsSection={toggleDetailsSection}
              timelineEntriesCount={timelineEntries.length}
              visibleNotesCount={visibleNotes.length}
              historyUndoDepth={historyUndoDepth}
              historyRedoDepth={historyRedoDepth}
              notes={notes}
              onJumpStale={jumpToStaleNote}
              onJumpPriority={jumpToHighPriorityNote}
              onClearHistory={() => {
                const hasHistory = historyUndoDepth > 0 || historyRedoDepth > 0;
                if (!hasHistory) {
                  return;
                }
                const ok = window.confirm("Clear undo/redo history? This cannot be undone.");
                if (ok) {
                  clearHistory();
                }
              }}
              recallQuery={recallQuery}
              onRecallQueryChange={setRecallQuery}
              recallZoneId={recallZoneId}
              onRecallZoneIdChange={setRecallZoneId}
              recallTag={recallTag}
              onRecallTagChange={setRecallTag}
              recallDateFilter={recallDateFilter}
              onRecallDateFilterChange={setRecallDateFilter}
              visibleZones={visibleZones}
              availableRecallTags={availableRecallTags}
              onSaveRecallSearch={saveCurrentRecallSearch}
              onClearRecallFilters={() => {
                setRecallQuery("");
                setRecallZoneId("");
                setRecallTag("");
                setRecallDateFilter("all");
              }}
              savedRecallSearches={savedRecallSearches}
              onApplySavedRecallSearch={applySavedRecallSearch}
              onDeleteSavedRecallSearch={(id) =>
                setSavedRecallSearches((previous) => previous.filter((entry) => entry.id !== id))
              }
              groupLabelInput={groupLabelInput}
              onGroupLabelInputChange={setGroupLabelInput}
              selectedZone={selectedZone}
              selectedGroup={selectedGroup}
              selectedZoneId={ui.selectedZoneId}
              zoneGroups={zoneGroups}
              onCreateGroupFromSelectedZone={createGroupFromSelectedZone}
              onAssignZoneToGroup={assignZoneToGroup}
              onSelectGroup={selectGroup}
              onToggleGroupCollapse={toggleGroupCollapse}
              onDeleteGroup={deleteGroup}
              onClearNoteSelection={clearNoteSelection}
              showAutoTagGroups={showAutoTagGroups}
              onToggleAutoTagGroups={() => setShowAutoTagGroups((value) => !value)}
              autoTagGroups={autoTagGroups}
              onFocusBounds={focusBounds}
            />
          </WallDetailsPanel>
        )}

        {showHeatmap && (
          <div className="pointer-events-auto absolute bottom-3 right-3 z-30">
            <CalendarHeatmap timestamps={timelineEntries.map((entry) => entry.ts)} onSelectDay={jumpToTimelineDay} />
          </div>
        )}

        {timelineMode && timelineEntries.length > 0 && (
          <WallTimelineDock
            timelineEntriesLength={timelineEntries.length}
            timelineIndex={timelineIndex}
            isTimelinePlaying={isTimelinePlaying}
            currentTimestamp={timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)].ts}
            onTogglePlay={() => setIsTimelinePlaying((value) => !value)}
            onStart={() => setTimelineIndex(0)}
            onLatest={() => setTimelineIndex(timelineEntries.length - 1)}
            onSeek={(index) => {
              setIsTimelinePlaying(false);
              setTimelineIndex(index);
            }}
          />
        )}

        {presentationMode && (
          <WallPresentationDock
            presentationIndex={presentationIndex}
            presentationNotesLength={presentationNotes.length}
            onPrev={() => setPresentationIndex((previous) => Math.max(previous - 1, 0))}
            onNext={() => setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, presentationNotes.length - 1)))}
            onExit={() => setPresentationMode(false)}
          />
        )}
      </div>

      <QuickCaptureBar
        open={quickCaptureOpen}
        disabled={isTimeLocked}
        onClose={() => setQuickCaptureOpen(false)}
        onCapture={captureNotes}
      />

      <SearchPalette open={ui.isSearchOpen} notes={visibleNotes} onClose={() => setSearchOpen(false)} onSelect={focusNote} />

      <ExportModal
        open={ui.isExportOpen}
        onClose={() => setExportOpen(false)}
        onExportPng={(scope, pixelRatio) => {
          void exportPng(scope, pixelRatio);
        }}
        onExportPdf={(scope) => {
          void exportPdf(scope);
        }}
        onExportMarkdown={exportMarkdown}
        onExportJson={exportJson}
        onImportJson={(file) => {
          void importJson(file);
        }}
        onPublishSnapshot={() => {
          void publishReadOnlySnapshot();
        }}
        backupReminderCadence={backupReminderCadence}
        onBackupReminderCadenceChange={setBackupReminderCadence}
      />

      <ShortcutsHelp open={ui.isShortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};
