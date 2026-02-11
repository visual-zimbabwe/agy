"use client";

import { type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Arrow, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import Fuse from "fuse.js";
import jsPDF from "jspdf";

import { ExportModal, type ExportScope } from "@/components/ExportModal";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteSwatches } from "@/components/NoteCard";
import { QuickCaptureBar } from "@/components/QuickCaptureBar";
import { SearchPalette } from "@/components/SearchPalette";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import { WallDetailsPanel } from "@/components/wall/WallDetailsPanel";
import { WallToolbar } from "@/components/wall/WallToolbar";
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
import type { Link, LinkType, Note, PersistedWallState, TemplateType, Zone } from "@/features/wall/types";
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
type RecallDateFilter = "all" | "today" | "7d" | "30d";
type SavedRecallSearch = {
  id: string;
  name: string;
  query: string;
  zoneId?: string;
  tag?: string;
  dateFilter: RecallDateFilter;
};
type LayoutPreferenceKey = "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags";
type LayoutPreferences = Record<LayoutPreferenceKey, boolean>;
type DetailsSectionKey = "history" | "recall" | "zoneGroups" | "tagGroups";
type DetailsSectionState = Record<DetailsSectionKey, boolean>;
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};
type TagLabelLayout = Record<string, { x: number; y: number }>;

const flashDurationMs = 1200;

const isTypingInField = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
};

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

const boundsIntersect = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setIsSpaceDown(true);
      }

      const typing = isTypingInField(event);

      if ((event.key === "?" || (event.shiftKey && event.key === "/")) && !typing) {
        event.preventDefault();
        setShortcutsOpen(!ui.isShortcutsOpen);
        return;
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setExportOpen(false);
        setShortcutsOpen(false);
        setQuickCaptureOpen(false);
        setEditing(null);
        setGuideLines({});
        resetSelection();
        setSelectedNoteIds([]);
        selectNote(undefined);
        return;
      }

      if (typing) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (!ctrlOrMeta && key === "t") {
        event.preventDefault();
        setTimelineMode((previous) => {
          const next = !previous;
          if (next && timelineEntries.length > 0) {
            setTimelineIndex(timelineEntries.length - 1);
          }
          if (!next) {
            setIsTimelinePlaying(false);
          }
          return next;
        });
        return;
      }

      if (!ctrlOrMeta && key === "h") {
        event.preventDefault();
        setShowHeatmap((previous) => !previous);
        return;
      }

      if (!ctrlOrMeta && key === "p") {
        event.preventDefault();
        setPresentationMode((previous) => {
          const next = !previous;
          if (next) {
            setPresentationIndex(0);
            setQuickCaptureOpen(false);
            setSearchOpen(false);
            setExportOpen(false);
          }
          return next;
        });
        return;
      }

      if (presentationMode && (event.key === "ArrowRight" || event.key === "ArrowDown")) {
        event.preventDefault();
        setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, notes.length - 1)));
        return;
      }

      if (presentationMode && (event.key === "ArrowLeft" || event.key === "ArrowUp")) {
        event.preventDefault();
        setPresentationIndex((previous) => Math.max(previous - 1, 0));
        return;
      }

      if (!ctrlOrMeta && key === "q") {
        event.preventDefault();
        setQuickCaptureOpen((previous) => !previous);
        return;
      }

      if (ctrlOrMeta && key === "j") {
        event.preventDefault();
        setQuickCaptureOpen((previous) => !previous);
        return;
      }

      if ((key === "n" && !event.altKey) || (ctrlOrMeta && key === "n")) {
        if (isTimeLocked) {
          return;
        }
        event.preventDefault();
        const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
        const createdId = createNote(world.x - NOTE_DEFAULTS.width / 2, world.y - NOTE_DEFAULTS.height / 2, ui.lastColor);
        const createdNote = notesMap[createdId];
        setSelectedNoteIds([createdId]);
        selectNote(createdId);
        openEditor(createdId, createdNote?.text ?? "");
        return;
      }

      if (ctrlOrMeta && key === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (ctrlOrMeta && key === "a") {
        event.preventDefault();
        if (isTimeLocked) {
          return;
        }
        const ids = notes.map((note) => note.id);
        setSelectedNoteIds(ids);
        selectNote(ids.length === 1 ? ids[0] : undefined);
        return;
      }

      if (ctrlOrMeta && key === "z") {
        event.preventDefault();
        if (isTimeLocked) {
          return;
        }
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (ctrlOrMeta && key === "y") {
        event.preventDefault();
        if (isTimeLocked) {
          return;
        }
        redo();
        return;
      }

      if (ctrlOrMeta && key === "l") {
        if (isTimeLocked) {
          return;
        }
        event.preventDefault();
        if (ui.selectedNoteId) {
          setLinkingFromNote(ui.selectedNoteId);
        }
        return;
      }

      if ((ctrlOrMeta && key === "d") || (event.shiftKey && key === "d")) {
        if (isTimeLocked) {
          return;
        }
        if (ui.selectedNoteId) {
          event.preventDefault();
          duplicateNote(ui.selectedNoteId);
        }
        return;
      }

      if (!ctrlOrMeta && key === "enter" && ui.selectedNoteId && !isTimeLocked) {
        const selected = renderSnapshot.notes[ui.selectedNoteId];
        if (selected) {
          event.preventDefault();
          openEditor(selected.id, selected.text);
        }
        return;
      }

      if ((key === "delete" || key === "backspace") && !editing) {
        if (isTimeLocked) {
          return;
        }
        if (selectedNoteIds.length > 1) {
          const ok = window.confirm(`Delete ${selectedNoteIds.length} selected notes?`);
          if (ok) {
            for (const id of selectedNoteIds) {
              deleteNote(id);
            }
            setSelectedNoteIds([]);
            selectNote(undefined);
          }
          return;
        }
        if (ui.selectedNoteId) {
          const ok = window.confirm("Delete selected note?");
          if (ok) {
            deleteNote(ui.selectedNoteId);
          }
          return;
        }

        if (ui.selectedZoneId) {
          const ok = window.confirm("Delete selected zone?");
          if (ok) {
            deleteZone(ui.selectedZoneId);
          }
          return;
        }

        if (ui.selectedLinkId) {
          const ok = window.confirm("Delete selected link?");
          if (ok) {
            deleteLink(ui.selectedLinkId);
          }
          return;
        }

        if (ui.selectedGroupId) {
          const ok = window.confirm("Delete selected zone group?");
          if (ok) {
            deleteGroup(ui.selectedGroupId);
          }
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setIsSpaceDown(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    camera,
    editing,
    isTimeLocked,
    presentationMode,
    notes.length,
    notesMap,
    notes,
    openEditor,
    selectedNoteIds,
    resetSelection,
    renderSnapshot.notes,
    redo,
    setExportOpen,
    setLinkingFromNote,
    setQuickCaptureOpen,
    setSearchOpen,
    setShortcutsOpen,
    selectNote,
    undo,
    ui.isShortcutsOpen,
    ui.lastColor,
    ui.linkType,
    ui.selectedGroupId,
    ui.selectedLinkId,
    ui.selectedNoteId,
    ui.selectedZoneId,
    timelineEntries.length,
    viewport.h,
    viewport.w,
  ]);

  useEffect(() => {
    if (!ui.flashNoteId) {
      return;
    }

    const timer = setTimeout(() => setFlashNote(undefined), flashDurationMs);
    return () => clearTimeout(timer);
  }, [setFlashNote, ui.flashNoteId]);

  useEffect(() => {
    if (!isTimelinePlaying || timelineEntries.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setTimelineIndex((previous) => {
        if (previous >= timelineEntries.length - 1) {
          setIsTimelinePlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [isTimelinePlaying, timelineEntries.length, timelineMode]);

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
  const activeSelectedNoteIds = useMemo(
    () => selectedNoteIds.filter((id) => Boolean(renderSnapshot.notes[id])),
    [renderSnapshot.notes, selectedNoteIds],
  );
  const activeSelectedNoteIdSet = useMemo(() => new Set(activeSelectedNoteIds), [activeSelectedNoteIds]);
  const selectedNotes = useMemo(
    () =>
      activeSelectedNoteIds
        .map((id) => renderSnapshot.notes[id])
        .filter((note): note is Note => Boolean(note)),
    [activeSelectedNoteIds, renderSnapshot.notes],
  );
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

  const syncPrimarySelection = (ids: string[]) => {
    const nextIds = ids.filter((id) => Boolean(renderSnapshot.notes[id]));
    setSelectedNoteIds(nextIds);
    if (nextIds.length === 1) {
      selectNote(nextIds[0]);
    } else {
      selectNote(undefined);
    }
  };

  const selectSingleNote = (noteId: string) => {
    syncPrimarySelection([noteId]);
    setEditing((previous) => (previous?.id === noteId ? previous : null));
  };

  const toggleSelectNote = (noteId: string) => {
    const exists = activeSelectedNoteIds.includes(noteId);
    const next = exists ? activeSelectedNoteIds.filter((id) => id !== noteId) : [...activeSelectedNoteIds, noteId];
    setSelectedNoteIds(next);
    if (next.length === 1) {
      selectNote(next[0]);
    } else {
      selectNote(undefined);
    }
  };

  const clearNoteSelection = () => {
    setSelectedNoteIds([]);
    selectNote(undefined);
  };

  const applyColorToSelection = (color: string) => {
    if (isTimeLocked) {
      return;
    }
    if (activeSelectedNoteIds.length === 0) {
      if (ui.selectedNoteId) {
        updateNote(ui.selectedNoteId, { color });
      }
      setLastColor(color);
      return;
    }

    for (const id of activeSelectedNoteIds) {
      updateNote(id, { color });
    }
    setLastColor(color);
  };

  const applyTextSizeToSelection = (textSize: "sm" | "md" | "lg") => {
    if (isTimeLocked) {
      return;
    }
    const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
    for (const id of targetIds) {
      updateNote(id, { textSize });
    }
  };

  const alignSelected = (axis: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (isTimeLocked || selectedNotes.length < 2) {
      return;
    }
    const minX = Math.min(...selectedNotes.map((n) => n.x));
    const maxX = Math.max(...selectedNotes.map((n) => n.x + n.w));
    const minY = Math.min(...selectedNotes.map((n) => n.y));
    const maxY = Math.max(...selectedNotes.map((n) => n.y + n.h));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    runHistoryGroup(() => {
      for (const note of selectedNotes) {
        if (axis === "left") updateNote(note.id, { x: minX });
        if (axis === "right") updateNote(note.id, { x: maxX - note.w });
        if (axis === "center") updateNote(note.id, { x: centerX - note.w / 2 });
        if (axis === "top") updateNote(note.id, { y: minY });
        if (axis === "bottom") updateNote(note.id, { y: maxY - note.h });
        if (axis === "middle") updateNote(note.id, { y: centerY - note.h / 2 });
      }
    });
  };

  const distributeSelected = (direction: "horizontal" | "vertical") => {
    if (isTimeLocked || selectedNotes.length < 3) {
      return;
    }

    const sorted =
      direction === "horizontal"
        ? [...selectedNotes].sort((a, b) => a.x - b.x)
        : [...selectedNotes].sort((a, b) => a.y - b.y);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) {
      return;
    }
    const span = direction === "horizontal" ? last.x - first.x : last.y - first.y;
    const gap = span / (sorted.length - 1);

    runHistoryGroup(() => {
      sorted.forEach((note, index) => {
        if (direction === "horizontal") {
          updateNote(note.id, { x: first.x + gap * index });
        } else {
          updateNote(note.id, { y: first.y + gap * index });
        }
      });
    });
  };

  const makeNoteAtViewportCenter = () => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createNote(world.x - NOTE_DEFAULTS.width / 2, world.y - NOTE_DEFAULTS.height / 2, ui.lastColor);
    syncPrimarySelection([id]);
  };

  const makeZoneAtViewportCenter = () => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    createZone(world.x - ZONE_DEFAULTS.width / 2, world.y - ZONE_DEFAULTS.height / 2, "Zone");
  };

  const applySelectedTemplate = () => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    applyTemplate(ui.templateType, world.x, world.y);
  };

  const addTagToSelectedNote = () => {
    if (isTimeLocked) {
      return;
    }
    const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
    if (targetIds.length === 0) {
      return;
    }
    const tag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag) {
      return;
    }
    for (const noteId of targetIds) {
      addTagToNote(noteId, tag);
    }
    setTagInput("");
  };

  const removeTagFromSelectedNote = (tag: string) => {
    if (isTimeLocked) {
      return;
    }
    const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
    if (targetIds.length === 0) {
      return;
    }
    for (const noteId of targetIds) {
      removeTagFromNote(noteId, tag);
    }
  };

  const createGroupFromSelectedZone = () => {
    if (isTimeLocked) {
      return;
    }
    if (!ui.selectedZoneId) {
      return;
    }
    const label = groupLabelInput.trim() || "Group";
    createZoneGroup(label, [ui.selectedZoneId]);
  };

  const captureNotes = (items: Array<{ text: string; tags: string[] }>) => {
    if (isTimeLocked || items.length === 0) {
      return;
    }

    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(items.length))));
    const gapX = NOTE_DEFAULTS.width + 24;
    const gapY = NOTE_DEFAULTS.height + 20;

    const createdIds: string[] = [];
    items.forEach((item, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = world.x + (col - (columns - 1) / 2) * gapX;
      const y = world.y + row * gapY;
      const id = createNote(x, y, ui.lastColor);
      updateNote(id, { text: item.text, tags: item.tags });
      createdIds.push(id);
    });

    syncPrimarySelection(createdIds);
  };

  const resetView = () => {
    const bounds = computeContentBounds(visibleNotes, visibleZones);
    if (!bounds) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    setCamera({
      zoom: 1,
      x: viewport.w / 2 - centerX,
      y: viewport.h / 2 - centerY,
    });
  };

  const focusBounds = (bounds: Bounds) => {
    setCamera(fitBoundsCamera(bounds, viewport));
  };

  const jumpToTimelineDay = (day: string) => {
    if (timelineEntries.length === 0) {
      return;
    }

    const index = (() => {
      for (let i = timelineEntries.length - 1; i >= 0; i -= 1) {
        const candidate = new Date(timelineEntries[i].ts);
        const key = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(
          candidate.getDate(),
        ).padStart(2, "0")}`;
        if (key === day) {
          return i;
        }
      }
      return -1;
    })();

    if (index >= 0) {
      setTimelineMode(true);
      setIsTimelinePlaying(false);
      setTimelineIndex(index);
    }
  };

  const jumpToStaleNote = () => {
    if (visibleNotes.length === 0) {
      return;
    }
    const stale = [...visibleNotes].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (stale) {
      focusNote(stale.id);
    }
  };

  const jumpToHighPriorityNote = () => {
    const priorityTags = new Set(["high", "priority", "urgent", "p0", "critical"]);
    const candidates = visibleNotes.filter((note) => note.tags.some((tag) => priorityTags.has(tag.toLowerCase())));
    if (candidates.length === 0) {
      return;
    }
    const chosen = [...candidates].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (chosen) {
      focusNote(chosen.id);
    }
  };

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

  const finalizeBoxSelection = () => {
    if (!selectionBox) {
      return;
    }

    const normalized: Bounds = {
      x: Math.min(selectionBox.startX, selectionBox.x),
      y: Math.min(selectionBox.startY, selectionBox.y),
      w: Math.abs(selectionBox.w),
      h: Math.abs(selectionBox.h),
    };

    const hitIds = visibleNotes
      .filter((note) => boundsIntersect(normalized, { x: note.x, y: note.y, w: note.w, h: note.h }))
      .map((note) => note.id);

    syncPrimarySelection(hitIds);
    setSelectionBox(null);
  };

  const focusNote = (noteId: string) => {
    const note = renderSnapshot.notes[noteId];
    if (!note) {
      return;
    }

    const zoom = clamp(Math.max(camera.zoom, 1), 0.2, 2.5);
    setCamera({
      zoom,
      x: viewport.w / 2 - (note.x + note.w / 2) * zoom,
      y: viewport.h / 2 - (note.y + note.h / 2) * zoom,
    });
    syncPrimarySelection([noteId]);
    setFlashNote(noteId);
  };

  const exportPng = async (scope: ExportScope, pixelRatio: number) => {
    if (!stageRef.current) {
      return;
    }

    if (scope === "view") {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio });
      downloadDataUrl(`idea-wall-view-${makeDownloadId()}.png`, dataUrl);
      return;
    }

    const previousCamera = camera;
    let bounds: Bounds | null = null;

    if (scope === "whole") {
      bounds = computeContentBounds(visibleNotes, visibleZones);
    } else if (scope === "selection") {
      const selected = visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id));
      bounds = computeContentBounds(selected, []);
    } else if (scope === "zone" && ui.selectedZoneId) {
      const zone = renderSnapshot.zones[ui.selectedZoneId];
      if (zone) {
        bounds = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
      }
    }

    if (!bounds) {
      window.alert("No target content selected for export.");
      return;
    }

    setCamera(fitBoundsCamera(bounds, viewport));
    await waitForPaint();

    const dataUrl = stageRef.current.toDataURL({ pixelRatio });
    downloadDataUrl(`idea-wall-${scope}-${makeDownloadId()}.png`, dataUrl);

    setCamera(previousCamera);
  };

  const exportPdf = async (scope: ExportScope) => {
    if (!stageRef.current) {
      return;
    }

    const previousCamera = camera;
    let dataUrl = "";

    if (scope === "view") {
      dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    } else {
      let bounds: Bounds | null = null;
      if (scope === "whole") {
        bounds = computeContentBounds(visibleNotes, visibleZones);
      } else if (scope === "selection") {
        const selected = visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id));
        bounds = computeContentBounds(selected, []);
      } else if (scope === "zone" && ui.selectedZoneId) {
        const zone = renderSnapshot.zones[ui.selectedZoneId];
        if (zone) {
          bounds = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
        }
      }

      if (!bounds) {
        window.alert("No target content selected for export.");
        return;
      }
      setCamera(fitBoundsCamera(bounds, viewport));
      await waitForPaint();
      dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      setCamera(previousCamera);
    }

    const image = new Image();
    image.src = dataUrl;
    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
    });

    const orientation = image.width >= image.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "pt",
      format: [image.width, image.height],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, image.width, image.height);
    pdf.save(`idea-wall-${scope}-${makeDownloadId()}.pdf`);
  };

  const exportMarkdown = () => {
    const selectedZone = ui.selectedZoneId ? renderSnapshot.zones[ui.selectedZoneId] : undefined;
    const selectedNotes = activeSelectedNoteIds.length > 0
      ? visibleNotes.filter((note) => activeSelectedNoteIds.includes(note.id))
      : ui.selectedNoteId
      ? visibleNotes.filter((note) => note.id === ui.selectedNoteId)
      : selectedZone
        ? visibleNotes.filter((note) => zoneContainsNote(selectedZone, note))
        : visibleNotes;

    const content = notesToMarkdown(selectedNotes, zones);
    downloadTextFile(`idea-wall-${makeDownloadId()}.md`, content);
    setExportOpen(false);
  };

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
    setPresentationMode((previous) => {
      const next = !previous;
      if (next) {
        setPresentationIndex(0);
        setQuickCaptureOpen(false);
        setSearchOpen(false);
        setExportOpen(false);
      }
      return next;
    });
  };

  const toggleTimelineMode = () => {
    setTimelineMode((previous) => {
      const next = !previous;
      if (next && timelineEntries.length > 0) {
        setTimelineIndex(timelineEntries.length - 1);
      }
      if (!next) {
        setIsTimelinePlaying(false);
      }
      return next;
    });
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
          <aside
            className={`pointer-events-auto absolute z-40 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-sm transition ${
              isCompactLayout
                ? `left-2 top-7 w-[min(18rem,calc(100%-1rem))] ${leftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none"}`
                : `left-3 top-8 w-44 ${leftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none"}`
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Tools</p>
              {isCompactLayout && (
                <button type="button" onClick={() => setLeftPanelOpen(false)} className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] text-zinc-600">
                  Close
                </button>
              )}
            </div>
            <div className="space-y-1">
              <ControlTooltip label="Create note at viewport center" shortcut="N or Ctrl/Cmd+N" className="relative block">
                <button type="button" onClick={makeNoteAtViewportCenter} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtnPrimary}`} title="Create note (N or Ctrl/Cmd+N)">
                  <Icon name="note" />
                  <span>New Note</span>
                </button>
              </ControlTooltip>
              <ControlTooltip label="Create zone at viewport center" className="relative block">
                <button type="button" onClick={makeZoneAtViewportCenter} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create zone at viewport center">
                  <Icon name="zone" />
                  <span>New Zone</span>
                </button>
              </ControlTooltip>
              <ControlTooltip label="Toggle box selection mode" className="relative block">
                <button
                  type="button"
                  onClick={() => setBoxSelectMode((value) => !value)}
                  className={`w-full justify-start ${boxSelectMode ? toolbarBtnActive : toolbarBtn}`}
                  title="Toggle box selection mode"
                >
                  <Icon name="box" />
                  <span>Box Select</span>
                </button>
              </ControlTooltip>
              <ControlTooltip label="Start linking from selected note" shortcut="Ctrl/Cmd+L" className="relative block">
                <button
                  type="button"
                  onClick={() => {
                    if (isTimeLocked || !ui.selectedNoteId) {
                      return;
                    }
                    setLinkingFromNote(ui.selectedNoteId);
                  }}
                  disabled={!ui.selectedNoteId || isTimeLocked}
                  className={`w-full justify-start ${ui.linkingFromNoteId ? toolbarBtnActive : toolbarBtn}`}
                  title="Start linking (Ctrl/Cmd+L)"
                >
                  <Icon name="link" />
                  <span>{ui.linkingFromNoteId ? "Pick Link Target" : "Start Link"}</span>
                </button>
              </ControlTooltip>
              <ControlTooltip label="Pick link type" className="relative block">
                <select value={ui.linkType} onChange={(event) => setLinkType(event.target.value as LinkType)} className={`w-full ${toolbarSelect}`} title="Pick link type">
                  {LINK_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ControlTooltip>
              <ControlTooltip label="Toggle automatic cluster outlines" className="relative block">
                <button
                  type="button"
                  onClick={() => setShowClusters(!ui.showClusters)}
                  className={`w-full justify-start ${ui.showClusters ? toolbarBtnActive : toolbarBtn}`}
                  title="Toggle cluster outlines"
                >
                  <Icon name="cluster" />
                  <span>Detect Clusters</span>
                </button>
              </ControlTooltip>
            </div>
          </aside>
        )}

        <Stage
          ref={(node) => {
            stageRef.current = node;
          }}
          width={viewport.w}
          height={viewport.h}
          x={camera.x}
          y={camera.y}
          scaleX={camera.zoom}
          scaleY={camera.zoom}
          draggable={isSpaceDown || isMiddleDragging || (isLeftCanvasDragging && !boxSelectMode)}
          onMouseDown={(event) => {
            const stage = event.target.getStage();
            if (event.evt.button === 1) {
              setIsMiddleDragging(true);
            }

            const clickedOnEmpty = event.target === stage;
            if (clickedOnEmpty) {
              if (event.evt.button === 0) {
                if (boxSelectMode && !isTimeLocked) {
                  const pointer = stage?.getPointerPosition();
                  if (pointer) {
                    const start = toWorldPoint(pointer.x, pointer.y, camera);
                    setSelectionBox({
                      startX: start.x,
                      startY: start.y,
                      x: start.x,
                      y: start.y,
                      w: 0,
                      h: 0,
                    });
                  }
                } else {
                  setIsLeftCanvasDragging(true);
                  stage?.startDrag();
                }
              }
              resetSelection();
              clearNoteSelection();
              setEditing(null);
            }
          }}
          onMouseMove={(event) => {
            if (!selectionBox) {
              return;
            }
            const stage = event.target.getStage();
            const pointer = stage?.getPointerPosition();
            if (!pointer) {
              return;
            }
            const current = toWorldPoint(pointer.x, pointer.y, camera);
            setSelectionBox((previous) =>
              previous
                ? {
                    ...previous,
                    x: current.x,
                    y: current.y,
                    w: current.x - previous.startX,
                    h: current.y - previous.startY,
                  }
                : previous,
            );
          }}
          onDragEnd={(event) => {
            const stage = event.target.getStage();
            if (!stage || event.target !== stage) {
              return;
            }
            setCamera({ ...camera, x: stage.x(), y: stage.y() });
            setIsLeftCanvasDragging(false);
            setIsMiddleDragging(false);
          }}
          onWheel={(event) => {
            event.evt.preventDefault();

            const stage = event.target.getStage();
            if (!stage) {
              return;
            }

            const pointer = stage.getPointerPosition();
            if (!pointer) {
              return;
            }

            if (event.evt.ctrlKey || event.evt.metaKey) {
              const oldScale = camera.zoom;
              const scaleBy = 1.06;
              const direction = event.evt.deltaY > 0 ? -1 : 1;
              const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
              const zoom = clamp(newScale, 0.2, 2.8);

              const mousePoint = {
                x: (pointer.x - camera.x) / oldScale,
                y: (pointer.y - camera.y) / oldScale,
              };

              setCamera({
                zoom,
                x: pointer.x - mousePoint.x * zoom,
                y: pointer.y - mousePoint.y * zoom,
              });
            } else {
              setCamera({
                ...camera,
                x: camera.x - event.evt.deltaX,
                y: camera.y - event.evt.deltaY,
              });
            }
          }}
        >
          <Layer>
            {visibleLinks.map((link) => {
              const from = renderSnapshot.notes[link.fromNoteId];
              const to = renderSnapshot.notes[link.toNoteId];
              if (!from || !to) {
                return null;
              }

              const geometry = linkPoints(from, to);
              const isSelected = ui.selectedLinkId === link.id;
              const inPath = pathLinkIds.has(link.id);
              const showDimmed = Boolean(ui.selectedNoteId) && !inPath;
              const stroke = linkColorByType[link.type];
              const opacity = isSelected ? 1 : showDimmed ? 0.15 : 0.78;

              return (
                <Group
                  key={link.id}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setLinkMenu((previous) => ({ ...previous, open: false }));
                    clearNoteSelection();
                    selectLink(link.id);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    setLinkMenu((previous) => ({ ...previous, open: false }));
                    clearNoteSelection();
                    selectLink(link.id);
                  }}
                  onContextMenu={(event) => {
                    event.evt.preventDefault();
                    event.cancelBubble = true;
                    clearNoteSelection();
                    selectLink(link.id);
                    setLinkMenu({
                      open: true,
                      x: event.evt.clientX,
                      y: event.evt.clientY,
                      linkId: link.id,
                    });
                  }}
                >
                  <Arrow
                    points={geometry.points}
                    pointerLength={11}
                    pointerWidth={10}
                    stroke={stroke}
                    fill={stroke}
                    dash={linkStrokeByType[link.type]}
                    strokeWidth={isSelected ? 3.2 : inPath ? 2.6 : 2}
                    opacity={opacity}
                    lineCap="round"
                    lineJoin="round"
                  />
                  <Text
                    x={geometry.mid.x - 48}
                    y={geometry.mid.y - 16}
                    width={96}
                    align="center"
                    fontSize={11}
                    fontStyle="bold"
                    fill={stroke}
                    text={link.label}
                    opacity={opacity}
                  />
                </Group>
              );
            })}

            {visibleZones.map((zone) => {
              const isSelected = ui.selectedZoneId === zone.id;
              return (
                <Group
                  key={zone.id}
                  ref={(node) => {
                    zoneNodeRefs.current[zone.id] = node;
                  }}
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  draggable={!isTimeLocked}
                  onClick={() => {
                    clearNoteSelection();
                    selectZone(zone.id);
                    if (zone.groupId) {
                      selectGroup(zone.groupId);
                    }
                  }}
                  onTap={() => {
                    clearNoteSelection();
                    selectZone(zone.id);
                    if (zone.groupId) {
                      selectGroup(zone.groupId);
                    }
                  }}
                  onDragEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    moveZone(zone.id, event.target.x(), event.target.y());
                  }}
                  onTransformEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const node = event.target;
                    const width = Math.max(ZONE_DEFAULTS.minWidth, node.width() * node.scaleX());
                    const height = Math.max(ZONE_DEFAULTS.minHeight, node.height() * node.scaleY());
                    node.scaleX(1);
                    node.scaleY(1);
                    updateZone(zone.id, { x: node.x(), y: node.y(), w: width, h: height });
                  }}
                >
                  <Rect
                    width={zone.w}
                    height={zone.h}
                    cornerRadius={18}
                    fill={zone.color}
                    opacity={0.38}
                    stroke={isSelected ? "#111827" : "#a1a1aa"}
                    strokeWidth={isSelected ? 2 : 1}
                    dash={[8, 6]}
                  />
                  <Rect width={zone.w} height={34} cornerRadius={18} fill="rgba(255,255,255,0.6)" />
                  <Text x={12} y={8} fontSize={14} fontStyle="bold" text={zone.label || "Zone"} fill="#1f2937" />
                </Group>
              );
            })}

            {visibleNotes.map((note) => {
              const isSelected = activeSelectedNoteIds.includes(note.id) || ui.selectedNoteId === note.id;
              const isFlashing = ui.flashNoteId === note.id;
              const isHovered = hoveredNoteId === note.id;
              const isDragging = draggingNoteId === note.id;
              const draft = resizingNoteDrafts[note.id];
              const noteView = draft ? { ...note, ...draft } : note;
              const noteTextStyle = getNoteTextStyle(noteView.textSize);
              const visibleTagCount = noteView.w < 180 ? 1 : noteView.w < 240 ? 2 : 3;
              const noteTags = noteView.tags.slice(0, visibleTagCount);
              const overflowTags = Math.max(0, note.tags.length - noteTags.length);
              const tagPalette = noteTagChipPalette(noteView.color);

              return (
                <Group
                  key={note.id}
                  ref={(node) => {
                    noteNodeRefs.current[note.id] = node;
                  }}
                  x={noteView.x}
                  y={noteView.y}
                  width={noteView.w}
                  height={noteView.h}
                  draggable={!isTimeLocked}
                  onMouseEnter={() => setHoveredNoteId(note.id)}
                  onMouseLeave={() => setHoveredNoteId((previous) => (previous === note.id ? undefined : previous))}
                  onClick={(event) => {
                    if (isTimeLocked) {
                      selectSingleNote(note.id);
                      return;
                    }
                    if (ui.linkingFromNoteId && ui.linkingFromNoteId !== note.id) {
                      createLink(ui.linkingFromNoteId, note.id, ui.linkType);
                      setLinkingFromNote(undefined);
                      return;
                    }
                    if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                      toggleSelectNote(note.id);
                    } else {
                      selectSingleNote(note.id);
                    }
                    if (editing?.id !== note.id) {
                      setEditing(null);
                    }
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      selectSingleNote(note.id);
                      return;
                    }
                    if (ui.linkingFromNoteId && ui.linkingFromNoteId !== note.id) {
                      createLink(ui.linkingFromNoteId, note.id, ui.linkType);
                      setLinkingFromNote(undefined);
                      return;
                    }
                    if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                      toggleSelectNote(note.id);
                    } else {
                      selectSingleNote(note.id);
                    }
                  }}
                  onDblClick={() => {
                    if (isTimeLocked) {
                      return;
                    }
                    selectSingleNote(note.id);
                    openEditor(note.id, note.text);
                  }}
                  onDragStart={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    setDraggingNoteId(note.id);
                    setGuideLines({});
                    if (!activeSelectedNoteIds.includes(note.id)) {
                      syncPrimarySelection([note.id]);
                    }
                    const activeIds = activeSelectedNoteIds.includes(note.id) ? activeSelectedNoteIds : [note.id];
                    dragSingleStartRef.current = {
                      id: note.id,
                      x: note.x,
                      y: note.y,
                      altClone: event.evt.altKey,
                    };
                    if (activeIds.length > 1) {
                      dragSelectionStartRef.current = Object.fromEntries(
                        activeIds
                          .map((id) => renderSnapshot.notes[id])
                          .filter((entry): entry is Note => Boolean(entry))
                          .map((entry) => [entry.id, { x: entry.x, y: entry.y }]),
                      );
                      dragAnchorRef.current = { id: note.id, x: event.target.x(), y: event.target.y() };
                    }
                  }}
                  onDragMove={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const start = dragSingleStartRef.current;
                    const pointerX = event.target.x();
                    const pointerY = event.target.y();
                    let candidateX = pointerX;
                    let candidateY = pointerY;
                    if (start && event.evt.shiftKey) {
                      const dx = Math.abs(pointerX - start.x);
                      const dy = Math.abs(pointerY - start.y);
                      if (dx > dy) {
                        candidateY = start.y;
                      } else {
                        candidateX = start.x;
                      }
                    }
                    const snapped = resolveSnappedPosition(note, candidateX, candidateY);
                    event.target.position(snapped);

                    const anchor = dragAnchorRef.current;
                    const startMap = dragSelectionStartRef.current;
                    if (!anchor || !startMap) {
                      return;
                    }
                    const dx = snapped.x - anchor.x;
                    const dy = snapped.y - anchor.y;
                    let movedPeers = false;
                    for (const [id, start] of Object.entries(startMap)) {
                      if (id === note.id) {
                        continue;
                      }
                      const peerNode = noteNodeRefs.current[id];
                      if (!peerNode) {
                        continue;
                      }
                      peerNode.position({ x: start.x + dx, y: start.y + dy });
                      movedPeers = true;
                    }
                    if (movedPeers) {
                      event.target.getLayer()?.batchDraw();
                    }
                  }}
                  onDragEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const snapped = resolveSnappedPosition(note, event.target.x(), event.target.y());
                    event.target.position(snapped);
                    const anchor = dragAnchorRef.current;
                    const startMap = dragSelectionStartRef.current;
                    if (anchor && startMap) {
                      runHistoryGroup(() => {
                        moveNote(note.id, snapped.x, snapped.y);
                        const dx = snapped.x - anchor.x;
                        const dy = snapped.y - anchor.y;
                        for (const [id, start] of Object.entries(startMap)) {
                          if (id === note.id) {
                            continue;
                          }
                          updateNote(id, { x: start.x + dx, y: start.y + dy });
                        }
                      });
                    } else {
                      moveNote(note.id, snapped.x, snapped.y);
                    }
                    const dragStart = dragSingleStartRef.current;
                    if (dragStart?.id === note.id && dragStart.altClone) {
                      updateNote(note.id, { x: dragStart.x, y: dragStart.y });
                      duplicateNoteAt(note.id, snapped.x, snapped.y);
                      syncPrimarySelection([note.id]);
                    }
                    setDraggingNoteId(undefined);
                    setGuideLines({});
                    dragSelectionStartRef.current = null;
                    dragAnchorRef.current = null;
                    dragSingleStartRef.current = null;
                  }}
                  onTransform={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const node = event.target;
                    const width = Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
                    const height = Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
                    node.scaleX(1);
                    node.scaleY(1);
                    setResizingNoteDrafts((previous) => ({
                      ...previous,
                      [note.id]: {
                        x: node.x(),
                        y: node.y(),
                        w: width,
                        h: height,
                      },
                    }));
                  }}
                  onTransformEnd={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    const node = event.target;
                    const draftEntry = resizingNoteDrafts[note.id];
                    const width = draftEntry?.w ?? Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
                    const height = draftEntry?.h ?? Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
                    const x = draftEntry?.x ?? node.x();
                    const y = draftEntry?.y ?? node.y();
                    node.scaleX(1);
                    node.scaleY(1);
                    updateNote(note.id, { x, y, w: width, h: height });
                    setResizingNoteDrafts((previous) => {
                      if (!previous[note.id]) {
                        return previous;
                      }
                      const next = { ...previous };
                      delete next[note.id];
                      return next;
                    });
                  }}
                >
                  <Rect
                    width={noteView.w}
                    height={noteView.h}
                    cornerRadius={14}
                    fill={note.color}
                    stroke={isSelected ? "#0f172a" : isHovered ? "#52525b" : "#d4d4d8"}
                    strokeWidth={isSelected ? 2.4 : isHovered ? 1.4 : 1}
                    shadowColor="#101010"
                    shadowBlur={isFlashing ? 30 : isDragging ? 26 : 12}
                    shadowOpacity={isFlashing ? 0.36 : isDragging ? 0.28 : 0.14}
                    shadowOffsetY={isDragging ? 7 : 3}
                  />
                  {showHeatmap && (
                    <Rect
                      width={noteView.w}
                      height={noteView.h}
                      cornerRadius={14}
                      fill="#ef4444"
                      opacity={0.08 + recencyIntensity(noteView.updatedAt, activeTimelineEntry?.ts ?? wallClockTs) * 0.35}
                    />
                  )}
                  <Text
                    x={12}
                    y={12}
                    width={Math.max(0, noteView.w - 24)}
                    height={Math.max(0, noteView.h - 56)}
                    fontSize={noteTextStyle.fontSize}
                    fill="#1f2937"
                    lineHeight={noteTextStyle.lineHeight}
                    text={truncateNoteText(noteView.text, noteView) || "Double-click or press Enter to edit"}
                    onClick={(event) => {
                      if (isTimeLocked) {
                        return;
                      }
                      event.cancelBubble = true;
                      selectSingleNote(note.id);
                      openEditor(note.id, noteView.text);
                    }}
                  />
                  {layoutPrefs.showNoteTags &&
                    noteTags.map((tag, index) => (
                      <Group key={`${note.id}-tag-${tag}`}>
                        <Rect
                          x={12 + index * 64}
                          y={Math.max(10, noteView.h - 25)}
                          width={60}
                          height={16}
                          cornerRadius={8}
                          fill={tagPalette.bg}
                          stroke={tagPalette.border}
                          strokeWidth={0.8}
                        />
                        <Text
                          x={16 + index * 64}
                          y={Math.max(12, noteView.h - 23)}
                          width={52}
                          fontSize={10}
                          fill={tagPalette.text}
                          text={`#${tag}`}
                          wrap="none"
                          ellipsis
                        />
                      </Group>
                    ))}
                  {layoutPrefs.showNoteTags && overflowTags > 0 && (
                    <Text
                      x={Math.max(12, noteView.w - 36)}
                      y={Math.max(12, noteView.h - 23)}
                      width={24}
                      align="right"
                      fontSize={10}
                      fill={tagPalette.text}
                      text={`+${overflowTags}`}
                    />
                  )}
                </Group>
              );
            })}

            {ui.showClusters &&
              clusterBounds.map((cluster, index) => (
                <Rect
                  key={`cluster-${index}`}
                  x={cluster.x}
                  y={cluster.y}
                  width={cluster.w}
                  height={cluster.h}
                  cornerRadius={20}
                  stroke="#fb923c"
                  strokeWidth={2}
                  dash={[10, 8]}
                />
              ))}

            {showAutoTagGroups &&
              autoTagGroups.map((group) => {
                const color = tagGroupColor(group.tag);
                const label = autoTagLabelLayout[group.tag] ?? { x: group.bounds.x + 10, y: group.bounds.y + 8 };
                return (
                  <Group key={`tag-group-${group.tag}`}>
                    <Rect
                      x={group.bounds.x}
                      y={group.bounds.y}
                      width={group.bounds.w}
                      height={group.bounds.h}
                      cornerRadius={18}
                      stroke={color}
                      strokeWidth={1.8}
                      dash={[6, 5]}
                      opacity={0.55}
                    />
                    <Text
                      x={label.x}
                      y={label.y}
                      fontSize={11}
                      fontStyle="bold"
                      fill={color}
                      text={`#${group.tag} (${group.noteIds.length})`}
                    />
                  </Group>
                );
              })}

            {selectionBox && (
              <Rect
                x={Math.min(selectionBox.startX, selectionBox.x)}
                y={Math.min(selectionBox.startY, selectionBox.y)}
                width={Math.abs(selectionBox.w)}
                height={Math.abs(selectionBox.h)}
                fill="rgba(37,99,235,0.15)"
                stroke="#2563eb"
                strokeWidth={1.2}
                dash={[4, 3]}
              />
            )}

            {guideLines.vertical && (
              <Group>
                <Line
                  points={[guideLines.vertical.x, guideLines.vertical.y1, guideLines.vertical.x, guideLines.vertical.y2]}
                  stroke="#0ea5e9"
                  strokeWidth={1.2}
                  dash={[6, 4]}
                />
                {typeof guideLines.vertical.distance === "number" && (
                  <Text
                    x={guideLines.vertical.x + 6}
                    y={guideLines.vertical.y1 + 14}
                    fontSize={10}
                    fill="#0369a1"
                    text={`${Math.round(guideLines.vertical.distance)}px`}
                  />
                )}
              </Group>
            )}

            {guideLines.horizontal && (
              <Group>
                <Line
                  points={[guideLines.horizontal.x1, guideLines.horizontal.y, guideLines.horizontal.x2, guideLines.horizontal.y]}
                  stroke="#0ea5e9"
                  strokeWidth={1.2}
                  dash={[6, 4]}
                />
                {typeof guideLines.horizontal.distance === "number" && (
                  <Text
                    x={guideLines.horizontal.x1 + 10}
                    y={guideLines.horizontal.y + 6}
                    fontSize={10}
                    fill="#0369a1"
                    text={`${Math.round(guideLines.horizontal.distance)}px`}
                  />
                )}
              </Group>
            )}

            <Transformer
              ref={(node) => {
                noteTransformerRef.current = node;
              }}
              rotateEnabled={false}
              borderStroke="#111827"
              anchorFill="#111827"
              anchorSize={isCompactLayout ? 11 : 9}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < NOTE_DEFAULTS.minWidth || newBox.height < NOTE_DEFAULTS.minHeight) {
                  return oldBox;
                }
                return newBox;
              }}
            />

            <Transformer
              ref={(node) => {
                zoneTransformerRef.current = node;
              }}
              rotateEnabled={false}
              borderStroke="#334155"
              anchorFill="#334155"
              anchorSize={isCompactLayout ? 11 : 9}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < ZONE_DEFAULTS.minWidth || newBox.height < ZONE_DEFAULTS.minHeight) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>

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

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Templates</p>
              <div className="mt-2 flex items-center gap-2">
                <select value={ui.templateType} onChange={(event) => setTemplateType(event.target.value as TemplateType)} className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs">
                  {TEMPLATE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={applySelectedTemplate} disabled={isTimeLocked} className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-45">
                  Apply
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Selection Tags</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTagToSelectedNote();
                    }
                  }}
                  placeholder={activeSelectedNoteIds.length > 0 || ui.selectedNoteId ? "add-tag" : "select note first"}
                  disabled={activeSelectedNoteIds.length === 0 && !ui.selectedNoteId ? true : isTimeLocked}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={addTagToSelectedNote}
                  disabled={activeSelectedNoteIds.length === 0 && !ui.selectedNoteId ? true : isTimeLocked}
                  className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 max-h-28 overflow-auto pr-1">
                <div className="flex flex-wrap gap-1">
                {displayedTags.length === 0 && <span className="text-[11px] text-zinc-500">No tags on current selection.</span>}
                {displayedTags.map((tag) => (
                  <button
                    key={`detail-tag-${tag}`}
                    type="button"
                    onClick={() => removeTagFromSelectedNote(tag)}
                    disabled={isTimeLocked}
                    className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
                    title="Remove tag"
                  >
                    #{tag}
                  </button>
                ))}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <button
                type="button"
                onClick={() => toggleDetailsSection("history")}
                className="flex w-full items-center justify-between text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">History</p>
                <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.history ? "Hide" : "Show"}</span>
              </button>
              {detailsSectionsOpen.history && (
                <>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-700">
                    <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Timeline entries: {timelineEntries.length}</div>
                    <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Visible notes: {visibleNotes.length}</div>
                    <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Undo depth: {historyUndoDepth}</div>
                    <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Redo depth: {historyRedoDepth}</div>
                    <div className="col-span-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                      Latest edit:{" "}
                      {notes.length === 0
                        ? "n/a"
                        : new Date(Math.max(...notes.map((note) => note.updatedAt))).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={jumpToStaleNote} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
                      Jump Stale
                    </button>
                    <button type="button" onClick={jumpToHighPriorityNote} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
                      Jump Priority
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hasHistory = historyUndoDepth > 0 || historyRedoDepth > 0;
                        if (!hasHistory) {
                          return;
                        }
                        const ok = window.confirm("Clear undo/redo history? This cannot be undone.");
                        if (ok) {
                          clearHistory();
                        }
                      }}
                      disabled={historyUndoDepth === 0 && historyRedoDepth === 0}
                      className="rounded border border-rose-300 bg-white px-2 py-1 text-[11px] text-rose-700 disabled:opacity-50"
                    >
                      Clear History
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <button
                type="button"
                onClick={() => toggleDetailsSection("recall")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-semibold text-zinc-900">Recall</h3>
                <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.recall ? "Hide" : "Show"}</span>
              </button>
              {detailsSectionsOpen.recall && (
                <>
                  <p className="mt-1 text-xs text-zinc-600">Filter notes by query, zone, tag, and recency. Save frequent searches.</p>
                  <input
                    value={recallQuery}
                    onChange={(event) => setRecallQuery(event.target.value)}
                    placeholder="Find text or #tag..."
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <select
                      value={recallZoneId}
                      onChange={(event) => setRecallZoneId(event.target.value)}
                      className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                    >
                      <option value="">All zones</option>
                      {visibleZones.map((zone) => (
                        <option key={`filter-zone-${zone.id}`} value={zone.id}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={recallTag}
                      onChange={(event) => setRecallTag(event.target.value)}
                      className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                    >
                      <option value="">All tags</option>
                      {availableRecallTags.map((tag) => (
                        <option key={`filter-tag-${tag}`} value={tag}>
                          #{tag}
                        </option>
                      ))}
                    </select>
                    <select
                      value={recallDateFilter}
                      onChange={(event) => setRecallDateFilter(event.target.value as RecallDateFilter)}
                      className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                    >
                      <option value="all">All dates</option>
                      <option value="today">Today</option>
                      <option value="7d">Last 7d</option>
                      <option value="30d">Last 30d</option>
                    </select>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveCurrentRecallSearch}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]"
                    >
                      Save Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecallQuery("");
                        setRecallZoneId("");
                        setRecallTag("");
                        setRecallDateFilter("all");
                      }}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]"
                    >
                      Clear Filters
                    </button>
                  </div>
                  {savedRecallSearches.length > 0 && (
                    <div className="mt-2 max-h-24 space-y-1 overflow-auto pr-1">
                      {savedRecallSearches.map((item) => (
                        <div key={item.id} className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-1">
                          <button
                            type="button"
                            onClick={() => applySavedRecallSearch(item)}
                            className="min-w-0 flex-1 truncate text-left text-[11px] text-zinc-800"
                          >
                            {item.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSavedRecallSearches((previous) => previous.filter((entry) => entry.id !== item.id))}
                            className="text-[10px] text-red-700"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <button
                type="button"
                onClick={() => toggleDetailsSection("zoneGroups")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-semibold text-zinc-900">Zone Groups</h3>
                <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.zoneGroups ? "Hide" : "Show"}</span>
              </button>
              {detailsSectionsOpen.zoneGroups && (
                <>
                  <p className="mt-1 text-xs text-zinc-600">Collapse groups to hide grouped zones and their notes.</p>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={groupLabelInput}
                      onChange={(event) => setGroupLabelInput(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                      placeholder="Group name"
                    />
                    <button
                      type="button"
                      onClick={createGroupFromSelectedZone}
                      disabled={!ui.selectedZoneId || isTimeLocked}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs disabled:opacity-45"
                    >
                      Group Zone
                    </button>
                  </div>

                  {selectedZone && (
                    <div className="mt-2">
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        Selected Zone Group
                      </label>
                      <select
                        value={selectedZone.groupId ?? ""}
                        onChange={(event) => {
                          if (isTimeLocked) {
                            return;
                          }
                          assignZoneToGroup(selectedZone.id, event.target.value || undefined);
                        }}
                        disabled={isTimeLocked}
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                      >
                        <option value="">No group</option>
                        {zoneGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
                    {zoneGroups.length === 0 && <p className="text-xs text-zinc-500">No groups yet.</p>}
                    {zoneGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`rounded-lg border px-2 py-2 ${
                          selectedGroup?.id === group.id ? "border-zinc-700 bg-zinc-50" : "border-zinc-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isTimeLocked) {
                                return;
                              }
                              selectGroup(group.id);
                              toggleGroupCollapse(group.id);
                            }}
                            disabled={isTimeLocked}
                            className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-[10px]"
                          >
                            {group.collapsed ? "Expand" : "Collapse"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              clearNoteSelection();
                              selectGroup(group.id);
                            }}
                            className="min-w-0 flex-1 truncate text-left text-xs font-medium text-zinc-800"
                          >
                            {group.label}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isTimeLocked) {
                                return;
                              }
                              deleteGroup(group.id);
                            }}
                            disabled={isTimeLocked}
                            className="text-[10px] text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {group.zoneIds.length} zones {group.collapsed ? "(collapsed)" : "(expanded)"}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <button
                type="button"
                onClick={() => toggleDetailsSection("tagGroups")}
                className="flex w-full items-center justify-between text-left"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Tag Groups (Auto)</h4>
                <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.tagGroups ? "Hide" : "Show"}</span>
              </button>
              {detailsSectionsOpen.tagGroups && (
                <>
                  <div className="mb-1 mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-600">Auto-detected from shared tags.</span>
                    <button
                      type="button"
                      onClick={() => setShowAutoTagGroups((value) => !value)}
                      className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px]"
                    >
                      {showAutoTagGroups ? "Hide" : "Show"}
                    </button>
                  </div>
                  {autoTagGroups.length === 0 && <p className="text-xs text-zinc-500">No auto groups yet (need 2+ notes per tag).</p>}
                  {autoTagGroups.slice(0, 8).map((group) => (
                    <button
                      key={`panel-tag-${group.tag}`}
                      type="button"
                      onClick={() => focusBounds(group.bounds)}
                      className="mt-1 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-left text-xs hover:bg-zinc-50"
                    >
                      <span className="truncate text-zinc-800">#{group.tag}</span>
                      <span className="text-zinc-500">{group.noteIds.length} notes</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </WallDetailsPanel>
        )}

        {showHeatmap && (
          <div className="pointer-events-auto absolute bottom-3 right-3 z-30">
            <CalendarHeatmap timestamps={timelineEntries.map((entry) => entry.ts)} onSelectDay={jumpToTimelineDay} />
          </div>
        )}

        {timelineMode && timelineEntries.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(780px,95%)] -translate-x-1/2 rounded-2xl border border-zinc-300 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimelinePlaying((value) => !value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium"
              >
                {isTimelinePlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => setTimelineIndex(0)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => setTimelineIndex(timelineEntries.length - 1)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              >
                Latest
              </button>
              <span className="ml-auto text-xs text-zinc-600">
                {new Date(timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)].ts).toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, timelineEntries.length - 1)}
              step={1}
              value={Math.min(timelineIndex, timelineEntries.length - 1)}
              onChange={(event) => {
                setIsTimelinePlaying(false);
                setTimelineIndex(Number(event.target.value));
              }}
              className="mt-3 w-full"
            />
          </div>
        )}

        {presentationMode && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-zinc-300 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setPresentationIndex((previous) => Math.max(previous - 1, 0))}
              className="rounded border border-zinc-300 px-2 py-1 text-xs"
            >
              Prev
            </button>
            <span className="text-xs text-zinc-700">
              {Math.min(presentationIndex + 1, Math.max(1, presentationNotes.length))} / {Math.max(1, presentationNotes.length)}
            </span>
            <button
              type="button"
              onClick={() => setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, presentationNotes.length - 1)))}
              className="rounded border border-zinc-300 px-2 py-1 text-xs"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setPresentationMode(false)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs"
            >
              Exit
            </button>
          </div>
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
