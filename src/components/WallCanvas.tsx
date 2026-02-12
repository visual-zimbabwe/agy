"use client";

import { type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer } from "react-konva";
import type Konva from "konva";

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
  isPersistedWallStateLike,
  layoutPrefsStorageKey,
  linkColorByType,
  linkPoints,
  linkStrokeByType,
  makeDownloadId,
  noteTagChipPalette,
  recallStorageKey,
  recencyIntensity,
  tagGroupColor,
  toScreenPoint,
  toWorldPoint,
  truncateNoteText,
  waitForPaint,
  zoneContainsNote,
} from "@/components/wall/wall-canvas-helpers";
import { WallLinksZonesLayer } from "@/components/wall/WallLinksZonesLayer";
import { WallNotesLayer } from "@/components/wall/WallNotesLayer";
import { WallOverlaysLayer } from "@/components/wall/WallOverlaysLayer";
import { useWallCameraNavigation } from "@/components/wall/useWallCameraNavigation";
import { useWallExport } from "@/components/wall/useWallExport";
import { useWallSelection } from "@/components/wall/useWallSelection";
import { useWallSnapping } from "@/components/wall/useWallSnapping";
import { WallStage } from "@/components/wall/WallStage";
import { useWallDerivedData } from "@/components/wall/useWallDerivedData";
import { useWallPersistenceEffects } from "@/components/wall/useWallPersistenceEffects";
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
import { LINK_TYPES, NOTE_COLORS, NOTE_DEFAULTS, ZONE_DEFAULTS } from "@/features/wall/constants";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import type { TimelineEntry } from "@/features/wall/storage";
import type { PersistedWallState } from "@/features/wall/types";
import { buildPublishedSnapshotUrl, decodeSnapshotFromUrl, readSnapshotParamFromLocation } from "@/lib/publish";
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
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

const flashDurationMs = 1200;

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
      lastColor: ui.lastColor ?? NOTE_COLORS[0],
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
  const { resolveSnappedPosition } = useWallSnapping({
    dragSnapThreshold,
    cameraZoom: camera.zoom,
    visibleNotes,
    activeSelectedNoteIdSet,
    setGuideLines,
  });

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
    visibleNotes,
    visibleZones,
    setCamera,
    setFlashNote,
    syncPrimarySelection,
    computeContentBounds,
    fitBoundsCamera,
  });

  const { stepZoom, resetZoom } = useWallZoomControls({ camera, viewport, setCamera });

  const { setLayoutPreference, toggleDetailsSection, togglePresentationMode, toggleTimelineMode, saveCurrentRecallSearch, applySavedRecallSearch } = useWallUiActions({
    presentationMode, timelineEntriesLength: timelineEntries.length, timelineModeRef, setPresentationMode, setPresentationIndex,
    setQuickCaptureOpen, setSearchOpen, setExportOpen, setTimelineMode, setTimelineIndex, setIsTimelinePlaying, setLeftPanelOpen,
    setRightPanelOpen, setLayoutPrefs, setDetailsSectionsOpen, recallQuery, recallZoneId, recallTag, recallDateFilter,
    savedRecallSearchesLength: savedRecallSearches.length, setSavedRecallSearches, setRecallQuery, setRecallZoneId, setRecallTag, setRecallDateFilter,
  });

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

  const {
    selectedNote,
    primarySelectedNote,
    selectedZone,
    selectedGroup,
    showContextColor,
    showContextTextSize,
    showContextAlign,
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
    activeSelectedNoteIds,
    selectedNotes,
    hoveredNoteId,
    camera,
    isTimeLocked,
    publishedReadOnly,
  });
  return (
    <div className="route-shell flex h-screen flex-col text-[var(--color-text)]">
      <WallHeaderBar
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
        hasContextActions={hasContextActions}
        showContextColor={showContextColor}
        showContextTextSize={showContextTextSize}
        showContextAlign={showContextAlign}
        toolbarSurface={toolbarSurface}
        toolbarLabel={toolbarLabel}
        toolbarDivider={toolbarDivider}
        toolbarBtnActive={toolbarBtnActive}
        toolbarBtnCompact={toolbarBtnCompact}
        selectedNotes={selectedNotes}
        selectedNote={selectedNote}
        primarySelectedNote={primarySelectedNote}
        uiLastColor={ui.lastColor ?? NOTE_COLORS[0]}
        statusMessage={statusMessage}
        cloudWallId={cloudWallId}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
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
        onApplyColorToSelection={applyColorToSelection}
        onApplyTextSizeToSelection={applyTextSizeToSelection}
        onAlignSelected={alignSelected}
        onDistributeSelected={distributeSelected}
        onSyncNow={syncNow}
      />

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
            <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-md)]">
              Loading wall...
            </p>
          </div>
        )}

        {!publishedReadOnly && syncError && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[45] -translate-x-1/2 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger-strong)] shadow-[var(--shadow-sm)]">
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
            className="absolute inset-0 z-[34] bg-[var(--color-overlay)]"
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
          quickActionScreen={quickActionScreen}
          primarySelectedNote={primarySelectedNote}
          toolbarBtnActive={toolbarBtnActive}
          toolbarBtnCompact={toolbarBtnCompact}
          applyTextSizeToSelection={applyTextSizeToSelection}
          applyColorToSelection={applyColorToSelection}
          duplicateNote={duplicateNote}
          deleteNote={deleteNote}
          clearNoteSelection={clearNoteSelection}
          setLinkingFromNote={setLinkingFromNote}
          linkingFromNoteId={ui.linkingFromNoteId}
          linkMenu={linkMenu}
          maxViewportWidth={maxViewportWidth}
          maxViewportHeight={maxViewportHeight}
          setLinkMenu={setLinkMenu}
          deleteLink={deleteLink}
          updateLinkType={updateLinkType}
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
        />

        <WallDetailsSidebar
          presentationMode={presentationMode}
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

      </div>

      <WallGlobalModals
        quickCaptureOpen={quickCaptureOpen} isTimeLocked={isTimeLocked} onCloseQuickCapture={() => setQuickCaptureOpen(false)} onCapture={captureNotes}
        isSearchOpen={ui.isSearchOpen} visibleNotes={visibleNotes} onCloseSearch={() => setSearchOpen(false)} onSelectSearchNote={focusNote}
        isExportOpen={ui.isExportOpen} onCloseExport={() => setExportOpen(false)}
        onExportPng={(scope, pixelRatio) => { void exportPng(scope, pixelRatio); }}
        onExportPdf={(scope) => { void exportPdf(scope); }}
        onExportMarkdown={exportMarkdown} onExportJson={exportJson}
        onImportJson={(file) => { void importJson(file); }}
        onPublishSnapshot={() => { void publishReadOnlySnapshot(); }}
        backupReminderCadence={backupReminderCadence} onBackupReminderCadenceChange={setBackupReminderCadence}
        isShortcutsOpen={ui.isShortcutsOpen} onCloseShortcuts={() => setShortcutsOpen(false)}
      />
    </div>
  );
};
