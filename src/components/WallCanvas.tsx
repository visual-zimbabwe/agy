"use client";
/* eslint-disable complexity, max-lines */

import { type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";


import type { DetailsSectionState, RecallDateFilter } from "@/components/wall/details/DetailsSectionTypes";
import { useWallActions } from "@/components/wall/useWallActions";
import { WallInCanvasChrome, WallChromeHeader } from "@/components/wall/chrome/WallChromeShell";
import { WallSpatialView } from "@/components/wall/spatial/WallSpatialView";
import { PrivateNoteModal } from "@/components/wall/PrivateNoteModal";
import { WallGlobalModals } from "@/components/wall/WallGlobalModals";
import {
  waitForPaint,
} from "@/components/wall/wall-canvas-helpers";
import {
  fitBoundsCamera,
  findOpenNotePosition,
  toScreenPoint,
  toWorldPoint,
  zoneContainsNote,
} from "@/components/wall/wall-coordinates";
import {
  downloadDataUrl,
  downloadJsonFile,
  downloadTextFile,
  makeDownloadId,
} from "@/components/wall/wall-download";
import {
  backupReminderLastPromptStorageKey,
  dragSnapThreshold,
} from "@/components/wall/wall-storage-keys";
import { useWallCameraNavigation } from "@/components/wall/useWallCameraNavigation";
import { useWallCommandPalette } from "@/components/wall/useWallCommandPalette";
import { useWallBookmarkOrchestration } from "@/components/wall/useWallBookmarkOrchestration";
import { useWallClientPrefs } from "@/components/wall/useWallClientPrefs";
import { useWallCloudSync } from "@/components/wall/useWallCloudSync";
import { useWallImageInsert } from "@/components/wall/useWallImageInsert";
import { useWallMediaNoteHandlers } from "@/components/wall/useWallMediaNoteHandlers";
import { useWallNoteCreation } from "@/components/wall/useWallNoteCreation";
import { useWallNoteTagActions } from "@/components/wall/useWallNoteTagActions";
import { useWallPanelChrome } from "@/components/wall/useWallPanelChrome";
import { useWallPresentationPaths } from "@/components/wall/useWallPresentationPaths";
import { useWallPrivateNotes, type EditingState } from "@/components/wall/useWallPrivateNotes";
import { useWallSmartMerge } from "@/components/wall/useWallSmartMerge";
import { useWallVocabularySession, useWallSessionClock } from "@/components/wall/useWallVocabularySession";
import { useWallExport } from "@/components/wall/useWallExport";
import { useWallSelection } from "@/components/wall/useWallSelection";
import { useWallSnapping } from "@/components/wall/useWallSnapping";
import { useWallDerivedData } from "@/components/wall/useWallDerivedData";
import { useWallViewportWindow } from "@/components/wall/useWallViewportWindow";
import { useWallPersistenceEffects } from "@/components/wall/useWallPersistenceEffects";
import { useWallEntityWindowCache } from "@/components/wall/useWallEntityWindowCache";
import { useWallRemoteDeltaFeed } from "@/components/wall/useWallRemoteDeltaFeed";
import { useWallBackupActions } from "@/components/wall/useWallBackupActions";
import { useAnimatedCamera } from "@/components/wall/useAnimatedCamera";
import { useWallTelemetry } from "@/components/wall/useWallTelemetry";
import { useWallTimeline } from "@/components/wall/useWallTimeline";
import { useWallUiActions } from "@/components/wall/useWallUiActions";
import { useWallViewState } from "@/components/wall/useWallViewState";
import { useWallKeyboard } from "@/components/wall/useWallKeyboard";
import { useWallZoomControls } from "@/components/wall/useWallZoomControls";
import { useWallProductTour } from "@/components/wall/useWallProductTour";
import { WallSessionProvider } from "@/components/wall/session/WallSessionProvider";
import { useWallSessionBindings } from "@/components/wall/session/useWallSessionBindings";
import { useWallSpatialBindings } from "@/components/wall/session/useWallSpatialBindings";
import {
  toolbarBtn,
  toolbarBtnActive,
  toolbarBtnPrimary,
  toolbarDivider,
  toolbarLabel,
  toolbarSelect,
  toolbarSurface,
} from "@/components/wall/wallChromeClasses";
import {
  applyTemplate,
  assignZoneToGroup,
  createLink,
  createNote,
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
  moveZone,
  setAllGroupsCollapsed,
  toggleGroupCollapse,
  updateNote,
  updateLinkType,
  updateZone,
} from "@/features/wall/commands";
import { deriveWallAssetRecords, mergeWallAssetRecords } from "@/features/wall/asset-records";
import { canProtectNote, isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import { NOTE_COLORS, NOTE_DEFAULTS } from "@/features/wall/constants";
import { useWallStore } from "@/features/wall/store";
import type { TimelineEntry } from "@/features/wall/storage";
import { loadTimelineEntries, saveWallCloudBaselineSnapshot, saveWallSyncVersion } from "@/features/wall/storage";
import type { Note, PersistedWallState, WallAssetMap } from "@/features/wall/types";
import { createViewportWallBounds } from "@/features/wall/windowing";
import { getVideoNoteTitle, getVideoPlayback, getVideoPosterUrl } from "@/features/wall/video-notes";
import { getNoteWikiTitle } from "@/features/wall/wiki-links";
import { isVocabularyNote } from "@/features/wall/vocabulary";
import type { AppUserProfile } from "@/lib/profile";
import { decodeSnapshotFromUrl, readSnapshotParamFromLocation } from "@/lib/publish";
import { clampPresentationIndex } from "@/lib/presentation-paths";
import { computeContentBounds, notesToMarkdown } from "@/lib/wall-utils";

type LinkContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  linkId?: string;
};

type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

const flashDurationMs = 1200;
const timelineHistoryLoadLimit = 120;

type WallCanvasProps = {
  userProfile?: AppUserProfile;
};

export const WallCanvas = ({ userProfile }: WallCanvasProps) => {
  const userEmail = userProfile?.email;
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
  const setFileConversionOpen = useWallStore((state) => state.setFileConversionOpen);
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
  const [isImageDragOver, setIsImageDragOver] = useState(false);
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
  const [timelineHistoryLoaded, setTimelineHistoryLoaded] = useState(false);
  const [timelineMode, setTimelineMode] = useState(false);
  const [timelineViewActive, setTimelineViewActive] = useState(false);
  const timelineModeRef = useRef(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [wallAssets, setWallAssets] = useState<WallAssetMap>({});
  const [recallQuery, setRecallQuery] = useState("");
  const [recallZoneId, setRecallZoneId] = useState("");
  const [recallTag, setRecallTag] = useState("");
  const [recallDateFilter, setRecallDateFilter] = useState<RecallDateFilter>("all");
  const [detailsSectionsOpen, setDetailsSectionsOpen] = useState<DetailsSectionState>({
    history: false,
    recall: true,
    vocabulary: true,
    zoneGroups: true,
    tagGroups: false,
    smartMerge: true,
  });
  const [reviewRevealMeaning, setReviewRevealMeaning] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [focusedNoteId, setFocusedNoteId] = useState<string | undefined>(undefined);
  const [inlinePlayingVideoNoteId, setInlinePlayingVideoNoteId] = useState<string | undefined>(undefined);
  const handledDeepLinkNoteRef = useRef<string | null>(null);
  const wallInlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const [publishedSnapshot] = useState<PersistedWallState | null>(() => {
    const encoded = readSnapshotParamFromLocation();
    if (!encoded) {
      return null;
    }
    return decodeSnapshotFromUrl(encoded);
  });
  const publishedReadOnly = Boolean(publishedSnapshot);
  const {
    cloudWallId,
    setCloudWallId,
    syncError,
    setSyncError,
    lastSyncedAt,
    isSyncing,
    localSaveState,
    hasPendingSync,
    cloudSyncTimerRef,
    cloudReadyRef,
    cloudWallUpdatedAtRef,
    acknowledgedCloudSnapshotRef,
    cloudSyncVersionRef,
    scheduleCloudSync,
    syncSnapshotToCloud,
    syncNow,
    handleLocalSaveStateChange,
  } = useWallCloudSync({ publishedReadOnly, hydrate });
  const {
    layoutPrefs,
    controlsMode,
    spatialPrefs,
    setSpatialPrefs,
    savedRecallSearches,
    setSavedRecallSearches,
    presentationPaths,
    setPresentationPaths,
    backupReminderCadence,
    setBackupReminderCadence,
  } = useWallClientPrefs();
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
  const resolvedWallAssets = useMemo(
    () => mergeWallAssetRecords(deriveWallAssetRecords(renderSnapshot.notes), wallAssets),
    [renderSnapshot.notes, wallAssets],
  );
  const inlinePlayingVideoNote = inlinePlayingVideoNoteId ? renderSnapshot.notes[inlinePlayingVideoNoteId] : undefined;
  const inlinePlayingVideoScreenRect = useMemo(() => {
    if (inlinePlayingVideoNote?.noteKind !== "video") {
      return null;
    }

    const playback = getVideoPlayback(inlinePlayingVideoNote.video);
    if (!playback) {
      return null;
    }

    const mediaWidth = Math.max(0, inlinePlayingVideoNote.w - 36);
    const mediaHeight = Math.max(0, inlinePlayingVideoNote.h - 124);
    if (mediaWidth <= 0 || mediaHeight <= 0) {
      return null;
    }

    const topLeft = toScreenPoint(inlinePlayingVideoNote.x + 18, inlinePlayingVideoNote.y + 18, camera);
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: mediaWidth * camera.zoom,
      height: mediaHeight * camera.zoom,
      title: getVideoNoteTitle(inlinePlayingVideoNote.video),
      playback,
      posterUrl: getVideoPosterUrl(inlinePlayingVideoNote.video),
    };
  }, [camera, inlinePlayingVideoNote]);
  const notes = useMemo(() => Object.values(renderSnapshot.notes), [renderSnapshot.notes]);
  const zones = useMemo(() => Object.values(renderSnapshot.zones), [renderSnapshot.zones]);
  const zoneGroups = useMemo(() => Object.values(renderSnapshot.zoneGroups), [renderSnapshot.zoneGroups]);
  const links = useMemo(() => Object.values(renderSnapshot.links), [renderSnapshot.links]);
  const wikiLinkOptions = useMemo(
    () => notes.filter((note) => note.text.trim()).map((note) => ({ noteId: note.id, title: getNoteWikiTitle(note) })).sort((left, right) => left.title.localeCompare(right.title)),
    [notes],
  );
  const wikiLinksByNoteId = useMemo(() => {
    const grouped: Record<string, Array<{ targetNoteId: string; title: string }>> = {};
    for (const link of links) {
      if (link.type !== "wiki") {
        continue;
      }
      const target = renderSnapshot.notes[link.toNoteId];
      if (!target) {
        continue;
      }
      const list = grouped[link.fromNoteId] ?? [];
      list.push({ targetNoteId: link.toNoteId, title: getNoteWikiTitle(target) });
      grouped[link.fromNoteId] = list;
    }
    return grouped;
  }, [links, renderSnapshot.notes]);
  const backlinksByNoteId = useMemo(() => {
    const grouped: Record<string, Array<{ noteId: string; title: string }>> = {};
    for (const link of links) {
      if (link.type !== "wiki") {
        continue;
      }
      const source = renderSnapshot.notes[link.fromNoteId];
      if (!source) {
        continue;
      }
      const list = grouped[link.toNoteId] ?? [];
      list.push({ noteId: link.fromNoteId, title: getNoteWikiTitle(source) });
      grouped[link.toNoteId] = list;
    }
    return grouped;
  }, [links, renderSnapshot.notes]);
  const occupiedNoteRects = useMemo(() => notes.map((note) => ({ x: note.x, y: note.y, w: note.w, h: note.h })), [notes]);
  const placeNewNote = useCallback(
    (preferredCenter: { x: number; y: number }, size = { w: NOTE_DEFAULTS.width, h: NOTE_DEFAULTS.height }, extraOccupiedRects: Array<{ x: number; y: number; w: number; h: number }> = []) =>
      findOpenNotePosition({
        camera,
        viewport,
        occupiedRects: [...occupiedNoteRects, ...extraOccupiedRects],
        preferred: {
          x: preferredCenter.x - size.w / 2,
          y: preferredCenter.y - size.h / 2,
        },
        size,
      }),
    [camera, occupiedNoteRects, viewport],
  );
  const isTimeLocked = timelineMode || timelineViewActive || publishedReadOnly || presentationMode || readingMode;
  const isChromeHidden = presentationMode || readingMode;
  timelineModeRef.current = timelineMode;
  const wallClockTs = useWallSessionClock();

  const {
    presentationIndex,
    setPresentationIndex,
    activePresentationPathId,
    hasNarrativePresentation,
    presentationLengthForKeyboard,
    presentationModeType,
    activePresentationSteps,
    activePresentationStep,
    narrativePathOptions,
    createNarrativePath,
    addNarrativeStep,
    updateNarrativeTalkingPoints,
    captureNarrativeStepCamera,
    deleteNarrativeStep,
    handleNarrativePathChange,
  } = useWallPresentationPaths({
    publishedReadOnly,
    presentationPaths,
    setPresentationPaths,
    camera,
    setCamera,
    presentationMode,
    notesCount: notes.length,
  });

  const toggleTimelineView = useCallback(() => {
    setTimelineViewActive((previous) => !previous);
  }, []);

  const {
    privateSessions,
    privateModal,
    privateModalNote,
    openPrivateModal,
    closePrivateModal,
    lockPrivateNote,
    openEditor,
    commitEditedNoteText,
    handleEditorBlur: handlePrivateEditorBlur,
    submitPrivateModal,
    syncWikiLinksForNote,
  } = useWallPrivateNotes({
    renderSnapshotNotes: renderSnapshot.notes,
    isTimeLocked,
    timelineViewActive,
    camera,
    viewport,
    occupiedNoteRects,
    setEditing,
    setEditTagInput,
    setEditTagRenameFrom,
    setSelectedNoteIds,
    setQuickCaptureOpen,
    setSearchOpen,
    setExportOpen,
    setIsTimelinePlaying,
  });

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

  const { addTagToNote, removeTagFromNote, renameTagOnNote } = useWallNoteTagActions({
    isTimeLocked,
    renderSnapshotNotes: renderSnapshot.notes,
  });

  const handleEditorBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    handlePrivateEditorBlur(event, editing);
  };

  const getViewportWindowBounds = useCallback(
    (targetCamera: { x: number; y: number; zoom: number }) => createViewportWallBounds(targetCamera, viewport, 320),
    [viewport],
  );

  const { mergeRemoteWindowSnapshot } = useWallPersistenceEffects({
    hydrate,
    publishedReadOnly,
    scheduleCloudSync,
    syncSnapshotToCloud,
    setAcknowledgedCloudSnapshot: (snapshot) => {
      acknowledgedCloudSnapshotRef.current = snapshot;
    },
    setCloudSyncVersion: (value) => {
      cloudSyncVersionRef.current = value;
    },
    setCloudWallUpdatedAt: (value) => {
      cloudWallUpdatedAtRef.current = value;
    },
    setCloudWallId,
    setWallAssets,
    setTimelineEntries,
    setTimelineIndex,
    setSyncError,
    onLocalSaveStateChange: handleLocalSaveStateChange,
    cloudReadyRef,
    cloudSyncTimerRef,
    lastTimelineSerialized,
    lastTimelineRecordedAt,
    getViewportWindowBounds,
  });

  useWallEntityWindowCache({
    wallId: publishedReadOnly ? null : cloudWallId,
    camera,
    viewport,
    enabled: hydrated && !publishedReadOnly,
    onWindowLoaded: ({ snapshot, assets, syncVersion, updatedAt }) => {
      setWallAssets((previous) => mergeWallAssetRecords(previous, assets));
      mergeRemoteWindowSnapshot(snapshot, {
        syncVersion: Math.max(cloudSyncVersionRef.current, syncVersion),
        updatedAt,
      });
    },
  });

  useWallRemoteDeltaFeed({
    wallId: publishedReadOnly ? null : cloudWallId,
    enabled: hydrated && !publishedReadOnly,
    getBaselineSnapshot: () => acknowledgedCloudSnapshotRef.current,
    getSyncVersion: () => cloudSyncVersionRef.current,
    getViewportBounds: () => getViewportWindowBounds(camera),
    onRemoteSnapshot: ({ baselineSnapshot, viewportSnapshot, syncVersion }) => {
      acknowledgedCloudSnapshotRef.current = baselineSnapshot;
      cloudSyncVersionRef.current = syncVersion;
      void Promise.all([
        saveWallSyncVersion(syncVersion),
        saveWallCloudBaselineSnapshot(baselineSnapshot),
      ]);

      if (!viewportSnapshot) {
        return;
      }

      setWallAssets((previous) => mergeWallAssetRecords(previous, deriveWallAssetRecords(viewportSnapshot.notes)));
      mergeRemoteWindowSnapshot(viewportSnapshot, { syncVersion });
    },
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
      void commitEditedNoteText(editing.id, editing.text);
    }, 280);

    return () => clearTimeout(timer);
  }, [commitEditedNoteText, editing]);

  const markOpenIntentRef = useRef<(metric: "toolsPanelOpenMs" | "detailsPanelOpenMs" | "searchOpenMs" | "exportOpenMs" | "shortcutsOpenMs") => void>(() => {});

  const {
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    preferredFileConversionMode,
    setPreferredFileConversionMode,
    setSearchOpenTracked,
    setExportOpenTracked,
    setShortcutsOpenTracked,
    openHelpCenter,
    openFileConversion,
    toggleLeftPanel,
    openLeftPanel,
    closeLeftPanel,
    toggleRightPanel,
    openRightPanel,
    closeRightPanel,
  } = useWallPanelChrome({
    showDetailsPanel: layoutPrefs.showDetailsPanel,
    selectedNoteId: ui.selectedNoteId,
    isChromeHidden,
    markOpenIntent: (metric) => markOpenIntentRef.current(metric),
    setSearchOpen,
    setExportOpen,
    setShortcutsOpen,
    setFileConversionOpen,
  });

  const { markOpenIntent } = useWallTelemetry({
    leftPanelOpen,
    rightPanelOpen,
    isSearchOpen: ui.isSearchOpen,
    isExportOpen: ui.isExportOpen,
    isShortcutsOpen: ui.isShortcutsOpen,
  });
  markOpenIntentRef.current = markOpenIntent;

  const tour = useWallProductTour({
    enabled: !publishedReadOnly && !readingMode && !timelineViewActive && !presentationMode,
    noteCount: notes.length,
    leftPanelOpen,
    rightPanelOpen,
    searchOpen: ui.isSearchOpen,
    selectedNoteId: ui.selectedNoteId,
    openLeftPanel,
  });

  const { fetchBookmarkPreview, openBookmarkUrl } = useWallBookmarkOrchestration({
    isTimeLocked,
    hydrated,
    publishedReadOnly,
    notesMap,
    renderSnapshotNotes: renderSnapshot.notes,
  });

  const {
    playingAudioNoteId,
    playingAudioCurrentTimeSeconds,
    playingAudioDurationSeconds,
    submitImageNoteUrl,
    submitFileNoteUrl,
    submitAudioNoteUrl,
    submitVideoNoteUrl,
    selectImageNoteFile,
    selectFileNoteFile,
    selectAudioNoteFile,
    selectVideoNoteFile,
    renameImageNote,
    renameAudioNote,
    renameVideoNote,
    toggleAudioNotePlayback,
    toggleInlineVideoPlayback,
    openImageNote,
    openFileNote,
    openAudioNote,
    openVideoNote,
    downloadImageNote,
    downloadFileNote,
    downloadAudioNote,
    downloadVideoNote,
  } = useWallMediaNoteHandlers({
    isTimeLocked,
    renderSnapshotNotes: renderSnapshot.notes,
    openBookmarkUrl,
    setInlinePlayingVideoNoteId,
    inlinePlayingVideoNoteId,
    wallInlineVideoRef,
  });

  const {
    makeWebBookmarkNoteAtViewportCenter,
    makeImageNoteAtViewportCenter,
    makeFileNoteAtViewportCenter,
    makeAudioNoteAtViewportCenter,
    makeVideoNoteAtViewportCenter,
    makeWordNoteAtViewportCenter,
    makeQuoteNoteAtViewportCenter,
    makeCodeNoteAtViewportCenter,
    makeCanonNoteAtViewportCenter,
    makeJournalNoteAtViewportCenter,
    makeEisenhowerNoteAtViewportCenter,
  } = useWallNoteCreation({
    isTimeLocked,
    camera,
    viewport,
    lastColor: ui.lastColor ?? NOTE_COLORS[0],
    placeNewNote,
    openEditor,
    selectNote,
    setSelectedNoteIds,
    setReviewRevealMeaning,
  });

  const toggleVocabularyFlipRef = useRef<(noteId: string) => void>(() => {});

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
    presentationLength: presentationLengthForKeyboard,
    timelineEntriesLength: timelineEntries.length,
    timelineViewActive,
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
    toggleTimelineView,
    setShowHeatmap,
    setPresentationMode,
    setPresentationIndex,
    setReadingMode,
    createViewportNote: () => {
      if (isTimeLocked) {
        return undefined;
      }
      const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
      const position = placeNewNote(world);
      return createNote(position.x, position.y, ui.lastColor);
    },
    createCanonNote: makeCanonNoteAtViewportCenter,
    createJournalNote: makeJournalNoteAtViewportCenter,
    createQuoteNote: makeQuoteNoteAtViewportCenter,
    createEisenhowerNote: makeEisenhowerNoteAtViewportCenter,
    createWordNote: makeWordNoteAtViewportCenter,
    openEditor,
    redo,
    undo,
    setLinkingFromNote,
    duplicateNote,
    toggleVocabularyFlip: (noteId) => toggleVocabularyFlipRef.current(noteId),
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
    if (!timelineMode || timelineHistoryLoaded) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      const entries = await loadTimelineEntries(timelineHistoryLoadLimit);
      if (cancelled) {
        return;
      }
      setTimelineEntries((previous) => {
        if (previous.length === 0) {
          return entries;
        }

        const merged = new Map<number, TimelineEntry>();
        for (const entry of entries) {
          merged.set(entry.ts, entry);
        }
        for (const entry of previous) {
          merged.set(entry.ts, entry);
        }
        return [...merged.values()].sort((left, right) => left.ts - right.ts).slice(-timelineHistoryLoadLimit);
      });
      setTimelineHistoryLoaded(true);
      if (entries.length > 0) {
        setTimelineIndex((previous) => Math.max(previous, entries.length - 1));
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [timelineHistoryLoaded, timelineMode]);

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
    smartMergeSuggestions,
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
    presentationCameraEnabled: !hasNarrativePresentation,
    viewport,
    setCamera,
  });
  const displayNotesById = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(renderSnapshot.notes).map(([noteId, note]) => {
          const session = privateSessions[noteId];
          if (!isPrivateNote(note) || !session) {
            return [noteId, note];
          }
          return [
            noteId,
            {
              ...note,
              ...session.hidden,
              noteKind: session.hidden.noteKind ?? note.noteKind,
              tags: session.hidden.tags.length > 0 ? session.hidden.tags : note.tags,
              privateNote: undefined,
            },
          ];
        }),
      ) as Record<string, Note>,
    [privateSessions, renderSnapshot.notes],
  );
  const focusedNote = focusedNoteId ? renderSnapshot.notes[focusedNoteId] : undefined;
  const isFocusMode = Boolean(focusedNote);
  const renderVisibleNotes = useMemo(
    () => (focusedNote ? visibleNotes.filter((note) => note.id === focusedNote.id) : visibleNotes),
    [focusedNote, visibleNotes],
  );
  const displayVisibleNotes = useMemo(
    () => renderVisibleNotes.map((note) => displayNotesById[note.id] ?? note),
    [displayNotesById, renderVisibleNotes],
  );
  const renderVisibleZones = useMemo(() => (focusedNote ? [] : visibleZones), [focusedNote, visibleZones]);
  const renderVisibleLinks = useMemo(() => (focusedNote ? [] : visibleLinks), [focusedNote, visibleLinks]);
  const renderPathLinkIds = useMemo(() => (focusedNote ? new Set<string>() : pathLinkIds), [focusedNote, pathLinkIds]);
  const presentationLength = presentationModeType === "narrative" ? activePresentationSteps.length : presentationNotes.length;
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
  const viewportPriorityNoteIds = useMemo(
    () =>
      [
        focusedNoteId,
        ui.selectedNoteId,
        hoveredNoteId,
        draggingNoteId,
        ...activeSelectedNoteIds,
      ].filter((value): value is string => Boolean(value)),
    [activeSelectedNoteIds, draggingNoteId, focusedNoteId, hoveredNoteId, ui.selectedNoteId],
  );
  const {
    visibleNotes: layerVisibleNotes,
    visibleZones: layerVisibleZones,
    visibleLinks: layerVisibleLinks,
    renderDetailLevel: layerRenderDetailLevel,
    renderBudget: layerRenderBudget,
  } = useWallViewportWindow({
    notes: displayVisibleNotes,
    zones: renderVisibleZones,
    links: renderVisibleLinks,
    camera,
    viewport,
    enabled: !timelineViewActive && !readingMode,
    priorityNoteIds: viewportPriorityNoteIds,
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

  const {
    imageInsertState,
    imageInsertTargetLabel,
    openImageInsert,
    closeImageInsert,
    findNoteAtWorldPoint,
    handleImageFileInsert,
    handleImageUrlInsert,
    handleUnsplashPhotoInsert,
    handleUnsplashMoodboardInsert,
  } = useWallImageInsert({
    isTimeLocked,
    camera,
    viewport,
    renderSnapshotNotes: renderSnapshot.notes,
    renderVisibleNotes,
    occupiedNoteRects,
    placeNewNote,
    runHistoryGroup,
    selectNote,
    syncPrimarySelection,
    selectedNoteId: ui.selectedNoteId,
    activeSelectedNoteIds,
  });

  useEffect(() => {
    setPresentationIndex((previous) => clampPresentationIndex(previous, presentationLength || 1));
  }, [presentationLength, setPresentationIndex]);

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
    findOpenNotePosition: placeNewNote,
    createNote: createNote,
    createZone,
    applyTemplate,
    updateNote,
    addTagToNote,
    removeTagFromNote,
    createZoneGroup,
    runHistoryGroup,
  });

  const { animateCamera, stopCameraAnimation } = useAnimatedCamera(camera, setCamera);

  const { zoomToFit, zoomToSelection, focusBounds, focusNote, jumpToStaleNote, jumpToHighPriorityNote } = useWallCameraNavigation({
    camera,
    viewport,
    notesById: renderSnapshot.notes,
    visibleNotes: renderVisibleNotes,
    visibleZones: renderVisibleZones,
    selectedNotes,
    setFlashNote,
    syncPrimarySelection,
    computeContentBounds,
    fitBoundsCamera,
    animateCamera,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const targetNoteId = new URLSearchParams(window.location.search).get("note");
    if (!targetNoteId) {
      handledDeepLinkNoteRef.current = null;
      return;
    }
    if (handledDeepLinkNoteRef.current === targetNoteId) {
      return;
    }
    if (!renderSnapshot.notes[targetNoteId]) {
      return;
    }
    handledDeepLinkNoteRef.current = targetNoteId;
    focusNote(targetNoteId);
  }, [focusNote, renderSnapshot.notes]);

  const { stepZoom, resetZoom } = useWallZoomControls({ camera, viewport, animateCamera });

  const zoomToFitTracked = useCallback(() => {
    tour.markFitUsed();
    zoomToFit();
  }, [tour, zoomToFit]);

  const revealNoteFromTimeline = useCallback(
    (noteId: string) => {
      setTimelineViewActive(false);
      focusNote(noteId);
    },
    [focusNote],
  );

  const { smartMergeItems, previewSmartMerge, applySmartMerge } = useWallSmartMerge({
    isTimeLocked,
    renderSnapshotNotes: renderSnapshot.notes,
    smartMergeSuggestions,
    syncPrimarySelection,
    selectNote,
    focusBounds,
  });

  const { toggleDetailsSection, togglePresentationMode, toggleReadingMode, toggleTimelineMode, saveCurrentRecallSearch, applySavedRecallSearch } = useWallUiActions({
    readingMode, presentationMode, timelineEntriesLength: timelineEntries.length, timelineModeRef, setPresentationMode, setPresentationIndex, setReadingMode,
    setQuickCaptureOpen, setSearchOpen: setSearchOpenTracked, setExportOpen: setExportOpenTracked, setTimelineMode, setTimelineIndex, setIsTimelinePlaying,
    setDetailsSectionsOpen, recallQuery, recallZoneId, recallTag, recallDateFilter,
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
    hasNoteSelection,
    showContextColor,
    hasContextActions,
    displayedTags,
    statusMessage,
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
    draggingNoteId,
    camera,
    publishedReadOnly,
  });
  const selectedVocabularyNote = selectedNote && isVocabularyNote(selectedNote) ? selectedNote : undefined;
  const selectedPrivateNote = primarySelectedNote && isPrivateNote(primarySelectedNote) ? primarySelectedNote : undefined;
  const selectedPrivateNoteSupported = Boolean(primarySelectedNote && (isPrivateNote(primarySelectedNote) || canProtectNote(primarySelectedNote)));
  const isSelectedPrivateUnlocked = Boolean(selectedPrivateNote && privateSessions[selectedPrivateNote.id]);

  const {
    vocabularyDueNotes,
    vocabularyFocusNotes,
    reviewedTodayCount,
    toggleVocabularyFlip,
    focusNextDueWord,
    updateVocabularyField,
    reviewSelectedWord,
  } = useWallVocabularySession({
    isTimeLocked,
    notes,
    wallClockTs,
    selectedVocabularyNote,
    focusNote,
    setReviewRevealMeaning,
  });
  toggleVocabularyFlipRef.current = toggleVocabularyFlip;

  const commandPaletteCommands = useWallCommandPalette({
    isTimeLocked,
    canUndo,
    canRedo,
    boxSelectMode,
    readingMode,
    presentationMode,
    quickCaptureOpen,
    showHeatmap,
    leftPanelOpen,
    rightPanelOpen,
    timelineMode,
    timelineViewActive,
    showClusters: ui.showClusters,
    spatialPrefs,
    selectedNotesCount: selectedNotes.length,
    vocabularyDueNotesCount: vocabularyDueNotes.length,
    selectedVocabularyNote,
    zoneGroups,
    makeNoteAtViewportCenter,
    makeCanonNoteAtViewportCenter,
    makeJournalNoteAtViewportCenter,
    makeQuoteNoteAtViewportCenter,
    makeEisenhowerNoteAtViewportCenter,
    makeWordNoteAtViewportCenter,
    makeZoneAtViewportCenter,
    focusNextDueWord,
    toggleVocabularyFlip,
    setQuickCaptureOpen,
    setExportOpenTracked,
    openFileConversion,
    undo,
    redo,
    toggleReadingMode,
    togglePresentationMode,
    zoomToFitTracked,
    zoomToSelection,
    openTour: tour.openTour,
    toggleTimelineMode,
    toggleTimelineView,
    setShowHeatmap,
    toggleLeftPanel,
    openLeftPanel,
    closeLeftPanel,
    toggleRightPanel,
    openRightPanel,
    closeRightPanel,
    setBoxSelectMode,
    setShowClusters,
    collapseAllZoneGroups,
    expandAllZoneGroups,
    setSpatialPrefs,
    openHelpCenter,
    setShortcutsOpenTracked,
  });

  const {
    chrome: wallSessionChrome,
    details: wallSessionDetails,
    modals: wallSessionModals,
  } = useWallSessionBindings({
    isTimeLocked,
    camera,
    renderSnapshotNotes: renderSnapshot.notes,
    renderSnapshotLinks: renderSnapshot.links,
    toScreenPoint,
    editing,
    setEditing,
    handleEditorBlur,
    editTagInput,
    setEditTagInput,
    editTagRenameFrom,
    setEditTagRenameFrom,
    addTagToNote,
    removeTagFromNote,
    renameTagOnNote,
    updateNote,
    openImageInsert,
    wikiLinkOptions,
    fetchBookmarkPreview,
    openBookmarkUrl,
    selectImageNoteFile,
    submitImageNoteUrl,
    renameImageNote,
    openImageNote,
    downloadImageNote,
    selectFileNoteFile,
    submitFileNoteUrl,
    openFileNote,
    downloadFileNote,
    selectAudioNoteFile,
    submitAudioNoteUrl,
    renameAudioNote,
    openAudioNote,
    downloadAudioNote,
    selectVideoNoteFile,
    submitVideoNoteUrl,
    renameVideoNote,
    openVideoNote,
    downloadVideoNote,
    selectedNotesCount: selectedNotes.length,
    showDetailsPanel: layoutPrefs.showDetailsPanel,
    rightPanelOpen,
    stepZoom,
    resetZoom,
    zoomToFitTracked,
    zoomToSelection,
    showHeatmap,
    timelineEntries,
    jumpToTimelineDay,
    timelineMode,
    timelineIndex,
    isTimelinePlaying,
    setIsTimelinePlaying,
    setTimelineIndex,
    presentationMode,
    presentationIndex,
    presentationLength,
    presentationModeType,
    narrativePathOptions,
    activePresentationPathId,
    activePresentationStepTalkingPoints: activePresentationStep?.talkingPoints ?? "",
    createNarrativePath,
    handleNarrativePathChange,
    addNarrativeStep,
    deleteNarrativeStep,
    updateNarrativeTalkingPoints,
    captureNarrativeStepCamera,
    setPresentationIndex,
    setPresentationMode,
    linkMenu,
    setLinkMenu,
    deleteLink,
    updateLinkType,
    maxViewportWidth,
    maxViewportHeight,
    tagPreviewScreen,
    tagPreviewNote,
    tagPreviewPalette,
    renderVisibleNotesCount: renderVisibleNotes.length,
    historyUndoDepth,
    historyRedoDepth,
    notes,
    jumpToStaleNote,
    jumpToHighPriorityNote,
    clearHistory,
    toggleDetailsSection,
    setRightPanelOpen,
    ui: {
      templateType: ui.templateType,
      selectedNoteId: ui.selectedNoteId,
      linkingFromNoteId: ui.linkingFromNoteId,
      selectedZoneId: ui.selectedZoneId,
      isExportOpen: ui.isExportOpen,
      isShortcutsOpen: ui.isShortcutsOpen,
      isFileConversionOpen: ui.isFileConversionOpen,
    },
    setTemplateType,
    applySelectedTemplate,
    tagInput,
    setTagInput,
    addTagToSelectedNote,
    primarySelectedNote,
    activeSelectedNoteIdsCount: activeSelectedNoteIds.length,
    displayedTags,
    removeTagFromSelectedNote,
    focusedNoteId,
    backlinksByNoteId,
    focusNote,
    duplicateNote,
    togglePinOnNote,
    toggleHighlightOnNote,
    toggleFocusNote,
    setLinkingFromNote,
    selectedPrivateNoteSupported,
    selectedPrivateNote,
    isSelectedPrivateUnlocked,
    openPrivateModal,
    lockPrivateNote,
    privateSessions,
    syncWikiLinksForNote,
    recallQuery,
    setRecallQuery,
    recallZoneId,
    setRecallZoneId,
    recallTag,
    setRecallTag,
    recallDateFilter,
    setRecallDateFilter,
    visibleZones,
    availableRecallTags,
    saveCurrentRecallSearch,
    savedRecallSearches,
    applySavedRecallSearch,
    setSavedRecallSearches,
    selectedVocabularyNote,
    vocabularyDueNotesCount: vocabularyDueNotes.length,
    vocabularyFocusNotesCount: vocabularyFocusNotes.length,
    reviewedTodayCount,
    reviewRevealMeaning,
    setReviewRevealMeaning,
    toggleVocabularyFlip,
    makeWordNoteAtViewportCenter,
    focusNextDueWord,
    updateVocabularyField,
    reviewSelectedWord,
    groupLabelInput,
    setGroupLabelInput,
    selectedZone,
    selectedGroup,
    zoneGroups,
    createGroupFromSelectedZone,
    assignZoneToGroup,
    selectGroup,
    toggleGroupCollapse,
    collapseAllZoneGroups,
    expandAllZoneGroups,
    deleteGroup,
    clearNoteSelection,
    showAutoTagGroups,
    setShowAutoTagGroups,
    autoTagGroups,
    focusBounds,
    smartMergeItems,
    previewSmartMerge,
    applySmartMerge,
    quickCaptureOpen,
    setQuickCaptureOpen,
    captureNotes,
    exportPng,
    exportPdf,
    exportMarkdown,
    exportJson,
    importJson,
    publishReadOnlySnapshot,
    backupReminderCadence,
    setBackupReminderCadence,
    helpOpen,
    setHelpOpen,
    openTour: tour.openTour,
    preferredFileConversionMode,
    setFileConversionOpen,
    setPreferredFileConversionMode,
    settingsOpen,
    setSettingsOpen,
    userEmail,
    userProfile,
    imageInsertState,
    imageInsertTargetLabel,
    closeImageInsert,
    handleImageFileInsert,
    handleImageUrlInsert,
    handleUnsplashPhotoInsert,
    handleUnsplashMoodboardInsert,
    setExportOpenTracked,
    setShortcutsOpenTracked,
  });

  const { showChromeHeader, spatialView, chromeHeader, inCanvasChrome } = useWallSpatialBindings({
    containerRef,
    stageRef,
    noteTransformerRef,
    zoneTransformerRef,
    noteNodeRefs,
    zoneNodeRefs,
    dragSelectionStartRef,
    dragAnchorRef,
    dragSingleStartRef,
    wallInlineVideoRef,
    hydrated,
    readingMode,
    timelineViewActive,
    isFocusMode,
    isImageDragOver,
    isTimeLocked,
    isSpaceDown,
    isMiddleDragging,
    isLeftCanvasDragging,
    boxSelectMode,
    camera,
    viewport,
    spatialPrefs,
    layoutPrefs,
    setCamera,
    setIsMiddleDragging,
    setIsLeftCanvasDragging,
    setIsImageDragOver,
    setGuideLines,
    setFocusedNoteId,
    setInlinePlayingVideoNoteId,
    setEditing,
    setHoveredNoteId,
    setDraggingNoteId,
    setResizingNoteDrafts,
    setLinkMenu,
    selectionBox,
    setSelectionBox,
    guideLines,
    showHeatmap,
    heatmapReferenceTs: activeTimelineEntry?.ts ?? wallClockTs,
    layerVisibleNotes,
    layerVisibleZones,
    layerVisibleLinks,
    layerRenderDetailLevel,
    layerRenderBudget,
    resolvedWallAssets,
    activeSelectedNoteIds,
    displayNotesById,
    renderSnapshotNotes: renderSnapshot.notes,
    renderPathLinkIds,
    clusterBounds,
    autoTagGroups,
    autoTagLabelLayout,
    showAutoTagGroups,
    wikiLinksByNoteId,
    resizingNoteDrafts,
    hoveredNoteId,
    draggingNoteId,
    inlinePlayingVideoNoteId,
    inlinePlayingVideoScreenRect,
    playingAudioNoteId,
    playingAudioCurrentTimeSeconds,
    playingAudioDurationSeconds,
    selectedNoteId: ui.selectedNoteId,
    selectedLinkId: ui.selectedLinkId,
    selectedZoneId: ui.selectedZoneId,
    flashNoteId: ui.flashNoteId,
    linkingFromNoteId: ui.linkingFromNoteId,
    linkType: ui.linkType,
    editingId: editing?.id,
    stopCameraAnimation,
    resetSelection,
    clearNoteSelection,
    finalizeBoxSelection,
    findNoteAtWorldPoint,
    handleImageFileInsert,
    syncPrimarySelection,
    selectSingleNote,
    toggleSelectNote,
    selectLink,
    selectZone,
    selectGroup,
    setLinkingFromNote,
    openEditor,
    openImageInsert,
    resolveSnappedPosition,
    runHistoryGroup,
    moveNote,
    updateNote,
    moveZone,
    updateZone,
    createLink,
    toggleVocabularyFlip,
    duplicateNoteAt,
    focusNote,
    openBookmarkUrl,
    downloadFileNote,
    toggleAudioNotePlayback,
    openAudioNote,
    downloadAudioNote,
    toggleInlineVideoPlayback,
    downloadVideoNote,
    showClusters: ui.showClusters,
    presentationMode,
    publishedReadOnly,
    leftPanelOpen,
    rightPanelOpen,
    quickCaptureOpen,
    hasContextActions,
    showContextColor,
    toolbarSurface,
    toolbarLabel,
    toolbarDivider,
    selectedNotes,
    selectedNote,
    uiLastColor: ui.lastColor ?? NOTE_COLORS[0],
    statusMessage,
    userEmail,
    userProfile,
    cloudWallId,
    isSyncing,
    localSaveState,
    hasPendingSync,
    lastSyncedAt,
    syncError,
    onToggleLeftPanel: toggleLeftPanel,
    onToggleRightPanel: toggleRightPanel,
    onOpenCommandPalette: () => setSearchOpenTracked(true),
    onToggleQuickCapture: () => setQuickCaptureOpen((previous) => !previous),
    onToggleTimelineView: toggleTimelineView,
    onTogglePresentationMode: togglePresentationMode,
    onOpenShortcuts: () => setShortcutsOpenTracked(true),
    onOpenHelp: openHelpCenter,
    onOpenSettings: () => setSettingsOpen(true),
    onApplyColorToSelection: applyColorToSelection,
    onSyncNow: syncNow,
    isChromeHidden,
    hasNoteSelection,
    controlsMode,
    toolbarBtn,
    toolbarBtnPrimary,
    toolbarBtnActive,
    toolbarSelect,
    tourCoachmark: tour.activeCoachmark,
    onTourNext: tour.nextSpineStep,
    onTourSkip: tour.skipTour,
    onTourDismissTip: tour.dismissCurrentTip,
    onTourDismissComplete: tour.dismissCompletion,
    notes,
    visibleNotes,
    recallQuery,
    commandPaletteCommands,
    availableRecallTags,
    isSearchOpen: ui.isSearchOpen,
    setLeftPanelOpen,
    setBoxSelectMode,
    setSpatialPrefs,
    setLinkType,
    setShowClusters,
    setSearchOpenTracked,
    setRecallQuery,
    setTimelineViewActive,
    selectNote,
    revealNoteFromTimeline,
    makeNoteAtViewportCenter,
    makeCanonNoteAtViewportCenter,
    makeJournalNoteAtViewportCenter,
    makeQuoteNoteAtViewportCenter,
    makeCodeNoteAtViewportCenter,
    makeWebBookmarkNoteAtViewportCenter,
    makeImageNoteAtViewportCenter,
    makeFileNoteAtViewportCenter,
    makeAudioNoteAtViewportCenter,
    makeVideoNoteAtViewportCenter,
    makeEisenhowerNoteAtViewportCenter,
    makeWordNoteAtViewportCenter,
    makeZoneAtViewportCenter,
    openFileConversion,
  });

  return (
    <WallSessionProvider
      interaction={{
        selectedNoteIds,
        editingNoteId: editing?.id ?? null,
        focusedNoteId,
        hoveredNoteId,
        draggingNoteId,
        boxSelectMode,
      }}
      sync={{
        cloudWallId,
        isSyncing,
        hasPendingSync,
        syncError,
        lastSyncedAt,
        localSaveState,
        publishedReadOnly,
      }}
      layout={{
        layoutPrefs,
        leftPanelOpen,
        rightPanelOpen,
        detailsSectionsOpen,
        presentationMode,
        readingMode,
        isChromeHidden,
        timelineViewActive,
        controlsMode,
        spatialPrefs,
      }}
      chrome={wallSessionChrome}
      details={wallSessionDetails}
      modals={wallSessionModals}
    >
    <div className="wall-atelier-shell flex h-screen flex-col text-[var(--color-text)]">
      {showChromeHeader ? <WallChromeHeader {...chromeHeader} /> : null}

      <WallSpatialView
        {...spatialView}
        chromeSlot={<WallInCanvasChrome {...inCanvasChrome} />}
      />

      <PrivateNoteModal
        open={privateModal.open}
        mode={privateModal.mode}
        noteLabel={privateModalNote ? privateNoteTitle(privateModalNote) : "Private note"}
        error={privateModal.error}
        onClose={closePrivateModal}
        onSubmit={(password) => { void submitPrivateModal(password); }}
      />

      <WallGlobalModals />
    </div>
    </WallSessionProvider>
  );
};
