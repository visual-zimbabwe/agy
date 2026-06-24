"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import type Konva from "konva";


import type { DetailsSectionState, RecallDateFilter } from "@/components/wall/details/DetailsSectionTypes";
import { useWallActions } from "@/components/wall/useWallActions";
import {
  waitForPaint,
} from "@/components/wall/wall-canvas-helpers";
import {
  fitBoundsCamera,
  toScreenPoint,
  toWorldPoint,
  zoneContainsNote,
} from "@/components/wall/wall-coordinates";
import { useWallCanvasEffects } from "@/components/wall/useWallCanvasEffects";
import { useWallDisplayLayer } from "@/components/wall/useWallDisplayLayer";
import { useWallKeyboardBindings } from "@/components/wall/useWallKeyboardBindings";
import { useWallNoteQuickActions } from "@/components/wall/useWallNoteQuickActions";
import { useWallRenderSnapshot } from "@/components/wall/useWallRenderSnapshot";
import { useWallTimelineHistory } from "@/components/wall/useWallTimelineHistory";
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
import { useWallZoomControls } from "@/components/wall/useWallZoomControls";
import { useWallProductTour } from "@/components/wall/useWallProductTour";
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
  deleteGroup,
  deleteLink,
  duplicateNote,
  duplicateNoteAt,
  moveNote,
  moveZone,
  toggleGroupCollapse,
  updateNote,
  updateLinkType,
  updateZone,
} from "@/features/wall/commands";
import { deriveWallAssetRecords, mergeWallAssetRecords } from "@/features/wall/asset-records";
import { canProtectNote, isPrivateNote } from "@/features/wall/private-notes";
import { NOTE_COLORS } from "@/features/wall/constants";
import { useWallStore } from "@/features/wall/store";
import type { TimelineEntry } from "@/features/wall/storage";
import { saveWallCloudBaselineSnapshot, saveWallSyncVersion } from "@/features/wall/storage";
import type { WallAssetMap } from "@/features/wall/types";
import { createViewportWallBounds } from "@/features/wall/windowing";
import type { AppUserProfile } from "@/lib/profile";

import { computeContentBounds, notesToMarkdown } from "@/lib/wall-utils";

import type { LinkContextMenuState } from "@/components/wall/session/wall-chrome-context";

type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type WallCanvasProps = {
  userProfile?: AppUserProfile;
};

export const useWallCanvasOrchestration = ({ userProfile }: WallCanvasProps) => {
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
    zoneGroups: true,
    tagGroups: false,
  });
  const [presentationMode, setPresentationMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [focusedNoteId, setFocusedNoteId] = useState<string | undefined>(undefined);
  const [inlinePlayingVideoNoteId, setInlinePlayingVideoNoteId] = useState<string | undefined>(undefined);
  const handledDeepLinkNoteRef = useRef<string | null>(null);
  const wallInlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const {
    publishedReadOnly,
    renderSnapshot,
    resolvedWallAssets,
    inlinePlayingVideoScreenRect,
    notes,
    zones,
    zoneGroups,
    links,
    wikiLinkOptions,
    wikiLinksByNoteId,
    backlinksByNoteId,
    occupiedNoteRects,
    placeNewNote,
    activeTimelineEntry,
  } = useWallRenderSnapshot({
    notesMap,
    zonesMap,
    zoneGroupsMap,
    noteGroupsMap,
    linksMap,
    camera,
    lastColor: ui.lastColor,
    timelineMode,
    timelineIndex,
    timelineEntries,
    wallAssets,
    inlinePlayingVideoNoteId,
    viewport,
  });
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
  const isTimeLocked = timelineMode || timelineViewActive || publishedReadOnly || presentationMode || readingMode;
  const isChromeHidden = presentationMode || readingMode;
  timelineModeRef.current = timelineMode;
  const [wallClockTs, setWallClockTs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setWallClockTs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
  });

  const { jumpToTimelineDay } = useWallTimeline({
    timelineMode,
    isTimelinePlaying,
    timelineEntries,
    setTimelineMode,
    setIsTimelinePlaying,
    setTimelineIndex,
  });

  useWallTimelineHistory({
    timelineMode,
    setTimelineEntries,
    setTimelineIndex,
  });

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
    presentationCameraEnabled: !hasNarrativePresentation,
    viewport,
    setCamera,
  });
  const {
    displayNotesById,
    isFocusMode,
    renderVisibleNotes,
    displayVisibleNotes,
    renderVisibleZones,
    renderVisibleLinks,
    renderPathLinkIds,
  } = useWallDisplayLayer({
    renderSnapshotNotes: renderSnapshot.notes,
    privateSessions,
    focusedNoteId,
    visibleNotes,
    visibleZones,
    visibleLinks,
    pathLinkIds,
  });
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

  const {
    selectSingleNote,
    toggleFocusNote,
    togglePinOnNote,
    toggleHighlightOnNote,
    collapseAllZoneGroups,
    expandAllZoneGroups,
  } = useWallNoteQuickActions({
    isTimeLocked,
    renderSnapshotNotes: renderSnapshot.notes,
    setEditing,
    syncPrimarySelection,
    selectNote,
    setFocusedNoteId,
  });

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

  useWallKeyboardBindings({
    camera,
    viewport,
    notes,
    notesMap,
    renderSnapshotNotes: renderSnapshot.notes,
    ui,
    selectedNoteIds,
    editing,
    isTimeLocked,
    readingMode,
    presentationMode,
    presentationLengthForKeyboard,
    timelineEntriesLength: timelineEntries.length,
    timelineViewActive,
    timelineModeRef,
    setIsSpaceDown,
    setShortcutsOpenTracked,
    setSearchOpenTracked,
    setExportOpenTracked,
    setQuickCaptureOpen,
    setEditing,
    setGuideLines,
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
    openEditor,
    redo,
    undo,
    setLinkingFromNote,
    makeCanonNoteAtViewportCenter,
    makeJournalNoteAtViewportCenter,
    makeQuoteNoteAtViewportCenter,
    makeEisenhowerNoteAtViewportCenter,
    placeNewNote,
  });

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

  const { toggleDetailsSection, togglePresentationMode, toggleReadingMode, toggleTimelineMode, saveCurrentRecallSearch, applySavedRecallSearch } = useWallUiActions({
    readingMode, presentationMode, timelineEntriesLength: timelineEntries.length, timelineModeRef, setPresentationMode, setPresentationIndex, setReadingMode,
    setQuickCaptureOpen, setSearchOpen: setSearchOpenTracked, setExportOpen: setExportOpenTracked, setTimelineMode, setTimelineIndex, setIsTimelinePlaying,
    setDetailsSectionsOpen, recallQuery, recallZoneId, recallTag, recallDateFilter,
    savedRecallSearchesLength: savedRecallSearches.length, setSavedRecallSearches, setRecallQuery, setRecallZoneId, setRecallTag, setRecallDateFilter,
  });

  useWallCanvasEffects({
    containerRef,
    noteTransformerRef,
    zoneTransformerRef,
    noteNodeRefs,
    zoneNodeRefs,
    handledDeepLinkNoteRef,
    setViewport,
    isTimeLocked,
    renderSnapshotNotes: renderSnapshot.notes,
    uiSelectedNoteId: ui.selectedNoteId,
    uiSelectedZoneId: ui.selectedZoneId,
    uiSelectedNoteGroupId: ui.selectedNoteGroupId,
    uiFlashNoteId: ui.flashNoteId,
    editing,
    commitEditedNoteText,
    linkMenu,
    setLinkMenu,
    setFlashNote,
    presentationLength,
    setPresentationIndex,
    renderVisibleNotes,
    renderVisibleZones,
    renderSnapshotNoteGroups: renderSnapshot.noteGroups,
    selectedNoteIds,
    setSelectedNoteIds,
    selectNote,
    selectZone,
    selectGroup,
    selectNoteGroup,
    focusedNoteId,
    setFocusedNoteId,
    visibleNotes,
    focusNote,
  });

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
  const selectedPrivateNote = primarySelectedNote && isPrivateNote(primarySelectedNote) ? primarySelectedNote : undefined;
  const selectedPrivateNoteSupported = Boolean(primarySelectedNote && (isPrivateNote(primarySelectedNote) || canProtectNote(primarySelectedNote)));
  const isSelectedPrivateUnlocked = Boolean(selectedPrivateNote && privateSessions[selectedPrivateNote.id]);

  const commandPaletteCommands = useWallCommandPalette({
    isTimeLocked,
    canUndo,
    canRedo,
    boxSelectMode,
    readingMode,
    presentationMode,
    quickCaptureOpen,
    showHeatmap,
    rightPanelOpen,
    timelineMode,
    timelineViewActive,
    showClusters: ui.showClusters,
    spatialPrefs,
    selectedNotesCount: selectedNotes.length,
    zoneGroups,
    makeNoteAtViewportCenter,
    makeCanonNoteAtViewportCenter,
    makeJournalNoteAtViewportCenter,
    makeQuoteNoteAtViewportCenter,
    makeEisenhowerNoteAtViewportCenter,
    makeZoneAtViewportCenter,
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
    timelineMode,
    templateType: ui.templateType,
    setBoxSelectMode,
    setSpatialPrefs,
    setLinkType,
    setShowClusters,
    setSearchOpenTracked,
    setRecallQuery,
    setTimelineViewActive,
    selectNote,
    revealNoteFromTimeline,
    makeZoneAtViewportCenter,
    openFileConversion,
    onTemplateTypeChange: setTemplateType,
    onApplyTemplate: applySelectedTemplate,
    onToggleReadingMode: toggleReadingMode,
    onToggleHeatmap: () => setShowHeatmap((previous) => !previous),
    onToggleTimelineMode: toggleTimelineMode,
  });

  return {
    selectedNoteIds,
    editing,
    focusedNoteId,
    hoveredNoteId,
    draggingNoteId,
    boxSelectMode,
    cloudWallId,
    isSyncing,
    hasPendingSync,
    syncError,
    lastSyncedAt,
    localSaveState,
    publishedReadOnly,
    layoutPrefs,
    rightPanelOpen,
    detailsSectionsOpen,
    presentationMode,
    readingMode,
    isChromeHidden,
    timelineViewActive,
    spatialPrefs,
    chrome: wallSessionChrome,
    details: wallSessionDetails,
    modals: wallSessionModals,
    showChromeHeader,
    spatialView,
    chromeHeader,
    inCanvasChrome,
    privateModal,
    privateModalNote,
    closePrivateModal,
    submitPrivateModal,
  };
};
