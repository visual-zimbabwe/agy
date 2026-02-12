"use client";

import { type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect } from "react-konva";
import type Konva from "konva";

import type { CommandPaletteCommand } from "@/components/SearchPalette";
import type { DetailsSectionState, RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { useWallActions } from "@/components/wall/useWallActions";
import { WallDetailsSidebar } from "@/components/wall/WallDetailsSidebar";
import { WallFloatingUi } from "@/components/wall/WallFloatingUi";
import { WallGlobalModals } from "@/components/wall/WallGlobalModals";
import { WallHeaderBar } from "@/components/wall/WallHeaderBar";
import {
  backupReminderCadenceStorageKey,
  backupReminderLastPromptStorageKey,
  compactPanelBreakpoint,
  downloadDataUrl,
  downloadJsonFile,
  downloadTextFile,
  dragSnapThreshold,
  fitBoundsCamera,
  getNoteTextStyle,
  layoutPrefsStorageKey,
  linkColorByType,
  linkPoints,
  linkStrokeByType,
  makeDownloadId,
  noteTagChipPalette,
  recallStorageKey,
  recencyIntensity,
  spatialPrefsStorageKey,
  tagGroupColor,
  toScreenPoint,
  toWorldPoint,
  truncateNoteText,
  waitForPaint,
  zoneContainsNote,
} from "@/components/wall/wall-canvas-helpers";
import { WallLinksZonesLayer } from "@/components/wall/WallLinksZonesLayer";
import { WallDotMatrixLayer } from "@/components/wall/WallDotMatrixLayer";
import { WallNotesLayer } from "@/components/wall/WallNotesLayer";
import { WallOverlaysLayer } from "@/components/wall/WallOverlaysLayer";
import { useWallCameraNavigation } from "@/components/wall/useWallCameraNavigation";
import { useWallExport } from "@/components/wall/useWallExport";
import { useWallSelection } from "@/components/wall/useWallSelection";
import { useWallSnapping } from "@/components/wall/useWallSnapping";
import { WallStage } from "@/components/wall/WallStage";
import { useWallDerivedData } from "@/components/wall/useWallDerivedData";
import { useWallPersistenceEffects } from "@/components/wall/useWallPersistenceEffects";
import { useWallBackupActions } from "@/components/wall/useWallBackupActions";
import { useWallTelemetry } from "@/components/wall/useWallTelemetry";
import { useWallTimeline } from "@/components/wall/useWallTimeline";
import { useWallUiActions } from "@/components/wall/useWallUiActions";
import { useWallViewState } from "@/components/wall/useWallViewState";
import { WallToolsPanel } from "@/components/wall/WallToolsPanel";
import { useWallKeyboard } from "@/components/wall/useWallKeyboard";
import { useWallZoomControls } from "@/components/wall/useWallZoomControls";
import {
  toolbarBtn,
  toolbarBtnActive,
  toolbarBtnCompact,
  toolbarBtnPrimary,
  toolbarDivider,
  toolbarLabel,
  toolbarSelect,
  toolbarSurface,
} from "@/components/wall/wallChromeClasses";
import {
  addNotesToNoteGroup,
  applyTemplate,
  assignZoneToGroup,
  createNote,
  createNoteGroup,
  createLink,
  createZone,
  createZoneGroup,
  deleteNoteGroup,
  deleteGroup,
  deleteLink,
  deleteNote,
  deleteZone,
  duplicateNote,
  duplicateNoteAt,
  moveNote,
  removeNotesFromNoteGroup,
  setAllNoteGroupsCollapsed,
  moveZone,
  setAllGroupsCollapsed,
  toggleNoteGroupCollapse,
  toggleGroupCollapse,
  updateNote,
  updateLinkType,
  updateZone,
} from "@/features/wall/commands";
import { LINK_TYPES, NOTE_COLORS, NOTE_DEFAULTS, ZONE_DEFAULTS } from "@/features/wall/constants";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import type { TimelineEntry } from "@/features/wall/storage";
import type { PersistedWallState } from "@/features/wall/types";
import { decodeSnapshotFromUrl, readSnapshotParamFromLocation } from "@/lib/publish";
import { parseTaggedText } from "@/lib/tag-utils";
import { computeContentBounds, notesToMarkdown } from "@/lib/wall-utils";

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

type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };
type LayoutPreferenceKey = "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags";
type LayoutPreferences = Record<LayoutPreferenceKey, boolean>;
type SpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  dotGridSpacing: number;
};
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type NoteConvertType = "quote" | "principle" | "checklist" | "heading" | "group";

const convertNoteText = (text: string, type: NoteConvertType) => {
  const lines = text.split("\n");
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);

  if (type === "quote") {
    if (nonEmpty.length === 0) {
      return "> ";
    }
    return nonEmpty.map((line) => (line.startsWith(">") ? line : `> ${line}`)).join("\n");
  }

  if (type === "principle") {
    const first = nonEmpty[0] ?? "";
    if (!first) {
      return "Principle: ";
    }
    const normalized = first.replace(/^Principle:\s*/i, "");
    const rest = nonEmpty.slice(1).join("\n");
    return rest ? `Principle: ${normalized}\n${rest}` : `Principle: ${normalized}`;
  }

  if (type === "checklist") {
    if (nonEmpty.length === 0) {
      return "- [ ] ";
    }
    return nonEmpty
      .map((line) => {
        const stripped = line.replace(/^- \[(?: |x|X)\]\s*/, "").replace(/^- /, "");
        return `- [ ] ${stripped}`;
      })
      .join("\n");
  }

  if (type === "heading") {
    const first = nonEmpty[0] ?? "";
    if (!first) {
      return "# ";
    }
    const normalized = first.replace(/^#+\s*/, "");
    const rest = nonEmpty.slice(1).join("\n");
    return rest ? `# ${normalized}\n${rest}` : `# ${normalized}`;
  }

  const first = nonEmpty[0] ?? "";
  if (!first) {
    return "Group: ";
  }
  const normalized = first.replace(/^Group:\s*/i, "");
  const bodyLines = nonEmpty.slice(1).map((line) => `- ${line.replace(/^- /, "")}`);
  return [`Group: ${normalized}`, ...bodyLines].join("\n");
};

const flashDurationMs = 1200;
const defaultLayoutPrefs: LayoutPreferences = {
  showToolsPanel: true,
  showDetailsPanel: true,
  showContextBar: false,
  showNoteTags: false,
};
const defaultSpatialPrefs: SpatialPreferences = {
  showDotMatrix: false,
  snapToGuides: true,
  snapToGrid: false,
  dotGridSpacing: 32,
};

type WallCanvasProps = {
  userEmail?: string;
};

export const WallCanvas = ({ userEmail }: WallCanvasProps) => {
  const notesMap = useWallStore((state) => state.notes);
  const zonesMap = useWallStore((state) => state.zones);
  const zoneGroupsMap = useWallStore((state) => state.zoneGroups);
  const noteGroupsMap = useWallStore((state) => state.noteGroups);
  const linksMap = useWallStore((state) => state.links);
  const camera = useWallStore((state) => state.camera);
  const ui = useWallStore((state) => state.ui);
  const hydrated = useWallStore((state) => state.hydrated);

  const hydrate = useWallStore((state) => state.hydrate);
  const setCamera = useWallStore((state) => state.setCamera);
  const selectNote = useWallStore((state) => state.selectNote);
  const selectZone = useWallStore((state) => state.selectZone);
  const selectGroup = useWallStore((state) => state.selectGroup);
  const selectNoteGroup = useWallStore((state) => state.selectNoteGroup);
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
  const [noteGroupLabelInput, setNoteGroupLabelInput] = useState("New Note Group");
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
  const [savedRecallSearches, setSavedRecallSearches] = useState<SavedRecallSearch[]>([]);
  const [layoutPrefs, setLayoutPrefs] = useState<LayoutPreferences>(defaultLayoutPrefs);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [spatialPrefs, setSpatialPrefs] = useState<SpatialPreferences>(defaultSpatialPrefs);
  const [backupReminderCadence, setBackupReminderCadence] = useState<"off" | "daily" | "weekly">("off");
  const [detailsSectionsOpen, setDetailsSectionsOpen] = useState<DetailsSectionState>({
    history: false,
    recall: true,
    zoneGroups: false,
    noteGroups: false,
    tagGroups: false,
  });
  const [presentationMode, setPresentationMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [focusedNoteId, setFocusedNoteId] = useState<string | undefined>(undefined);
  const [touchPaletteNoteId, setTouchPaletteNoteId] = useState<string | undefined>(undefined);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [clientPrefsLoaded, setClientPrefsLoaded] = useState(false);
  const previousSelectedNoteIdRef = useRef<string | undefined>(undefined);
  const detailsPanelAutoOpenedRef = useRef(false);
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
    noteGroups: noteGroupsMap,
    links: linksMap,
    camera,
    lastColor: ui.lastColor,
  };
  const notes = useMemo(() => Object.values(renderSnapshot.notes), [renderSnapshot.notes]);
  const zones = useMemo(() => Object.values(renderSnapshot.zones), [renderSnapshot.zones]);
  const zoneGroups = useMemo(() => Object.values(renderSnapshot.zoneGroups), [renderSnapshot.zoneGroups]);
  const noteGroups = useMemo(() => Object.values(renderSnapshot.noteGroups), [renderSnapshot.noteGroups]);
  const links = useMemo(() => Object.values(renderSnapshot.links), [renderSnapshot.links]);
  const isTimeLocked = timelineMode || publishedReadOnly || presentationMode || readingMode;
  const isChromeHidden = presentationMode || readingMode;
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

    try {
      const recallRaw = window.localStorage.getItem(recallStorageKey);
      if (recallRaw) {
        const parsed = JSON.parse(recallRaw) as SavedRecallSearch[];
        if (Array.isArray(parsed)) {
          setSavedRecallSearches(parsed);
        }
      }
    } catch {
      // Ignore malformed persisted recall payloads and keep defaults.
    }

    try {
      const layoutRaw = window.localStorage.getItem(layoutPrefsStorageKey);
      if (layoutRaw) {
        const parsed = JSON.parse(layoutRaw) as Partial<LayoutPreferences>;
        setLayoutPrefs({
          showToolsPanel: parsed.showToolsPanel ?? defaultLayoutPrefs.showToolsPanel,
          showDetailsPanel: parsed.showDetailsPanel ?? defaultLayoutPrefs.showDetailsPanel,
          showContextBar: parsed.showContextBar ?? defaultLayoutPrefs.showContextBar,
          showNoteTags: parsed.showNoteTags ?? defaultLayoutPrefs.showNoteTags,
        });
      }
    } catch {
      // Ignore malformed persisted layout payloads and keep defaults.
    }

    try {
      const spatialRaw = window.localStorage.getItem(spatialPrefsStorageKey);
      if (spatialRaw) {
        const parsed = JSON.parse(spatialRaw) as Partial<SpatialPreferences>;
        const spacing = typeof parsed.dotGridSpacing === "number" ? parsed.dotGridSpacing : defaultSpatialPrefs.dotGridSpacing;
        setSpatialPrefs({
          showDotMatrix: parsed.showDotMatrix ?? defaultSpatialPrefs.showDotMatrix,
          snapToGuides: parsed.snapToGuides ?? defaultSpatialPrefs.snapToGuides,
          snapToGrid: parsed.snapToGrid ?? defaultSpatialPrefs.snapToGrid,
          dotGridSpacing: Math.max(12, Math.min(64, spacing)),
        });
      }
    } catch {
      // Ignore malformed persisted spatial payloads and keep defaults.
    }

    const cadenceRaw = window.localStorage.getItem(backupReminderCadenceStorageKey);
    setBackupReminderCadence(cadenceRaw === "daily" || cadenceRaw === "weekly" ? cadenceRaw : "off");

    setLeftPanelOpen(false);
    setRightPanelOpen(false);
    setClientPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    window.localStorage.setItem(recallStorageKey, JSON.stringify(savedRecallSearches));
  }, [clientPrefsLoaded, savedRecallSearches]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    window.localStorage.setItem(layoutPrefsStorageKey, JSON.stringify(layoutPrefs));
  }, [clientPrefsLoaded, layoutPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    window.localStorage.setItem(spatialPrefsStorageKey, JSON.stringify(spatialPrefs));
  }, [clientPrefsLoaded, spatialPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    window.localStorage.setItem(backupReminderCadenceStorageKey, backupReminderCadence);
  }, [backupReminderCadence, clientPrefsLoaded]);

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

  useWallPersistenceEffects({
    hydrate,
    publishedReadOnly,
    scheduleCloudSync,
    syncSnapshotToCloud,
    setCloudWallId,
    setTimelineEntries,
    setTimelineIndex,
    setSyncError,
    cloudReadyRef,
    cloudSyncTimerRef,
    lastTimelineSerialized,
    lastTimelineRecordedAt,
  });

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
      const selectedNote = renderSnapshot.notes[ui.selectedNoteId];
      const disableResize = isTimeLocked || Boolean(selectedNote?.pinned);
      noteTransformerRef.current.enabledAnchors(
        disableResize
          ? []
          : [
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ],
      );
      noteTransformerRef.current.nodes([node]);
      noteTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [isTimeLocked, renderSnapshot.notes, ui.selectedNoteId]);

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

  const { markOpenIntent } = useWallTelemetry({
    leftPanelOpen,
    rightPanelOpen,
    isSearchOpen: ui.isSearchOpen,
    isExportOpen: ui.isExportOpen,
    isShortcutsOpen: ui.isShortcutsOpen,
  });

  const setSearchOpenTracked = useCallback(
    (open: boolean) => {
      if (open) {
        markOpenIntent("searchOpenMs");
      }
      setSearchOpen(open);
    },
    [markOpenIntent, setSearchOpen],
  );

  const setExportOpenTracked = useCallback(
    (open: boolean) => {
      if (open) {
        markOpenIntent("exportOpenMs");
      }
      setExportOpen(open);
    },
    [markOpenIntent, setExportOpen],
  );

  const setShortcutsOpenTracked = useCallback(
    (open: boolean) => {
      if (open) {
        markOpenIntent("shortcutsOpenMs");
      }
      setShortcutsOpen(open);
    },
    [markOpenIntent, setShortcutsOpen],
  );

  const toggleLeftPanel = useCallback(() => {
    if (!leftPanelOpen) {
      markOpenIntent("toolsPanelOpenMs");
    }
    setLeftPanelOpen((previous) => !previous);
  }, [leftPanelOpen, markOpenIntent]);

  const openLeftPanel = useCallback(() => {
    if (leftPanelOpen) {
      return;
    }
    markOpenIntent("toolsPanelOpenMs");
    setLeftPanelOpen(true);
  }, [leftPanelOpen, markOpenIntent]);

  const closeLeftPanel = useCallback(() => {
    if (!leftPanelOpen) {
      return;
    }
    setLeftPanelOpen(false);
  }, [leftPanelOpen]);

  const toggleRightPanel = useCallback(() => {
    detailsPanelAutoOpenedRef.current = false;
    if (!rightPanelOpen) {
      markOpenIntent("detailsPanelOpenMs");
    }
    setRightPanelOpen((previous) => !previous);
  }, [markOpenIntent, rightPanelOpen]);

  const openRightPanel = useCallback(() => {
    detailsPanelAutoOpenedRef.current = false;
    if (rightPanelOpen) {
      return;
    }
    markOpenIntent("detailsPanelOpenMs");
    setRightPanelOpen(true);
  }, [markOpenIntent, rightPanelOpen]);

  const closeRightPanel = useCallback(() => {
    detailsPanelAutoOpenedRef.current = false;
    if (!rightPanelOpen) {
      return;
    }
    setRightPanelOpen(false);
  }, [rightPanelOpen]);

  useEffect(() => {
    if (isChromeHidden || isCompactLayout || !layoutPrefs.showDetailsPanel) {
      previousSelectedNoteIdRef.current = ui.selectedNoteId;
      return;
    }

    const selectedNow = Boolean(ui.selectedNoteId);
    const selectedBefore = Boolean(previousSelectedNoteIdRef.current);

    if (selectedNow && !selectedBefore && !rightPanelOpen) {
      markOpenIntent("detailsPanelOpenMs");
      setRightPanelOpen(true);
      detailsPanelAutoOpenedRef.current = true;
    }

    if (!selectedNow && selectedBefore && detailsPanelAutoOpenedRef.current && rightPanelOpen) {
      setRightPanelOpen(false);
      detailsPanelAutoOpenedRef.current = false;
    }

    if (!selectedNow) {
      detailsPanelAutoOpenedRef.current = false;
    }

    previousSelectedNoteIdRef.current = ui.selectedNoteId;
  }, [
    isChromeHidden,
    isCompactLayout,
    layoutPrefs.showDetailsPanel,
    markOpenIntent,
    rightPanelOpen,
    ui.selectedNoteId,
  ]);

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
      selectedNoteGroupId: ui.selectedNoteGroupId,
      lastColor: ui.lastColor ?? NOTE_COLORS[0],
    },
    selectedNoteIds,
    editing,
    isTimeLocked,
    readingMode,
    presentationMode,
    timelineEntriesLength: timelineEntries.length,
    timelineModeRef,
    setIsSpaceDown,
    setShortcutsOpen: setShortcutsOpenTracked,
    setSearchOpen: setSearchOpenTracked,
    setExportOpen: setExportOpenTracked,
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
    setReadingMode,
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
    deleteNoteGroup,
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

  const {
    visibleZones,
    visibleNotes,
    visibleLinks,
    availableRecallTags,
    presentationNotes,
    autoTagGroups,
    autoTagLabelLayout,
    clusterBounds,
    pathLinkIds,
  } = useWallDerivedData({
    notes,
    zones,
    zoneGroups,
    noteGroups,
    links,
    selectedNoteId: ui.selectedNoteId,
    recallQuery,
    recallZoneId,
    recallTag,
    recallDateFilter,
    zonesById: renderSnapshot.zones,
    wallClockTs,
    presentationMode,
    presentationIndex,
    viewport,
    setCamera,
  });
  const focusedNote = focusedNoteId ? renderSnapshot.notes[focusedNoteId] : undefined;
  const touchPaletteNote = touchPaletteNoteId ? renderSnapshot.notes[touchPaletteNoteId] : undefined;
  const touchPaletteScreen = touchPaletteNote
    ? toScreenPoint(touchPaletteNote.x + touchPaletteNote.w / 2, touchPaletteNote.y - 18, camera)
    : undefined;
  const isFocusMode = Boolean(focusedNote);
  const renderVisibleNotes = useMemo(
    () => (focusedNote ? visibleNotes.filter((note) => note.id === focusedNote.id) : visibleNotes),
    [focusedNote, visibleNotes],
  );
  const renderVisibleZones = useMemo(() => (focusedNote ? [] : visibleZones), [focusedNote, visibleZones]);
  const renderVisibleLinks = useMemo(() => (focusedNote ? [] : visibleLinks), [focusedNote, visibleLinks]);
  const renderPathLinkIds = useMemo(() => (focusedNote ? new Set<string>() : pathLinkIds), [focusedNote, pathLinkIds]);
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
    visibleNotes: renderVisibleNotes,
    selectedNoteIds,
    setSelectedNoteIds,
    selectNote,
    selectionBox,
    setSelectionBox,
  });
  const { resolveSnappedPosition } = useWallSnapping({
    dragSnapThreshold,
    cameraZoom: camera.zoom,
    visibleNotes: renderVisibleNotes,
    visibleZones: renderVisibleZones,
    activeSelectedNoteIdSet,
    snapToGuides: spatialPrefs.snapToGuides,
    snapToGrid: spatialPrefs.snapToGrid,
    gridSize: spatialPrefs.dotGridSpacing,
    setGuideLines,
  });

  const selectSingleNote = (noteId: string) => {
    syncPrimarySelection([noteId]);
    setEditing((previous) => (previous?.id === noteId ? previous : null));
  };

  const toggleFocusNote = useCallback(
    (noteId: string) => {
      syncPrimarySelection([noteId]);
      selectNote(noteId);
      setFocusedNoteId((previous) => (previous === noteId ? undefined : noteId));
    },
    [selectNote, syncPrimarySelection],
  );

  const openTouchPaletteForNote = useCallback(
    (noteId: string) => {
      syncPrimarySelection([noteId]);
      selectNote(noteId);
      setTouchPaletteNoteId(noteId);
    },
    [selectNote, syncPrimarySelection],
  );

  const togglePinOnNote = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }
      const note = renderSnapshot.notes[noteId];
      if (!note) {
        return;
      }
      updateNote(noteId, { pinned: !note.pinned });
    },
    [isTimeLocked, renderSnapshot.notes],
  );

  const toggleHighlightOnNote = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }
      const note = renderSnapshot.notes[noteId];
      if (!note) {
        return;
      }
      updateNote(noteId, { highlighted: !note.highlighted });
    },
    [isTimeLocked, renderSnapshot.notes],
  );

  const convertPrimaryNote = useCallback(
    (noteId: string, type: NoteConvertType) => {
      if (isTimeLocked) {
        return;
      }
      const note = renderSnapshot.notes[noteId];
      if (!note) {
        return;
      }
      const nextText = convertNoteText(note.text, type);
      if (nextText === note.text) {
        return;
      }
      runHistoryGroup(() => {
        updateNote(noteId, { text: nextText });
      });
    },
    [isTimeLocked, renderSnapshot.notes, runHistoryGroup],
  );

  const {
    applyColorToSelection,
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
    lastColor: ui.lastColor ?? NOTE_COLORS[0],
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
    visibleNotes: renderVisibleNotes,
    visibleZones: renderVisibleZones,
    setCamera,
    setFlashNote,
    syncPrimarySelection,
    computeContentBounds,
    fitBoundsCamera,
  });

  const { stepZoom, resetZoom } = useWallZoomControls({ camera, viewport, setCamera });

  const { setLayoutPreference, toggleDetailsSection, togglePresentationMode, toggleReadingMode, toggleTimelineMode, saveCurrentRecallSearch, applySavedRecallSearch } = useWallUiActions({
    readingMode, presentationMode, timelineEntriesLength: timelineEntries.length, timelineModeRef, setPresentationMode, setPresentationIndex, setReadingMode,
    setQuickCaptureOpen, setSearchOpen: setSearchOpenTracked, setExportOpen: setExportOpenTracked, setTimelineMode, setTimelineIndex, setIsTimelinePlaying, setLeftPanelOpen,
    setRightPanelOpen, setLayoutPrefs, setDetailsSectionsOpen, recallQuery, recallZoneId, recallTag, recallDateFilter,
    savedRecallSearchesLength: savedRecallSearches.length, setSavedRecallSearches, setRecallQuery, setRecallZoneId, setRecallTag, setRecallDateFilter,
  });

  const collapseAllZoneGroups = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    setAllGroupsCollapsed(true);
  }, [isTimeLocked]);

  const expandAllZoneGroups = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    setAllGroupsCollapsed(false);
  }, [isTimeLocked]);

  const createNoteGroupFromSelection = useCallback(() => {
    if (isTimeLocked || activeSelectedNoteIds.length === 0) {
      return;
    }
    createNoteGroup(noteGroupLabelInput.trim() || "Note Group", activeSelectedNoteIds);
  }, [activeSelectedNoteIds, isTimeLocked, noteGroupLabelInput]);

  const addSelectionToNoteGroup = useCallback(
    (groupId: string) => {
      if (isTimeLocked || activeSelectedNoteIds.length === 0) {
        return;
      }
      addNotesToNoteGroup(groupId, activeSelectedNoteIds);
    },
    [activeSelectedNoteIds, isTimeLocked],
  );

  const removeSelectionFromNoteGroup = useCallback(
    (groupId: string) => {
      if (isTimeLocked || activeSelectedNoteIds.length === 0) {
        return;
      }
      removeNotesFromNoteGroup(groupId, activeSelectedNoteIds);
    },
    [activeSelectedNoteIds, isTimeLocked],
  );

  const selectNotesForGroup = useCallback(
    (groupId: string) => {
      const group = renderSnapshot.noteGroups[groupId];
      if (!group) {
        return;
      }
      const ids = group.noteIds.filter((id) => Boolean(renderSnapshot.notes[id]));
      syncPrimarySelection(ids);
      selectNoteGroup(groupId);
    },
    [renderSnapshot.noteGroups, renderSnapshot.notes, selectNoteGroup, syncPrimarySelection],
  );

  const collapseAllNoteGroups = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    setAllNoteGroupsCollapsed(true);
  }, [isTimeLocked]);

  const expandAllNoteGroups = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    setAllNoteGroupsCollapsed(false);
  }, [isTimeLocked]);

  useEffect(() => {
    const visibleNoteIdSet = new Set(renderVisibleNotes.map((note) => note.id));
    const visibleZoneIdSet = new Set(renderVisibleZones.map((zone) => zone.id));
    const nextSelectedNoteIds = selectedNoteIds.filter((id) => visibleNoteIdSet.has(id));
    if (nextSelectedNoteIds.length !== selectedNoteIds.length) {
      setSelectedNoteIds(nextSelectedNoteIds);
    }
    if (ui.selectedNoteId && !visibleNoteIdSet.has(ui.selectedNoteId)) {
      selectNote(nextSelectedNoteIds[0]);
    }
    if (ui.selectedZoneId && !visibleZoneIdSet.has(ui.selectedZoneId)) {
      selectZone(undefined);
      selectGroup(undefined);
    }
    if (ui.selectedNoteGroupId && !renderSnapshot.noteGroups[ui.selectedNoteGroupId]) {
      selectNoteGroup(undefined);
    }
  }, [renderSnapshot.noteGroups, renderVisibleNotes, renderVisibleZones, selectedNoteIds, selectGroup, selectNote, selectNoteGroup, selectZone, setSelectedNoteIds, ui.selectedNoteGroupId, ui.selectedNoteId, ui.selectedZoneId]);

  useEffect(() => {
    if (!focusedNoteId) {
      return;
    }
    if (!renderSnapshot.notes[focusedNoteId]) {
      setFocusedNoteId(undefined);
      return;
    }
    if (!visibleNotes.some((note) => note.id === focusedNoteId)) {
      setFocusedNoteId(undefined);
    }
  }, [focusedNoteId, renderSnapshot.notes, visibleNotes]);

  useEffect(() => {
    if (!touchPaletteNoteId) {
      return;
    }
    const exists = Boolean(renderSnapshot.notes[touchPaletteNoteId]);
    if (!exists) {
      setTouchPaletteNoteId(undefined);
      return;
    }
    const stillVisible = visibleNotes.some((note) => note.id === touchPaletteNoteId);
    if (!stillVisible) {
      setTouchPaletteNoteId(undefined);
    }
  }, [renderSnapshot.notes, touchPaletteNoteId, visibleNotes]);

  const { exportPng, exportPdf, exportMarkdown } = useWallExport({
    stageRef,
    camera,
    viewport,
    visibleNotes: renderVisibleNotes,
    visibleZones: renderVisibleZones,
    activeSelectedNoteIds,
    selectedZoneId: ui.selectedZoneId,
    zonesById: renderSnapshot.zones,
    selectedNoteId: ui.selectedNoteId,
    allZones: zones,
    setCamera,
    setExportOpen: setExportOpenTracked,
    computeContentBounds,
    fitBoundsCamera,
    waitForPaint,
    makeDownloadId,
    downloadDataUrl,
    downloadTextFile,
    notesToMarkdown,
    zoneContainsNote,
  });

  const { exportJson, importJson, publishReadOnlySnapshot } = useWallBackupActions({
    backupReminderCadence,
    backupReminderLastPromptStorageKey,
    publishedReadOnly,
    makeDownloadId,
    downloadJsonFile,
    setExportOpen: setExportOpenTracked,
    hydrate,
    clearSelectedNotes: () => setSelectedNoteIds([]),
  });

  const {
    selectedNote,
    primarySelectedNote,
    selectedZone,
    selectedGroup,
    selectedNoteGroup,
    showContextColor,
    hasContextActions,
    displayedTags,
    statusMessage,
    quickActionScreen,
    tagPreviewNote,
    tagPreviewPalette,
    tagPreviewScreen,
  } = useWallViewState({
    ui,
    notesById: renderSnapshot.notes,
    zonesById: renderSnapshot.zones,
    groupsById: renderSnapshot.zoneGroups,
    noteGroupsById: renderSnapshot.noteGroups,
    activeSelectedNoteIds,
    selectedNotes,
    hoveredNoteId,
    camera,
    isTimeLocked,
    publishedReadOnly,
  });

  const commandPaletteCommands = useMemo<CommandPaletteCommand[]>(
    () => [
      {
        id: "new-note",
        label: "Create note",
        description: "Add a note at viewport center and open editor.",
        shortcut: "N",
        keywords: ["add", "new", "sticky"],
        disabled: isTimeLocked,
        onSelect: makeNoteAtViewportCenter,
      },
      {
        id: "new-frame",
        label: "Create frame zone",
        description: "Add a frame zone at viewport center.",
        keywords: ["zone", "container", "frame"],
        disabled: isTimeLocked,
        onSelect: () => makeZoneAtViewportCenter("frame"),
      },
      {
        id: "new-column",
        label: "Create column zone",
        description: "Add a column zone at viewport center.",
        keywords: ["zone", "column", "layout"],
        disabled: isTimeLocked,
        onSelect: () => makeZoneAtViewportCenter("column"),
      },
      {
        id: "new-swimlane",
        label: "Create swimlane zone",
        description: "Add a swimlane zone at viewport center.",
        keywords: ["zone", "lane", "layout"],
        disabled: isTimeLocked,
        onSelect: () => makeZoneAtViewportCenter("swimlane"),
      },
      {
        id: "toggle-quick-capture",
        label: quickCaptureOpen ? "Close quick capture" : "Open quick capture",
        description: "Capture notes quickly from text input.",
        shortcut: "Q",
        keywords: ["capture", "quick"],
        disabled: isTimeLocked,
        onSelect: () => setQuickCaptureOpen((previous) => !previous),
      },
      {
        id: "export",
        label: "Open export panel",
        description: "Export PNG, PDF, Markdown, JSON, or publish snapshot.",
        keywords: ["download", "share", "backup"],
        onSelect: () => setExportOpenTracked(true),
      },
      {
        id: "undo",
        label: "Undo",
        description: "Revert the last change.",
        shortcut: "Ctrl/Cmd + Z",
        keywords: ["history", "back"],
        disabled: !canUndo || isTimeLocked,
        onSelect: undo,
      },
      {
        id: "redo",
        label: "Redo",
        description: "Re-apply the last reverted change.",
        shortcut: "Ctrl/Cmd + Shift + Z",
        keywords: ["history", "forward"],
        disabled: !canRedo || isTimeLocked,
        onSelect: redo,
      },
      {
        id: "toggle-reading",
        label: readingMode ? "Exit reading mode" : "Enter reading mode",
        description: "Hide wall chrome and focus on note content only.",
        shortcut: "R",
        keywords: ["read", "calm", "focus", "distraction-free"],
        onSelect: toggleReadingMode,
      },
      {
        id: "toggle-presentation",
        label: presentationMode ? "Exit presentation mode" : "Enter presentation mode",
        description: "Focus on sequential note walkthrough.",
        shortcut: "P",
        keywords: ["present", "slides"],
        onSelect: togglePresentationMode,
      },
      {
        id: "reset-view",
        label: "Reset camera to fit content",
        description: "Fit camera to visible notes and zones.",
        keywords: ["camera", "zoom", "fit"],
        onSelect: resetView,
      },
      {
        id: "toggle-timeline",
        label: timelineMode ? "Exit timeline mode" : "Enter timeline mode",
        description: "View wall state along timeline history.",
        shortcut: "T",
        keywords: ["history", "time"],
        onSelect: toggleTimelineMode,
      },
      {
        id: "toggle-heatmap",
        label: showHeatmap ? "Hide recency heatmap" : "Show recency heatmap",
        description: "Overlay recency heatmap calendar.",
        shortcut: "H",
        keywords: ["calendar", "activity"],
        onSelect: () => setShowHeatmap((previous) => !previous),
      },
      {
        id: "toggle-tools-panel",
        label: leftPanelOpen ? "Hide tools panel" : "Show tools panel",
        description: "Toggle the left tools panel.",
        keywords: ["left", "panel", "tools", "show tools"],
        onSelect: toggleLeftPanel,
      },
      {
        id: "open-tools-panel",
        label: "Show tools panel",
        description: "Open the left tools panel.",
        keywords: ["left", "panel", "tools", "show", "open"],
        disabled: leftPanelOpen,
        onSelect: openLeftPanel,
      },
      {
        id: "close-tools-panel",
        label: "Hide tools panel",
        description: "Close the left tools panel.",
        keywords: ["left", "panel", "tools", "hide", "close"],
        disabled: !leftPanelOpen,
        onSelect: closeLeftPanel,
      },
      {
        id: "toggle-details-panel",
        label: rightPanelOpen ? "Hide details panel" : "Show details panel",
        description: "Toggle the right details panel.",
        keywords: ["right", "panel", "details", "sidebar"],
        onSelect: toggleRightPanel,
      },
      {
        id: "open-details-panel",
        label: "Open sidebar",
        description: "Open the right details sidebar.",
        keywords: ["right", "panel", "details", "sidebar", "open"],
        disabled: rightPanelOpen,
        onSelect: openRightPanel,
      },
      {
        id: "close-details-panel",
        label: "Close sidebar",
        description: "Close the right details sidebar.",
        keywords: ["right", "panel", "details", "sidebar", "close", "hide"],
        disabled: !rightPanelOpen,
        onSelect: closeRightPanel,
      },
      {
        id: "toggle-layout-settings",
        label: layoutMenuOpen ? "Close layout settings" : "Open layout settings",
        description: "Choose which wall chrome elements are visible.",
        keywords: ["layout", "preferences", "visibility"],
        onSelect: () => setLayoutMenuOpen((previous) => !previous),
      },
      {
        id: "toggle-box-select",
        label: boxSelectMode ? "Disable box select mode" : "Enable box select mode",
        description: "Switch drag behavior to marquee selection.",
        keywords: ["multi-select", "selection", "marquee"],
        onSelect: () => setBoxSelectMode((value) => !value),
      },
      {
        id: "toggle-clusters",
        label: ui.showClusters ? "Hide cluster overlays" : "Show cluster overlays",
        description: "Toggle automatic cluster outlines.",
        keywords: ["cluster", "insight", "overlay"],
        onSelect: () => setShowClusters(!ui.showClusters),
      },
      {
        id: "collapse-all-groups",
        label: "Collapse all zone groups",
        description: "Hide all grouped zones and grouped notes.",
        keywords: ["groups", "collapse", "declutter"],
        disabled: isTimeLocked || zoneGroups.every((group) => group.collapsed),
        onSelect: collapseAllZoneGroups,
      },
      {
        id: "expand-all-groups",
        label: "Expand all zone groups",
        description: "Show all grouped zones and grouped notes.",
        keywords: ["groups", "expand", "restore"],
        disabled: isTimeLocked || zoneGroups.every((group) => !group.collapsed),
        onSelect: expandAllZoneGroups,
      },
      {
        id: "toggle-dot-matrix",
        label: spatialPrefs.showDotMatrix ? "Hide dot matrix" : "Show dot matrix",
        description: "Toggle subtle dot-grid background helper.",
        keywords: ["grid", "dot", "background"],
        onSelect: () => setSpatialPrefs((previous) => ({ ...previous, showDotMatrix: !previous.showDotMatrix })),
      },
      {
        id: "toggle-snap-guides",
        label: spatialPrefs.snapToGuides ? "Disable snap guides" : "Enable snap guides",
        description: "Toggle alignment guide snapping.",
        keywords: ["snap", "guide", "align"],
        onSelect: () => setSpatialPrefs((previous) => ({ ...previous, snapToGuides: !previous.snapToGuides })),
      },
      {
        id: "toggle-snap-grid",
        label: spatialPrefs.snapToGrid ? "Disable snap grid" : "Enable snap grid",
        description: "Toggle grid snapping during drag.",
        keywords: ["snap", "grid"],
        onSelect: () => setSpatialPrefs((previous) => ({ ...previous, snapToGrid: !previous.snapToGrid })),
      },
      {
        id: "open-shortcuts",
        label: "Open shortcuts help",
        description: "Show keyboard shortcut reference.",
        shortcut: "?",
        keywords: ["help", "keys"],
        onSelect: () => setShortcutsOpenTracked(true),
      },
    ],
    [
      boxSelectMode,
      canRedo,
      canUndo,
      isTimeLocked,
      layoutMenuOpen,
      leftPanelOpen,
      makeNoteAtViewportCenter,
      makeZoneAtViewportCenter,
      readingMode,
      presentationMode,
      quickCaptureOpen,
      redo,
      resetView,
      rightPanelOpen,
      setExportOpenTracked,
      setShortcutsOpenTracked,
      showHeatmap,
      spatialPrefs.showDotMatrix,
      spatialPrefs.snapToGrid,
      spatialPrefs.snapToGuides,
      timelineMode,
      toggleLeftPanel,
      toggleReadingMode,
      togglePresentationMode,
      toggleRightPanel,
      toggleTimelineMode,
      openLeftPanel,
      closeLeftPanel,
      openRightPanel,
      closeRightPanel,
      collapseAllZoneGroups,
      expandAllZoneGroups,
      setShowClusters,
      ui.showClusters,
      undo,
      zoneGroups,
    ],
  );
  return (
    <div className="route-shell flex h-screen flex-col text-[var(--color-text)]">
      {!readingMode && (
      <WallHeaderBar
        presentationMode={presentationMode}
        publishedReadOnly={publishedReadOnly}
        layoutPrefs={layoutPrefs}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        layoutMenuOpen={layoutMenuOpen}
        quickCaptureOpen={quickCaptureOpen}
        isTimeLocked={isTimeLocked}
        hasContextActions={hasContextActions}
        showContextColor={showContextColor}
        toolbarSurface={toolbarSurface}
        toolbarLabel={toolbarLabel}
        toolbarDivider={toolbarDivider}
        selectedNotes={selectedNotes}
        selectedNote={selectedNote}
        uiLastColor={ui.lastColor ?? NOTE_COLORS[0]}
        statusMessage={statusMessage}
        userEmail={userEmail}
        cloudWallId={cloudWallId}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
        onToggleLeftPanel={toggleLeftPanel}
        onToggleRightPanel={toggleRightPanel}
        onOpenCommandPalette={() => setSearchOpenTracked(true)}
        onToggleQuickCapture={() => setQuickCaptureOpen((previous) => !previous)}
        onTogglePresentationMode={togglePresentationMode}
        onOpenShortcuts={() => setShortcutsOpenTracked(true)}
        onSetLayoutPreference={setLayoutPreference}
        onApplyColorToSelection={applyColorToSelection}
        onSyncNow={syncNow}
      />
      )}

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
          <div className="absolute inset-0 z-10 grid place-items-center bg-[color:rgb(24_32_44_/_0.12)] backdrop-blur-sm">
            <p className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
              Loading wall...
            </p>
          </div>
        )}

        {readingMode && (
          <div className="pointer-events-auto absolute right-4 top-4 z-[45] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)]">
            Reading mode. Press R to exit.
          </div>
        )}

        {isFocusMode && !readingMode && (
          <button
            type="button"
            onClick={() => setFocusedNoteId(undefined)}
            className="pointer-events-auto absolute right-4 top-4 z-[45] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] hover:bg-[var(--color-surface)]"
          >
            Focus mode. Click to exit.
          </button>
        )}

        {!isChromeHidden &&
          isCompactLayout &&
          ((layoutPrefs.showToolsPanel && leftPanelOpen) || (layoutPrefs.showDetailsPanel && rightPanelOpen)) && (
          <button
            type="button"
            aria-label="Close side panels"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
            className="absolute inset-0 z-[34] bg-[var(--color-overlay)]"
          />
        )}

        {!isChromeHidden && !publishedReadOnly && layoutPrefs.showToolsPanel && (
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
            showDotMatrix={spatialPrefs.showDotMatrix}
            snapToGuides={spatialPrefs.snapToGuides}
            snapToGrid={spatialPrefs.snapToGrid}
            onToggleDotMatrix={() =>
              setSpatialPrefs((previous) => ({ ...previous, showDotMatrix: !previous.showDotMatrix }))
            }
            onToggleSnapToGuides={() =>
              setSpatialPrefs((previous) => ({ ...previous, snapToGuides: !previous.snapToGuides }))
            }
            onToggleSnapToGrid={() =>
              setSpatialPrefs((previous) => ({ ...previous, snapToGrid: !previous.snapToGrid }))
            }
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
            setFocusedNoteId(undefined);
            setTouchPaletteNoteId(undefined);
          }}
        >
          <Layer listening={false}>
            <WallDotMatrixLayer
              showDotMatrix={spatialPrefs.showDotMatrix}
              dotGridSpacing={spatialPrefs.dotGridSpacing}
              camera={camera}
              viewport={viewport}
            />
          </Layer>

          <Layer>
            <WallLinksZonesLayer
              visibleLinks={renderVisibleLinks}
              visibleZones={renderVisibleZones}
              notesById={renderSnapshot.notes}
              selectedLinkId={ui.selectedLinkId}
              selectedNoteId={ui.selectedNoteId}
              selectedZoneId={ui.selectedZoneId}
              pathLinkIds={renderPathLinkIds}
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

            {isFocusMode && (
              <Rect
                listening={false}
                x={-camera.x / camera.zoom}
                y={-camera.y / camera.zoom}
                width={viewport.w / camera.zoom}
                height={viewport.h / camera.zoom}
                fill="rgb(15 23 42 / 0.26)"
              />
            )}

            <WallNotesLayer
              visibleNotes={renderVisibleNotes}
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
              onLongPressNote={openTouchPaletteForNote}
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

        {!readingMode && (
        <WallFloatingUi
          editing={editing}
          notesById={renderSnapshot.notes}
          linksById={renderSnapshot.links}
          camera={camera}
          isTimeLocked={isTimeLocked}
          editTagInput={editTagInput}
          editTagRenameFrom={editTagRenameFrom}
          setEditing={setEditing}
          handleEditorBlur={handleEditorBlur}
          setEditTagInput={setEditTagInput}
          setEditTagRenameFrom={setEditTagRenameFrom}
          addTagToNote={addTagToNote}
          removeTagFromNote={removeTagFromNote}
          renameTagOnNote={renameTagOnNote}
          toScreenPoint={toScreenPoint}
          tagPreviewScreen={tagPreviewScreen}
          tagPreviewNote={tagPreviewNote}
          tagPreviewPalette={tagPreviewPalette}
          touchPaletteScreen={touchPaletteScreen}
          touchPaletteNote={touchPaletteNote}
          quickActionScreen={quickActionScreen}
          primarySelectedNote={primarySelectedNote}
          toolbarBtnActive={toolbarBtnActive}
          toolbarBtnCompact={toolbarBtnCompact}
          applyColorToSelection={applyColorToSelection}
          updateNote={updateNote}
          duplicateNote={duplicateNote}
          togglePinOnNote={togglePinOnNote}
          toggleHighlightOnNote={toggleHighlightOnNote}
          onConvertNote={convertPrimaryNote}
          isPrimaryNoteFocused={Boolean(primarySelectedNote && focusedNoteId === primarySelectedNote.id)}
          onToggleFocusNote={toggleFocusNote}
          setLinkingFromNote={setLinkingFromNote}
          linkingFromNoteId={ui.linkingFromNoteId}
          linkMenu={linkMenu}
          maxViewportWidth={maxViewportWidth}
          maxViewportHeight={maxViewportHeight}
          setLinkMenu={setLinkMenu}
          deleteLink={deleteLink}
          updateLinkType={updateLinkType}
          onOpenCommandPalette={() => setSearchOpenTracked(true)}
          showHeatmap={showHeatmap}
          timelineEntries={timelineEntries}
          jumpToTimelineDay={jumpToTimelineDay}
          timelineMode={timelineMode}
          timelineIndex={timelineIndex}
          isTimelinePlaying={isTimelinePlaying}
          setIsTimelinePlaying={setIsTimelinePlaying}
          setTimelineIndex={setTimelineIndex}
          presentationMode={presentationMode}
          presentationIndex={presentationIndex}
          presentationNotesLength={presentationNotes.length}
          setPresentationIndex={setPresentationIndex}
          setPresentationMode={setPresentationMode}
          onZoomIn={() => stepZoom("in")}
          onZoomOut={() => stepZoom("out")}
          onResetZoom={resetZoom}
          onCloseTouchPalette={() => setTouchPaletteNoteId(undefined)}
        />
        )}

        <WallDetailsSidebar
          presentationMode={isChromeHidden}
          showDetailsPanel={layoutPrefs.showDetailsPanel}
          isCompactLayout={isCompactLayout}
          rightPanelOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          templateType={ui.templateType}
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
          visibleNotesCount={renderVisibleNotes.length}
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
          onCollapseAllGroups={collapseAllZoneGroups}
          onExpandAllGroups={expandAllZoneGroups}
          onDeleteGroup={deleteGroup}
          onClearNoteSelection={clearNoteSelection}
          noteGroupLabelInput={noteGroupLabelInput}
          onNoteGroupLabelInputChange={setNoteGroupLabelInput}
          selectedNoteGroup={selectedNoteGroup}
          activeSelectedNoteIds={activeSelectedNoteIds}
          noteGroups={noteGroups}
          onCreateGroupFromSelection={createNoteGroupFromSelection}
          onSelectNoteGroup={selectNoteGroup}
          onToggleNoteGroupCollapse={toggleNoteGroupCollapse}
          onCollapseAllNoteGroups={collapseAllNoteGroups}
          onExpandAllNoteGroups={expandAllNoteGroups}
          onDeleteNoteGroup={deleteNoteGroup}
          onAddSelectionToNoteGroup={addSelectionToNoteGroup}
          onRemoveSelectionFromNoteGroup={removeSelectionFromNoteGroup}
          onSelectNotesForGroup={selectNotesForGroup}
          showAutoTagGroups={showAutoTagGroups}
          onToggleAutoTagGroups={() => setShowAutoTagGroups((value) => !value)}
          autoTagGroups={autoTagGroups}
          onFocusBounds={focusBounds}
        />

      </div>

      <WallGlobalModals
        quickCaptureOpen={quickCaptureOpen} isTimeLocked={isTimeLocked} onCloseQuickCapture={() => setQuickCaptureOpen(false)} onCapture={captureNotes}
        isSearchOpen={ui.isSearchOpen} visibleNotes={renderVisibleNotes} commandPaletteCommands={commandPaletteCommands}
        onCloseSearch={() => setSearchOpenTracked(false)} onSelectSearchNote={focusNote}
        isExportOpen={ui.isExportOpen} onCloseExport={() => setExportOpenTracked(false)}
        onExportPng={(scope, pixelRatio) => { void exportPng(scope, pixelRatio); }}
        onExportPdf={(scope) => { void exportPdf(scope); }}
        onExportMarkdown={exportMarkdown} onExportJson={exportJson}
        onImportJson={(file) => { void importJson(file); }}
        onPublishSnapshot={() => { void publishReadOnlySnapshot(); }}
        backupReminderCadence={backupReminderCadence} onBackupReminderCadenceChange={setBackupReminderCadence}
        isShortcutsOpen={ui.isShortcutsOpen} onCloseShortcuts={() => setShortcutsOpenTracked(false)}
      />
    </div>
  );
};
