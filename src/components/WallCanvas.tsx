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
import { WallTimelineView } from "@/components/wall/WallTimelineView";
import {
  backupReminderCadenceStorageKey,
  backupReminderLastPromptStorageKey,
  controlsModeStorageKey,
  legacyBackupReminderCadenceStorageKeys,
  legacyPresentationPathsStorageKeys,
  legacyRecallStorageKeys,
  legacySpatialPrefsStorageKeys,
  downloadDataUrl,
  downloadJsonFile,
  downloadTextFile,
  dragSnapThreshold,
  fitBoundsCamera,
  getNoteTextStyle,
  getNoteTextFontFamily,
  layoutPrefsStorageKey,
  linkColorByType,
  linkPoints,
  linkStrokeByType,
  makeDownloadId,
  noteTagChipPalette,
  presentationPathsStorageKey,
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
import { useApodNotes } from "@/components/wall/useApodNotes";
import { useEconomistNotes } from "@/components/wall/useEconomistNotes";
import { usePoetryNotes } from "@/components/wall/usePoetryNotes";
import { useCurrencySystemNote } from "@/components/wall/useCurrencySystemNote";
import { useWallBackupActions } from "@/components/wall/useWallBackupActions";
import { useAnimatedCamera } from "@/components/wall/useAnimatedCamera";
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
  createCanonNote,
  createApodNote,
  createEconomistNote,
  createPoetryNote,
  createOrRefreshJokerNote,
  createOrRefreshThroneNote,
  createJournalNote,
  createQuoteNote,
  createWebBookmarkNote,
  createEisenhowerNote,
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
  moveZone,
  mergeNotes,
  setAllGroupsCollapsed,
  toggleGroupCollapse,
  updateNote,
  updateLinkType,
  updateZone,
} from "@/features/wall/commands";
import { createBookmarkNoteState, getBookmarkPreferredSize, isBookmarkCacheFresh, isBookmarkMetadataRich, readBookmarkCacheEntry, shouldAutoResizeBookmarkNote, WEB_BOOKMARK_DEFAULTS, writeBookmarkCacheEntry } from "@/features/wall/bookmarks";
import { EISENHOWER_NOTE_DEFAULTS, LINK_TYPES, NOTE_COLORS, NOTE_DEFAULTS, ZONE_DEFAULTS } from "@/features/wall/constants";
import { isCurrencyNote } from "@/features/wall/currency";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import type { TimelineEntry } from "@/features/wall/storage";
import type { PersistedWallState, WebBookmarkMetadata } from "@/features/wall/types";
import type { UnsplashPhoto } from "@/lib/unsplash";
import { extractWikiLinks, findNoteByWikiTitle, getNoteWikiTitle, normalizeWikiTitle } from "@/features/wall/wiki-links";
import { applyVocabularyReview, createVocabularyNote, dayStartTs, isVocabularyDue, isVocabularyNote } from "@/features/wall/vocabulary";
import { decodeSnapshotFromUrl, readSnapshotParamFromLocation } from "@/lib/publish";
import {
  accountSettingsUpdatedEventName,
  readStoredControlsMode,
  readStoredWallLayoutPrefs,
} from "@/lib/account-settings";
import {
  addPresentationStep,
  clampPresentationIndex,
  createPresentationPath,
  makeDefaultPathTitle,
  parsePresentationPathsPayload,
  type PresentationPath,
} from "@/lib/presentation-paths";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";
import { parseTaggedText } from "@/lib/tag-utils";
import { computeContentBounds, notesToMarkdown } from "@/lib/wall-utils";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";
import { getImageFileFromClipboard, getImageFilesFromDataTransfer, readImageFileAsDataUrl } from "@/lib/wall-image-upload";
import { trackUnsplashDownload } from "@/lib/unsplash-client";

type EditingState = {
  id: string;
  text: string;
  focusField?: string;
};

type ImageInsertState = {
  open: boolean;
  noteId?: string;
  x?: number;
  y?: number;
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
type ControlsMode = "basic" | "advanced";
type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
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
  const [imageInsertState, setImageInsertState] = useState<ImageInsertState>({ open: false });
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
  const [wallClockTs, setWallClockTs] = useState(() => Date.now());
  const [cloudWallId, setCloudWallId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [localSaveState, setLocalSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [hasPendingSync, setHasPendingSync] = useState(false);
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
  const [controlsMode, setControlsMode] = useState<ControlsMode>("basic");
  const [spatialPrefs, setSpatialPrefs] = useState<SpatialPreferences>(defaultSpatialPrefs);
  const [backupReminderCadence, setBackupReminderCadence] = useState<"off" | "daily" | "weekly">("off");
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
  const [preferredFileConversionMode, setPreferredFileConversionMode] = useState<"pdf_to_word" | "word_to_pdf" | null>(null);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [presentationPaths, setPresentationPaths] = useState<PresentationPath[]>([]);
  const [activePresentationPathId, setActivePresentationPathId] = useState("");
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const bookmarkUpgradeRequestsRef = useRef<Record<string, string>>({});
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
  const hasJokerNote = useMemo(() => notes.some((note) => note.noteKind === "joker"), [notes]);
  const hasThroneNote = useMemo(() => notes.some((note) => note.noteKind === "throne"), [notes]);
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
  const vocabularyNotes = useMemo(() => notes.filter((note) => isVocabularyNote(note)), [notes]);
  const vocabularyDueNotes = useMemo(
    () =>
      [...vocabularyNotes]
        .filter((note) => isVocabularyDue(note, wallClockTs))
        .sort((left, right) => left.vocabulary.nextReviewAt - right.vocabulary.nextReviewAt),
    [vocabularyNotes, wallClockTs],
  );
  const vocabularyFocusNotes = useMemo(() => vocabularyNotes.filter((note) => note.vocabulary.isFocus), [vocabularyNotes]);
  const reviewedTodayCount = useMemo(() => {
    const start = dayStartTs(wallClockTs);
    return vocabularyNotes.filter((note) => (note.vocabulary.lastReviewedAt ?? 0) >= start).length;
  }, [vocabularyNotes, wallClockTs]);
  const isTimeLocked = timelineMode || timelineViewActive || publishedReadOnly || presentationMode || readingMode;
  const isChromeHidden = presentationMode || readingMode;
  timelineModeRef.current = timelineMode;
  const activePresentationPath = useMemo(
    () => presentationPaths.find((path) => path.id === activePresentationPathId),
    [activePresentationPathId, presentationPaths],
  );
  const activePresentationSteps = activePresentationPath?.steps ?? [];
  const hasNarrativePresentation = activePresentationSteps.length > 0;
  const presentationLengthForKeyboard = hasNarrativePresentation ? activePresentationSteps.length : notes.length;

  const toggleTimelineView = useCallback(() => {
    setTimelineViewActive((previous) => !previous);
  }, []);

  useEffect(() => {
    if (!timelineViewActive) {
      return;
    }
    setEditing(null);
    setQuickCaptureOpen(false);
    setSearchOpen(false);
    setExportOpen(false);
    setIsTimelinePlaying(false);
  }, [setExportOpen, setSearchOpen, timelineViewActive]);

  const syncWikiLinksForNote = useCallback((sourceNoteId: string, text: string) => {
    const existingSource = useWallStore.getState().notes[sourceNoteId];
    if (!existingSource) {
      return;
    }

    const desiredTitles = [...new Map(
      extractWikiLinks(text)
        .map((match) => [normalizeWikiTitle(match.title), match.title.trim()] as const)
        .filter((entry) => Boolean(entry[0]) && Boolean(entry[1])),
    ).values()];

    const desiredTargets = new Map<string, string>();
    let createdCount = 0;

      for (const title of desiredTitles) {
        let target = findNoteByWikiTitle(useWallStore.getState().notes, title, sourceNoteId);
        if (!target) {
          const source = useWallStore.getState().notes[sourceNoteId];
          if (!source) {
            continue;
          }
          const createdId = createNote(source.x + source.w + 96 + (createdCount % 2) * 28, source.y + createdCount * 42, source.color);
          updateNote(createdId, { text: title });
          target = useWallStore.getState().notes[createdId];
          createdCount += 1;
        }
        if (!target || target.id === sourceNoteId || desiredTargets.has(target.id)) {
          continue;
        }
        desiredTargets.set(target.id, title);
      }

    const nextState = useWallStore.getState();
    const existingWikiLinks = Object.values(nextState.links).filter((link) => link.fromNoteId === sourceNoteId && link.type === "wiki");

    for (const [targetId, title] of desiredTargets) {
        const existingLink = existingWikiLinks.find((link) => link.toNoteId === targetId);
        if (existingLink) {
          if (existingLink.label !== title) {
            nextState.patchLink(existingLink.id, { label: title });
          }
          continue;
        }
        createLink(sourceNoteId, targetId, "wiki", title);
      }

    for (const link of existingWikiLinks) {
        if (!desiredTargets.has(link.toNoteId)) {
          nextState.removeLink(link.id);
        }
      }

    nextState.selectNote(sourceNoteId);
    setSelectedNoteIds([sourceNoteId]);
  }, [setSelectedNoteIds]);

  const commitEditedNoteText = useCallback((noteId: string, rawText: string) => {
    const current = renderSnapshot.notes[noteId];
    if (!current) {
      return;
    }
    const parsed = parseTaggedText(rawText);
    const mergedTags = [...new Set([...current.tags, ...parsed.tags])];
    const state = useWallStore.getState();
    state.beginHistoryGroup();
    try {
      updateNote(noteId, {
      text: parsed.text,
      tags: mergedTags,
      vocabulary: current.vocabulary
        ? {
            ...current.vocabulary,
            word: parsed.text.trim(),
          }
        : current.vocabulary,
      });
      syncWikiLinksForNote(noteId, parsed.text);
    } finally {
      useWallStore.getState().endHistoryGroup();
    }
  }, [renderSnapshot.notes, syncWikiLinksForNote]);

  const openEditor = useCallback((noteId: string, text: string, focusField?: string) => {
    setEditTagInput("");
    setEditTagRenameFrom(null);
    setEditing({ id: noteId, text, focusField });
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
    if (nextTarget?.closest?.('[data-note-edit-tools="true"]')) {
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
      const recallRaw = readStorageValue(recallStorageKey, legacyRecallStorageKeys);
      if (recallRaw) {
        const parsed = JSON.parse(recallRaw) as SavedRecallSearch[];
        if (Array.isArray(parsed)) {
          setSavedRecallSearches(parsed);
        }
      }
    } catch {
      // Ignore malformed persisted recall payloads and keep defaults.
    }

    setLayoutPrefs(readStoredWallLayoutPrefs());
    setControlsMode(readStoredControlsMode());

    try {
      const spatialRaw = readStorageValue(spatialPrefsStorageKey, legacySpatialPrefsStorageKeys);
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

    try {
      const narrativeRaw = readStorageValue(presentationPathsStorageKey, legacyPresentationPathsStorageKeys);
      if (narrativeRaw) {
        const parsedPaths = parsePresentationPathsPayload(narrativeRaw);
        setPresentationPaths(parsedPaths);
      }
    } catch {
      // Ignore malformed persisted narrative payloads and keep defaults.
    }

    const cadenceRaw = readStorageValue(backupReminderCadenceStorageKey, legacyBackupReminderCadenceStorageKeys);
    setBackupReminderCadence(cadenceRaw === "daily" || cadenceRaw === "weekly" ? cadenceRaw : "off");

    setLeftPanelOpen(false);
    setRightPanelOpen(false);
    setClientPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyAccountSettings = () => {
      setLayoutPrefs(readStoredWallLayoutPrefs());
      setControlsMode(readStoredControlsMode());
    };

    window.addEventListener(accountSettingsUpdatedEventName, applyAccountSettings);
    return () => {
      window.removeEventListener(accountSettingsUpdatedEventName, applyAccountSettings);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    writeStorageValue(recallStorageKey, JSON.stringify(savedRecallSearches));
  }, [clientPrefsLoaded, savedRecallSearches]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    writeStorageValue(layoutPrefsStorageKey, JSON.stringify(layoutPrefs));
  }, [clientPrefsLoaded, layoutPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    writeStorageValue(controlsModeStorageKey, controlsMode);
  }, [clientPrefsLoaded, controlsMode]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    writeStorageValue(spatialPrefsStorageKey, JSON.stringify(spatialPrefs));
  }, [clientPrefsLoaded, spatialPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    writeStorageValue(presentationPathsStorageKey, JSON.stringify(presentationPaths));
  }, [clientPrefsLoaded, presentationPaths]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientPrefsLoaded) {
      return;
    }
    writeStorageValue(backupReminderCadenceStorageKey, backupReminderCadence);
  }, [backupReminderCadence, clientPrefsLoaded]);

  useEffect(() => {
    if (!activePresentationPathId) {
      return;
    }
    if (!activePresentationPath) {
      setActivePresentationPathId("");
      setPresentationIndex(0);
      return;
    }
    setPresentationIndex((previous) => clampPresentationIndex(previous, activePresentationSteps.length || 1));
  }, [activePresentationPath, activePresentationPathId, activePresentationSteps.length]);

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
        setHasPendingSync(false);
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

      setHasPendingSync(true);
      setSyncError(null);

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

  const handleLocalSaveStateChange = useCallback((state: "saving" | "saved" | "error") => {
    if (state === "saving") {
      setLocalSaveState("saving");
      return;
    }
    if (state === "error") {
      setLocalSaveState("error");
      return;
    }
    setLocalSaveState("idle");
  }, []);

  useWallPersistenceEffects({
    hydrate,
    publishedReadOnly,
    scheduleCloudSync,
    syncSnapshotToCloud,
    setCloudWallId,
    setTimelineEntries,
    setTimelineIndex,
    setSyncError,
    onLocalSaveStateChange: handleLocalSaveStateChange,
    cloudReadyRef,
    cloudSyncTimerRef,
    lastTimelineSerialized,
    lastTimelineRecordedAt,
  });

  const {
    refreshCurrencyNote,
    updateAmountInput: updateCurrencyAmountInput,
    setManualBaseCurrency,
    resetToDetectedCurrency,
  } = useCurrencySystemNote({ hydrated, publishedReadOnly });
  const { refreshApodNote, downloadApodImage } = useApodNotes({ hydrated, publishedReadOnly });
  const { refreshEconomistNote } = useEconomistNotes({ hydrated, publishedReadOnly, loginKey: userEmail });
  const { refreshPoetryNote, downloadPoetryAsImage, downloadPoetryAsPdf } = usePoetryNotes({ hydrated, publishedReadOnly });

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
      const disableResize = isTimeLocked || Boolean(selectedNote?.pinned) || Boolean(selectedNote && isCurrencyNote(selectedNote));
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

  const openFileConversion = useCallback((conversionMode?: "pdf_to_word" | "word_to_pdf") => {
    if (conversionMode) {
      setPreferredFileConversionMode(conversionMode);
    }
    setFileConversionOpen(true);
  }, [setFileConversionOpen]);

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
    if (isChromeHidden || !layoutPrefs.showDetailsPanel) {
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
    layoutPrefs.showDetailsPanel,
    markOpenIntent,
    rightPanelOpen,
    ui.selectedNoteId,
  ]);

  const openBookmarkUrl = useCallback((url: string) => {
    const target = url.trim();
    if (!target || typeof window === "undefined") {
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }, []);

  const fetchBookmarkPreview = useCallback(
    async (noteId: string, rawUrl: string, options?: { force?: boolean }) => {
      if (isTimeLocked) {
        return;
      }
      const normalizedUrl = createBookmarkNoteState(rawUrl).normalizedUrl;
      if (!normalizedUrl) {
        updateNote(noteId, {
          bookmark: {
            ...(renderSnapshot.notes[noteId]?.bookmark ?? createBookmarkNoteState(rawUrl)),
            url: rawUrl,
            normalizedUrl: "",
            metadata: undefined,
            status: "error",
            fetchedAt: Date.now(),
            error: "Enter a valid http(s) URL.",
          },
        });
        return;
      }

      const cached = readBookmarkCacheEntry(normalizedUrl);
      if (!options?.force && cached?.metadata && isBookmarkCacheFresh(cached) && isBookmarkMetadataRich(cached.metadata)) {
        updateNote(noteId, {
          bookmark: {
            url: rawUrl,
            normalizedUrl,
            metadata: cached.metadata,
            status: "ready",
            fetchedAt: cached.fetchedAt,
            lastSuccessAt: cached.lastSuccessAt ?? cached.fetchedAt,
            error: undefined,
          },
        });
        return;
      }

      updateNote(noteId, {
        bookmark: {
          url: rawUrl,
          normalizedUrl,
          metadata: cached?.metadata ?? renderSnapshot.notes[noteId]?.bookmark?.metadata,
          status: "loading",
          fetchedAt: Date.now(),
          lastSuccessAt: renderSnapshot.notes[noteId]?.bookmark?.lastSuccessAt,
          error: undefined,
        },
      });

      try {
        const response = await fetch(`/api/bookmarks/preview?url=${encodeURIComponent(normalizedUrl)}`);
        const payload = (await response.json()) as {
          error?: string;
          normalizedUrl?: string;
          metadata?: WebBookmarkMetadata;
        };
        if (!response.ok || !payload.metadata || !payload.normalizedUrl) {
          throw new Error(payload.error || "Preview request failed.");
        }
        const fetchedAt = Date.now();
        writeBookmarkCacheEntry(payload.normalizedUrl, {
          metadata: payload.metadata,
          fetchedAt,
          lastSuccessAt: fetchedAt,
        });
        const currentNote = useWallStore.getState().notes[noteId];
        const preferredSize = getBookmarkPreferredSize(payload.metadata);
        updateNote(noteId, {
          ...(currentNote && shouldAutoResizeBookmarkNote(currentNote)
            ? {
                w: preferredSize.w,
                h: preferredSize.h,
              }
            : {}),
          bookmark: {
            url: rawUrl,
            normalizedUrl: payload.normalizedUrl,
            metadata: payload.metadata,
            status: "ready",
            fetchedAt,
            lastSuccessAt: fetchedAt,
            error: undefined,
          },
        });
      } catch (error) {
        updateNote(noteId, {
          bookmark: {
            url: rawUrl,
            normalizedUrl,
            metadata: cached?.metadata ?? renderSnapshot.notes[noteId]?.bookmark?.metadata,
            status: "error",
            fetchedAt: Date.now(),
            lastSuccessAt: cached?.lastSuccessAt ?? renderSnapshot.notes[noteId]?.bookmark?.lastSuccessAt,
            error: error instanceof Error ? error.message : "Preview request failed.",
          },
        });
      }
    },
    [isTimeLocked, renderSnapshot.notes],
  );

  useEffect(() => {
    if (!hydrated || isTimeLocked || publishedReadOnly) {
      return;
    }

    for (const note of Object.values(notesMap)) {
      if (note.noteKind !== "web-bookmark") {
        continue;
      }
      const normalizedUrl = note.bookmark?.normalizedUrl;
      if (!normalizedUrl || note.bookmark?.status === "loading" || isBookmarkMetadataRich(note.bookmark?.metadata)) {
        continue;
      }
      if (bookmarkUpgradeRequestsRef.current[note.id] === normalizedUrl) {
        continue;
      }
      bookmarkUpgradeRequestsRef.current[note.id] = normalizedUrl;
      void fetchBookmarkPreview(note.id, normalizedUrl, { force: true });
    }
  }, [fetchBookmarkPreview, hydrated, isTimeLocked, notesMap, publishedReadOnly]);
  const makeWebBookmarkNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createWebBookmarkNote(world.x - WEB_BOOKMARK_DEFAULTS.width / 2, world.y - WEB_BOOKMARK_DEFAULTS.height / 2);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
  }, [camera, isTimeLocked, openEditor, selectNote, viewport.h, viewport.w]);

  const makeApodNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createApodNote(world.x - 160, world.y - 140);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
    void refreshApodNote(id, { force: true });
  }, [camera, isTimeLocked, openEditor, refreshApodNote, selectNote, viewport.h, viewport.w]);

  const makePoetryNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createPoetryNote(world.x - 160, world.y - 140);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
    void refreshPoetryNote(id, { force: true });
  }, [camera, isTimeLocked, openEditor, refreshPoetryNote, selectNote, viewport.h, viewport.w]);

  const makeEconomistNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createEconomistNote(world.x - 166, world.y - 254);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
    void refreshEconomistNote(id, { force: true });
  }, [camera, isTimeLocked, openEditor, refreshEconomistNote, selectNote, viewport.h, viewport.w]);

  const makeWordNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createNote(world.x - NOTE_DEFAULTS.width / 2, world.y - NOTE_DEFAULTS.height / 2, ui.lastColor ?? NOTE_COLORS[0]);
    updateNote(id, {
      text: "",
      tags: ["vocab"],
      textColor: "#FFFFFF",
      vocabulary: createVocabularyNote(),
    });
    setSelectedNoteIds([id]);
    selectNote(id);
    setReviewRevealMeaning(false);
  }, [camera, isTimeLocked, selectNote, ui.lastColor, viewport.h, viewport.w]);

  const makeJokerNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createOrRefreshJokerNote({
      x: world.x - NOTE_DEFAULTS.width / 2,
      y: world.y - NOTE_DEFAULTS.height / 2,
    });
    setSelectedNoteIds([id]);
    selectNote(id);
  }, [camera, isTimeLocked, selectNote, viewport.h, viewport.w]);

  const makeThroneNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createOrRefreshThroneNote({
      x: world.x - NOTE_DEFAULTS.width / 2,
      y: world.y - NOTE_DEFAULTS.height / 2,
    });
    setSelectedNoteIds([id]);
    selectNote(id);
  }, [camera, isTimeLocked, selectNote, viewport.h, viewport.w]);

  const makeQuoteNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createQuoteNote(
      world.x - NOTE_DEFAULTS.width / 2,
      world.y - NOTE_DEFAULTS.height / 2,
    );
    updateNote(id, {
      textColor: NOTE_DEFAULTS.textColor,
    });
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
  }, [camera, isTimeLocked, openEditor, selectNote, viewport.h, viewport.w]);

  const makeCanonNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createCanonNote(
      world.x - NOTE_DEFAULTS.width / 2,
      world.y - NOTE_DEFAULTS.height / 2,
    );
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
  }, [camera, isTimeLocked, openEditor, selectNote, viewport.h, viewport.w]);

  const makeJournalNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createJournalNote(
      world.x - NOTE_DEFAULTS.width / 2,
      world.y - NOTE_DEFAULTS.height / 2,
    );
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, useWallStore.getState().notes[id]?.text ?? "");
  }, [camera, isTimeLocked, openEditor, selectNote, viewport.h, viewport.w]);

  const makeEisenhowerNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createEisenhowerNote(
      world.x - EISENHOWER_NOTE_DEFAULTS.width / 2,
      world.y - EISENHOWER_NOTE_DEFAULTS.height / 2,
    );
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "", "doFirst");
  }, [camera, isTimeLocked, openEditor, selectNote, viewport.h, viewport.w]);

  const toggleVocabularyFlip = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }
      const note = renderSnapshot.notes[noteId];
      if (!note?.vocabulary) {
        return;
      }
      updateNote(noteId, {
        vocabulary: {
          ...note.vocabulary,
          flipped: !note.vocabulary.flipped,
        },
      });
    },
    [isTimeLocked, renderSnapshot.notes],
  );

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
    createNote: createNote,
    createCanonNote: makeCanonNoteAtViewportCenter,
    createJournalNote: makeJournalNoteAtViewportCenter,
    createQuoteNote: makeQuoteNoteAtViewportCenter,
    createApodNote: makeApodNoteAtViewportCenter,
    createPoetryNote: makePoetryNoteAtViewportCenter,
    createEconomistNote: makeEconomistNoteAtViewportCenter,
    createEisenhowerNote: makeEisenhowerNoteAtViewportCenter,
    createWordNote: makeWordNoteAtViewportCenter,
    openEditor,
    redo,
    undo,
    setLinkingFromNote,
    duplicateNote,
    toggleVocabularyFlip,
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
  const focusedNote = focusedNoteId ? renderSnapshot.notes[focusedNoteId] : undefined;
  const isFocusMode = Boolean(focusedNote);
  const renderVisibleNotes = useMemo(
    () => (focusedNote ? visibleNotes.filter((note) => note.id === focusedNote.id) : visibleNotes),
    [focusedNote, visibleNotes],
  );
  const renderVisibleZones = useMemo(() => (focusedNote ? [] : visibleZones), [focusedNote, visibleZones]);
  const renderVisibleLinks = useMemo(() => (focusedNote ? [] : visibleLinks), [focusedNote, visibleLinks]);
  const renderPathLinkIds = useMemo(() => (focusedNote ? new Set<string>() : pathLinkIds), [focusedNote, pathLinkIds]);
  const presentationModeType: "notes" | "narrative" = hasNarrativePresentation ? "narrative" : "notes";
  const presentationLength = presentationModeType === "narrative" ? activePresentationSteps.length : presentationNotes.length;
  const activePresentationStep =
    presentationModeType === "narrative"
      ? activePresentationSteps[clampPresentationIndex(presentationIndex, activePresentationSteps.length)]
      : undefined;
  const maxViewportWidth = typeof window !== "undefined" ? window.innerWidth : viewport.w;
  const maxViewportHeight = typeof window !== "undefined" ? window.innerHeight : viewport.h;
  const imageInsertTargetLabel = imageInsertState.noteId
    ? renderSnapshot.notes[imageInsertState.noteId]?.text.trim() || "the selected note"
    : "a new image note";
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

  const openImageInsert = useCallback((noteId?: string, point?: { x: number; y: number }) => {
    if (noteId) {
      syncPrimarySelection([noteId]);
      selectNote(noteId);
    }
    setImageInsertState({ open: true, noteId, x: point?.x, y: point?.y });
  }, [selectNote, syncPrimarySelection]);

  const closeImageInsert = useCallback(() => {
    setImageInsertState({ open: false });
  }, []);

  const findNoteAtWorldPoint = useCallback((x: number, y: number) => {
    const ordered = [...renderVisibleNotes].reverse();
    return ordered.find((note) => x >= note.x && x <= note.x + note.w && y >= note.y && y <= note.y + note.h);
  }, [renderVisibleNotes]);

  const insertImageSource = useCallback((source: string, target?: { noteId?: string; x?: number; y?: number }) => {
    if (target?.noteId && renderSnapshot.notes[target.noteId]) {
      updateNote(target.noteId, { imageUrl: source });
      syncPrimarySelection([target.noteId]);
      selectNote(target.noteId);
      return target.noteId;
    }

    const fallbackPoint = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const worldX = target?.x ?? fallbackPoint.x;
    const worldY = target?.y ?? fallbackPoint.y;
    const noteId = createNote(worldX - NOTE_DEFAULTS.width / 2, worldY - NOTE_DEFAULTS.height / 2, ui.lastColor);
    updateNote(noteId, { imageUrl: source });
    syncPrimarySelection([noteId]);
    selectNote(noteId);
    return noteId;
  }, [camera, renderSnapshot.notes, selectNote, syncPrimarySelection, ui.lastColor, viewport.h, viewport.w]);

  const handleImageFileInsert = useCallback(async (file: File, target?: { noteId?: string; x?: number; y?: number }) => {
    const dataUrl = await readImageFileAsDataUrl(file);
    insertImageSource(dataUrl, target);
  }, [insertImageSource]);

  const handleImageUrlInsert = useCallback(async (url: string, target?: { noteId?: string; x?: number; y?: number }) => {
    try {
      new URL(url);
    } catch {
      throw new Error("Please paste a valid image URL.");
    }
    insertImageSource(url, target);
  }, [insertImageSource]);

  const handleUnsplashPhotoInsert = useCallback(async (photo: UnsplashPhoto, target?: { noteId?: string; x?: number; y?: number }) => {
    await trackUnsplashDownload(photo.links.downloadLocation);
    insertImageSource(photo.urls.regular, target);
  }, [insertImageSource]);

  const handleUnsplashMoodboardInsert = useCallback(async (photos: UnsplashPhoto[], target?: { noteId?: string; x?: number; y?: number }) => {
    if (photos.length < 3 || photos.length > 10) {
      throw new Error("Pick 3-10 images for a moodboard.");
    }

    const anchor = (() => {
      if (target?.noteId) {
        const note = renderSnapshot.notes[target.noteId];
        if (note) {
          return { x: note.x + note.w / 2, y: note.y + note.h / 2 };
        }
      }
      if (typeof target?.x === "number" && typeof target?.y === "number") {
        return { x: target.x, y: target.y };
      }
      return toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    })();

    const columns = photos.length <= 4 ? 2 : photos.length <= 6 ? 3 : 4;
    const gap = 28;
    const createdIds: string[] = [];
    runHistoryGroup(() => {
      photos.forEach((photo, index) => {
        const aspectRatio = Math.max(0.65, Math.min(1.5, photo.height / Math.max(photo.width, 1)));
        const width = columns >= 4 ? 180 : 220;
        const height = Math.round(width * aspectRatio);
        const row = Math.floor(index / columns);
        const column = index % columns;
        const rows = Math.ceil(photos.length / columns);
        const offsetX = (column - (columns - 1) / 2) * (width + gap) + (row % 2 === 0 ? 0 : 18);
        const offsetY = (row - (rows - 1) / 2) * (220 + gap) + (column % 2 === 0 ? 0 : 16);
        const noteId = createNote(anchor.x + offsetX - width / 2, anchor.y + offsetY - height / 2, ui.lastColor);
        updateNote(noteId, {
          imageUrl: photo.urls.regular,
          w: width,
          h: Math.max(150, Math.min(320, height)),
        });
        createdIds.push(noteId);
      });
    });

    await Promise.all(photos.map((photo) => trackUnsplashDownload(photo.links.downloadLocation)));
    if (createdIds.length > 0) {
      syncPrimarySelection(createdIds);
      selectNote(createdIds[0]);
    }
  }, [camera, renderSnapshot.notes, runHistoryGroup, selectNote, syncPrimarySelection, ui.lastColor, viewport.h, viewport.w]);

  useEffect(() => {
    if (isTimeLocked) {
      setImageInsertState({ open: false });
    }
  }, [isTimeLocked]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isTimeLocked) {
        return;
      }
      const file = getImageFileFromClipboard(event.clipboardData);
      if (!file) {
        return;
      }
      event.preventDefault();
      const targetNoteId = ui.selectedNoteId ?? activeSelectedNoteIds[0];
      const fallbackPoint = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
      void handleImageFileInsert(file, targetNoteId ? { noteId: targetNoteId } : fallbackPoint);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeSelectedNoteIds, camera, handleImageFileInsert, isTimeLocked, ui.selectedNoteId, viewport.h, viewport.w]);

  useEffect(() => {
    setPresentationIndex((previous) => clampPresentationIndex(previous, presentationLength || 1));
  }, [presentationLength]);

  useEffect(() => {
    if (!presentationMode || !activePresentationStep) {
      return;
    }
    setCamera(activePresentationStep.camera);
  }, [activePresentationStep, presentationMode, setCamera]);

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

  const { stepZoom, resetZoom } = useWallZoomControls({ camera, viewport, animateCamera });

  const revealNoteFromTimeline = useCallback(
    (noteId: string) => {
      setTimelineViewActive(false);
      focusNote(noteId);
    },
    [focusNote],
  );
  const narrativePathOptions = useMemo(
    () =>
      presentationPaths.map((path) => ({
        id: path.id,
        title: path.title,
        stepsCount: path.steps.length,
      })),
    [presentationPaths],
  );

  const createNarrativePath = useCallback(() => {
    if (publishedReadOnly) {
      return;
    }
    const defaultTitle = makeDefaultPathTitle(presentationPaths);
    const provided = window.prompt("Name this narrative path", defaultTitle);
    if (provided === null) {
      return;
    }
    const path = createPresentationPath(provided.trim() || defaultTitle);
    setPresentationPaths((previous) => [path, ...previous]);
    setActivePresentationPathId(path.id);
    setPresentationIndex(0);
  }, [presentationPaths, publishedReadOnly]);

  const addNarrativeStep = useCallback(() => {
    if (publishedReadOnly) {
      return;
    }
    const now = Date.now();
    let targetPathId = activePresentationPathId;
    if (!targetPathId) {
      const created = createPresentationPath(makeDefaultPathTitle(presentationPaths), now);
      setPresentationPaths((previous) => [created, ...previous]);
      targetPathId = created.id;
      setActivePresentationPathId(created.id);
    }

    setPresentationPaths((previous) =>
      previous.map((path) => (path.id === targetPathId ? addPresentationStep(path, camera, now) : path)),
    );

    const nextLength = activePresentationPath?.steps.length ?? 0;
    setPresentationIndex(nextLength);
  }, [activePresentationPath, activePresentationPathId, camera, presentationPaths, publishedReadOnly]);

  const updateNarrativeTalkingPoints = useCallback(
    (value: string) => {
      if (!activePresentationPathId || !activePresentationStep || publishedReadOnly) {
        return;
      }
      setPresentationPaths((previous) =>
        previous.map((path) => {
          if (path.id !== activePresentationPathId) {
            return path;
          }
          return {
            ...path,
            updatedAt: Date.now(),
            steps: path.steps.map((step) => (step.id === activePresentationStep.id ? { ...step, talkingPoints: value } : step)),
          };
        }),
      );
    },
    [activePresentationPathId, activePresentationStep, publishedReadOnly],
  );

  const captureNarrativeStepCamera = useCallback(() => {
    if (!activePresentationPathId || !activePresentationStep || publishedReadOnly) {
      return;
    }
    setPresentationPaths((previous) =>
      previous.map((path) => {
        if (path.id !== activePresentationPathId) {
          return path;
        }
        return {
          ...path,
          updatedAt: Date.now(),
          steps: path.steps.map((step) => (step.id === activePresentationStep.id ? { ...step, camera: { ...camera } } : step)),
        };
      }),
    );
  }, [activePresentationPathId, activePresentationStep, camera, publishedReadOnly]);

  const deleteNarrativeStep = useCallback(() => {
    if (!activePresentationPathId || !activePresentationStep || publishedReadOnly) {
      return;
    }
    setPresentationPaths((previous) =>
      previous
        .map((path) => {
          if (path.id !== activePresentationPathId) {
            return path;
          }
          return {
            ...path,
            updatedAt: Date.now(),
            steps: path.steps.filter((step) => step.id !== activePresentationStep.id),
          };
        })
        .filter((path) => path.steps.length > 0 || path.id !== activePresentationPathId),
    );
    setPresentationIndex((previous) => Math.max(0, previous - 1));
  }, [activePresentationPathId, activePresentationStep, publishedReadOnly]);

  const handleNarrativePathChange = useCallback((pathId: string) => {
    setActivePresentationPathId(pathId);
    setPresentationIndex(0);
  }, []);

  const smartMergeItems = useMemo(
    () =>
      smartMergeSuggestions
        .map((suggestion) => {
          const keepNote = renderSnapshot.notes[suggestion.keepNoteId];
          const mergeNote = renderSnapshot.notes[suggestion.mergeNoteId];
          if (!keepNote || !mergeNote) {
            return null;
          }
          return {
            ...suggestion,
            keepNoteText: keepNote.text,
            mergeNoteText: mergeNote.text,
          };
        })
        .filter((item): item is SmartMergeSuggestion & { keepNoteText: string; mergeNoteText: string } => Boolean(item)),
    [renderSnapshot.notes, smartMergeSuggestions],
  );

  const previewSmartMerge = useCallback(
    (suggestion: SmartMergeSuggestion) => {
      const keepNote = renderSnapshot.notes[suggestion.keepNoteId];
      const mergeNote = renderSnapshot.notes[suggestion.mergeNoteId];
      if (!keepNote || !mergeNote) {
        return;
      }
      syncPrimarySelection([keepNote.id, mergeNote.id]);
      selectNote(keepNote.id);
      const bounds = computeContentBounds([keepNote, mergeNote], []);
      if (bounds) {
        focusBounds(bounds);
      }
    },
    [focusBounds, renderSnapshot.notes, selectNote, syncPrimarySelection],
  );

  const applySmartMerge = useCallback(
    (suggestion: SmartMergeSuggestion) => {
      if (isTimeLocked) {
        return;
      }
      const keepNote = renderSnapshot.notes[suggestion.keepNoteId];
      const mergeNote = renderSnapshot.notes[suggestion.mergeNoteId];
      if (!keepNote || !mergeNote) {
        return;
      }
      const ok = window.confirm("Merge these notes? The second note will be removed.");
      if (!ok) {
        return;
      }
      mergeNotes(suggestion.keepNoteId, suggestion.mergeNoteId);
      syncPrimarySelection([suggestion.keepNoteId]);
    },
    [isTimeLocked, renderSnapshot.notes, syncPrimarySelection],
  );

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

  useEffect(() => {
    setReviewRevealMeaning(false);
  }, [selectedVocabularyNote?.id]);

  const focusNextDueWord = useCallback(() => {
    const nextDue = vocabularyDueNotes[0];
    if (!nextDue) {
      return;
    }
    setReviewRevealMeaning(false);
    focusNote(nextDue.id);
  }, [focusNote, vocabularyDueNotes]);

  const updateVocabularyField = useCallback(
    (field: "word" | "sourceContext" | "guessMeaning" | "meaning" | "ownSentence", value: string) => {
      if (isTimeLocked || !selectedVocabularyNote?.vocabulary) {
        return;
      }
      const nextVocabulary = {
        ...selectedVocabularyNote.vocabulary,
        [field]: value,
      };
      updateNote(selectedVocabularyNote.id, {
        text: field === "word" ? value : selectedVocabularyNote.text,
        vocabulary: nextVocabulary,
      });
    },
    [isTimeLocked, selectedVocabularyNote],
  );

  const reviewSelectedWord = useCallback(
    (outcome: "again" | "hard" | "good" | "easy") => {
      if (isTimeLocked || !selectedVocabularyNote?.vocabulary) {
        return;
      }
      const ownSentence = selectedVocabularyNote.vocabulary.ownSentence.trim();
      if ((outcome === "good" || outcome === "easy") && !ownSentence) {
        return;
      }
      const nextVocabulary = applyVocabularyReview(selectedVocabularyNote.vocabulary, outcome);
      updateNote(selectedVocabularyNote.id, {
        vocabulary: nextVocabulary,
      });
      setReviewRevealMeaning(false);
    },
    [isTimeLocked, selectedVocabularyNote],
  );

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
        id: "new-journal-note",
        label: "Create journal note",
        description: "Add a handwritten notebook page entry with a dated header.",
        shortcut: "Shift + J",
        keywords: ["journal", "diary", "notebook", "handwritten"],
        disabled: isTimeLocked,
        onSelect: makeJournalNoteAtViewportCenter,
      },
      {
        id: "new-canon-note",
        label: "Create canon note",
        description: "Capture a law/rule/theorem with single or list mode.",
        shortcut: "Shift + G",
        keywords: ["law", "rule", "theorem", "commandments", "canon"],
        disabled: isTimeLocked,
        onSelect: makeCanonNoteAtViewportCenter,
      },
      {
        id: "new-quote-note",
        label: "Create quote note",
        description: "Add a quote card with attribution fields.",
        shortcut: "Shift + Q",
        keywords: ["quote", "citation", "author", "source"],
        disabled: isTimeLocked,
        onSelect: makeQuoteNoteAtViewportCenter,
      },
      {
        id: "new-apod-note",
        label: "Create APOD note",
        description: "Add the latest NASA Astronomy Picture of the Day as a note.",
        shortcut: "Shift + A",
        keywords: ["nasa", "space", "astronomy", "apod", "picture"],
        disabled: isTimeLocked,
        onSelect: makeApodNoteAtViewportCenter,
      },
      {
        id: "new-poetry-note",
        label: "Create Poetry note",
        description: "Add a daily PoetryDB poem with refresh and export actions.",
        keywords: ["poetry", "poem", "poet", "poetrydb", "verse"],
        disabled: isTimeLocked,
        onSelect: makePoetryNoteAtViewportCenter,
      },
      {
        id: "new-economist-note",
        label: "Create Economist cover note",
        description: "Add the latest Economist cover image and refresh it on sign-in.",
        keywords: ["economist", "cover", "magazine", "issue"],
        disabled: isTimeLocked,
        onSelect: makeEconomistNoteAtViewportCenter,
      },
      {
        id: "new-eisenhower-note",
        label: "Create Eisenhower Matrix note",
        description: "Add a four-quadrant priority note with editable sections.",
        shortcut: "Shift + E",
        keywords: ["matrix", "eisenhower", "priority", "urgent", "important"],
        disabled: isTimeLocked,
        onSelect: makeEisenhowerNoteAtViewportCenter,
      },
      {
        id: "new-word-note",
        label: "Create word note",
        description: "Capture a vocabulary card with spaced-review fields.",
        keywords: ["word", "vocabulary", "flashcard", "learn"],
        disabled: isTimeLocked,
        onSelect: makeWordNoteAtViewportCenter,
      },
      {
        id: "review-next-word",
        label: "Review next due word",
        description: "Jump to the most overdue vocabulary card.",
        keywords: ["review", "due", "spaced repetition", "focus word"],
        disabled: vocabularyDueNotes.length === 0,
        onSelect: focusNextDueWord,
      },
      {
        id: "flip-word-card",
        label: "Flip selected word card",
        description: "Toggle front/back for the selected vocabulary flashcard.",
        shortcut: "F",
        keywords: ["flashcard", "flip", "word", "vocabulary"],
        disabled: isTimeLocked || !selectedVocabularyNote,
        onSelect: () => {
          if (selectedVocabularyNote) {
            toggleVocabularyFlip(selectedVocabularyNote.id);
          }
        },
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
        id: "convert-pdf-to-word",
        label: "Open PDF to Word",
        description: "Convert PDF documents into Word files.",
        keywords: ["convert", "pdf", "word", "document"],
        onSelect: () => openFileConversion("pdf_to_word"),
      },
      {
        id: "convert-word-to-pdf",
        label: "Open Word to PDF",
        description: "Convert Word documents into PDF files.",
        keywords: ["convert", "word", "pdf", "document"],
        onSelect: () => openFileConversion("word_to_pdf"),
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
        id: "zoom-to-fit",
        label: "Zoom to fit all content",
        description: "Frame all visible notes and zones with padding.",
        keywords: ["camera", "zoom", "fit", "frame", "board"],
        onSelect: zoomToFit,
      },
      {
        id: "zoom-to-selection",
        label: "Zoom to selection",
        description: "Frame the selected notes.",
        keywords: ["camera", "zoom", "selection", "focus", "frame"],
        disabled: selectedNotes.length === 0,
        onSelect: zoomToSelection,
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
        id: "toggle-timeline-view",
        label: timelineViewActive ? "Exit timeline view" : "Open timeline view",
        description: "Arrange current notes on a horizontally scrolling timeline.",
        shortcut: "V",
        keywords: ["timeline", "view", "horizontal", "story"],
        onSelect: toggleTimelineView,
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
      leftPanelOpen,
      makeNoteAtViewportCenter,
      makeCanonNoteAtViewportCenter,
      makeJournalNoteAtViewportCenter,
      makeQuoteNoteAtViewportCenter,
      makeApodNoteAtViewportCenter,
      makePoetryNoteAtViewportCenter,
      makeEconomistNoteAtViewportCenter,
      makeEisenhowerNoteAtViewportCenter,
      makeWordNoteAtViewportCenter,
      makeZoneAtViewportCenter,
      readingMode,
      selectedVocabularyNote,
      presentationMode,
      quickCaptureOpen,
      redo,
      selectedNotes.length,
      zoomToFit,
      zoomToSelection,
      rightPanelOpen,
      setExportOpenTracked,
      openFileConversion,
      setShortcutsOpenTracked,
      showHeatmap,
      spatialPrefs.showDotMatrix,
      spatialPrefs.snapToGrid,
      spatialPrefs.snapToGuides,
      timelineMode,
      timelineViewActive,
      toggleLeftPanel,
      toggleReadingMode,
      togglePresentationMode,
      toggleRightPanel,
      toggleTimelineMode,
      toggleTimelineView,
      openLeftPanel,
      closeLeftPanel,
      openRightPanel,
      closeRightPanel,
      collapseAllZoneGroups,
      expandAllZoneGroups,
      setShowClusters,
      toggleVocabularyFlip,
      ui.showClusters,
      undo,
      focusNextDueWord,
      vocabularyDueNotes.length,
      zoneGroups,
    ],
  );
  return (
    <div className="route-shell flex h-screen flex-col text-[var(--color-text)]">
      {!readingMode && !timelineViewActive && (
        <WallHeaderBar
        presentationMode={presentationMode}
        publishedReadOnly={publishedReadOnly}
        timelineViewActive={timelineViewActive}
        layoutPrefs={layoutPrefs}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
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
        localSaveState={localSaveState}
        hasPendingSync={hasPendingSync}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
        onToggleLeftPanel={toggleLeftPanel}
        onToggleRightPanel={toggleRightPanel}
        onOpenCommandPalette={() => setSearchOpenTracked(true)}
        onToggleQuickCapture={() => setQuickCaptureOpen((previous) => !previous)}
        onToggleTimelineView={toggleTimelineView}
        onTogglePresentationMode={togglePresentationMode}
        onOpenShortcuts={() => setShortcutsOpenTracked(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onApplyColorToSelection={applyColorToSelection}
        onSyncNow={syncNow}
      />
      )}

      <div
        ref={containerRef}
        className={`relative flex-1 overflow-hidden ${
          timelineViewActive ? "cursor-default" : isSpaceDown || isMiddleDragging || isLeftCanvasDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onDragOver={(event) => {
          const files = getImageFilesFromDataTransfer(event.dataTransfer);
          if (isTimeLocked || files.length === 0) {
            return;
          }
          event.preventDefault();
          setIsImageDragOver(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsImageDragOver(false);
          }
        }}
        onDrop={(event) => {
          const files = getImageFilesFromDataTransfer(event.dataTransfer);
          if (isTimeLocked || files.length === 0) {
            return;
          }
          event.preventDefault();
          setIsImageDragOver(false);
          const bounds = containerRef.current?.getBoundingClientRect();
          if (!bounds) {
            return;
          }
          const droppedFile = files[0];
          if (!droppedFile) {
            return;
          }
          const world = toWorldPoint(event.clientX - bounds.left, event.clientY - bounds.top, camera);
          const targetNote = findNoteAtWorldPoint(world.x, world.y);
          void handleImageFileInsert(droppedFile, targetNote ? { noteId: targetNote.id } : world);
        }}
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

        {isImageDragOver && !isTimeLocked && (
          <div className="pointer-events-none absolute inset-6 z-[44] rounded-[32px] border-2 border-dashed border-[var(--color-accent-strong)] bg-[rgba(255,248,232,0.78)] shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Drop Image</p>
                <p className="mt-3 font-[Georgia] text-3xl text-[var(--color-text)]">Release to insert image</p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">Drop on empty canvas to create a new media card, or drop on a note to replace its image.</p>
              </div>
            </div>
          </div>
        )}

        {timelineViewActive ? (
          <WallTimelineView
            notes={notes}
            selectedNoteId={ui.selectedNoteId}
            activeTimestamp={activeTimelineEntry?.ts}
            onSelectNote={(noteId) => {
              syncPrimarySelection([noteId]);
              selectNote(noteId);
            }}
            onRevealNote={revealNoteFromTimeline}
            onExit={() => setTimelineViewActive(false)}
          />
        ) : null}

        {!timelineViewActive && !isChromeHidden && !publishedReadOnly && layoutPrefs.showToolsPanel && (hasNoteSelection || leftPanelOpen) && (
          <WallToolsPanel
            leftPanelOpen={leftPanelOpen}
            isTimeLocked={isTimeLocked}
            hasJokerNote={hasJokerNote}
            hasThroneNote={hasThroneNote}
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
            onCreateCanonNote={makeCanonNoteAtViewportCenter}
            onCreateJournalNote={makeJournalNoteAtViewportCenter}
            onCreateQuoteNote={makeQuoteNoteAtViewportCenter}
            onCreateWebBookmarkNote={makeWebBookmarkNoteAtViewportCenter}
            onCreateApodNote={makeApodNoteAtViewportCenter}
            onCreatePoetryNote={makePoetryNoteAtViewportCenter}
            onCreateEconomistNote={makeEconomistNoteAtViewportCenter}
            onCreateEisenhowerNote={makeEisenhowerNoteAtViewportCenter}
            onCreateOrRefreshJokerNote={makeJokerNoteAtViewportCenter}
            onCreateOrRefreshThroneNote={makeThroneNoteAtViewportCenter}
            onCreateWordNote={makeWordNoteAtViewportCenter}
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
            controlsMode={controlsMode}
            onOpenFileConversion={(conversionMode) => openFileConversion(conversionMode)}
          />
        )}

        {!timelineViewActive && (
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
          onUserCameraIntent={stopCameraAnimation}
          onEmptyCanvasClick={() => {
            resetSelection();
            clearNoteSelection();
            setEditing(null);
            setFocusedNoteId(undefined);
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
              openImageInsert={(noteId) => openImageInsert(noteId)}
              toggleVocabularyFlip={toggleVocabularyFlip}
              duplicateNoteAt={duplicateNoteAt}
              getNoteTextStyle={getNoteTextStyle}
              getNoteTextFontFamily={getNoteTextFontFamily}
              truncateNoteText={truncateNoteText}
              noteTagChipPalette={noteTagChipPalette}
              recencyIntensity={recencyIntensity}
              wikiLinksByNoteId={wikiLinksByNoteId}
              onNavigateWikiLink={focusNote}
              editingId={editing?.id}
              openExternalUrl={openBookmarkUrl}
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
              noteMinWidth={NOTE_DEFAULTS.minWidth}
              noteMinHeight={NOTE_DEFAULTS.minHeight}
              zoneMinWidth={ZONE_DEFAULTS.minWidth}
              zoneMinHeight={ZONE_DEFAULTS.minHeight}
            />
          </Layer>
        </WallStage>
        )}

        {!readingMode && !timelineViewActive && (
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
          updateNote={updateNote}
          openImageInsert={(noteId) => openImageInsert(noteId)}
          wikiLinkOptions={wikiLinkOptions.filter((option) => option.noteId !== editing?.id)}
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
          presentationLength={presentationLength}
          presentationModeType={presentationModeType}
          narrativePaths={narrativePathOptions}
          activeNarrativePathId={activePresentationPathId}
          activeStepTalkingPoints={activePresentationStep?.talkingPoints ?? ""}
          onCreateNarrativePath={createNarrativePath}
          onPathChange={handleNarrativePathChange}
          onAddNarrativeStep={addNarrativeStep}
          onDeleteNarrativeStep={deleteNarrativeStep}
          onUpdateStepTalkingPoints={updateNarrativeTalkingPoints}
          onCaptureNarrativeStepCamera={captureNarrativeStepCamera}
          setPresentationIndex={setPresentationIndex}
          setPresentationMode={setPresentationMode}
          canZoomToSelection={selectedNotes.length > 0}
          detailsPanelOpen={layoutPrefs.showDetailsPanel && rightPanelOpen}
          onZoomIn={() => stepZoom("in")}
          onZoomOut={() => stepZoom("out")}
          onResetZoom={resetZoom}
          onZoomToFit={zoomToFit}
          onZoomToSelection={zoomToSelection}
          onRefreshCurrencyNote={() => { void refreshCurrencyNote({ force: true }); }}
          onCurrencyAmountChange={updateCurrencyAmountInput}
          onSetManualBaseCurrency={(value) => { void setManualBaseCurrency(value); }}
          onResetToDetectedCurrency={() => { void resetToDetectedCurrency(); }}
          onSubmitBookmarkUrl={(noteId, url, options) => { void fetchBookmarkPreview(noteId, url, options); }}
          onOpenBookmarkUrl={openBookmarkUrl}
          onRefreshApodNote={(noteId) => { void refreshApodNote(noteId, { force: true }); }}
          onDownloadApodImage={downloadApodImage}
          onOpenApodSource={(noteId) => {
            const apodUrl = renderSnapshot.notes[noteId]?.apod?.pageUrl || renderSnapshot.notes[noteId]?.imageUrl;
            if (apodUrl) {
              openBookmarkUrl(apodUrl);
            }
          }}
          onRefreshPoetryNote={(noteId) => { void refreshPoetryNote(noteId, { force: true }); }}
          onDownloadPoetryImage={downloadPoetryAsImage}
          onDownloadPoetryPdf={downloadPoetryAsPdf}
          onRefreshEconomistNote={(noteId) => { void refreshEconomistNote(noteId, { force: true }); }}
          onOpenEconomistSource={(noteId) => {
            const economistUrl = renderSnapshot.notes[noteId]?.quoteAuthor || "https://www.economist.com/printedition/covers";
            openBookmarkUrl(economistUrl);
          }}
        />
        )}

        {!timelineViewActive && (
        <WallDetailsSidebar
          presentationMode={isChromeHidden}
          showDetailsPanel={layoutPrefs.showDetailsPanel}
          rightPanelOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          templateType={ui.templateType}
          isTimeLocked={isTimeLocked}
          onTemplateTypeChange={(value) => setTemplateType(value)}
          onApplyTemplate={applySelectedTemplate}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          onAddTag={addTagToSelectedNote}
          selectedNote={primarySelectedNote}
          hasJokerNote={hasJokerNote}
          hasThroneNote={hasThroneNote}
          selectedNoteId={ui.selectedNoteId}
          selectedNoteIdsCount={activeSelectedNoteIds.length}
          displayedTags={displayedTags}
          onRemoveTag={removeTagFromSelectedNote}
          linkingFromNoteId={ui.linkingFromNoteId}
          isSelectedNoteFocused={Boolean(primarySelectedNote && focusedNoteId === primarySelectedNote.id)}
          backlinks={primarySelectedNote ? backlinksByNoteId[primarySelectedNote.id] ?? [] : []}
          onNavigateLinkedNote={focusNote}
          onTextFontChange={(font) => {
            if (!primarySelectedNote || isTimeLocked) {
              return;
            }
            updateNote(primarySelectedNote.id, { textFont: font });
          }}
          onTextSizeChange={(sizePx) => {
            if (!primarySelectedNote || isTimeLocked) {
              return;
            }
            updateNote(primarySelectedNote.id, { textSizePx: sizePx });
          }}
          onTextColorChange={(color) => {
            if (!primarySelectedNote || isTimeLocked) {
              return;
            }
            updateNote(primarySelectedNote.id, { textColor: color });
          }}
          onTextHorizontalAlignChange={(align) => {
            if (!primarySelectedNote || isTimeLocked) {
              return;
            }
            updateNote(primarySelectedNote.id, { textAlign: align });
          }}
          onTextVerticalAlignChange={(align) => {
            if (!primarySelectedNote || isTimeLocked) {
              return;
            }
            updateNote(primarySelectedNote.id, { textVAlign: align });
          }}
          onBackgroundColorChange={(color) => {
            if (!primarySelectedNote || isTimeLocked) {
              return;
            }
            updateNote(primarySelectedNote.id, { color });
          }}
          onDuplicateSelectedNote={duplicateNote}
          onTogglePinSelectedNote={togglePinOnNote}
          onToggleHighlightSelectedNote={toggleHighlightOnNote}
          onToggleFocusSelectedNote={toggleFocusNote}
          onToggleOrRefreshJokerSelectedNote={(noteId) => {
            const selected = renderSnapshot.notes[noteId];
            const id = createOrRefreshJokerNote({
              noteId: selected?.noteKind === "joker" ? undefined : noteId,
            });
            setSelectedNoteIds([id]);
            selectNote(id);
          }}
          onToggleOrRefreshThroneSelectedNote={(noteId) => {
            const selected = renderSnapshot.notes[noteId];
            const id = createOrRefreshThroneNote({
              noteId: selected?.noteKind === "throne" ? undefined : noteId,
            });
            setSelectedNoteIds([id]);
            selectNote(id);
          }}
          onRefreshPoetrySelectedNote={(noteId, options) => {
            void refreshPoetryNote(noteId, options ?? { force: true });
          }}
          onRefreshEconomistSelectedNote={(noteId) => {
            void refreshEconomistNote(noteId, { force: true });
          }}
          onStartLinkFromSelectedNote={setLinkingFromNote}
          onUpdateSelectedNote={updateNote}
          onSubmitBookmarkUrl={(noteId, url, options) => { void fetchBookmarkPreview(noteId, url, options); }}
          onOpenBookmarkUrl={openBookmarkUrl}
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
          isSelectedNoteVocabulary={Boolean(selectedVocabularyNote)}
          vocabularyDueCount={vocabularyDueNotes.length}
          vocabularyFocusCount={vocabularyFocusNotes.length}
          reviewedTodayCount={reviewedTodayCount}
          reviewRevealMeaning={reviewRevealMeaning}
          onToggleRevealMeaning={() => setReviewRevealMeaning((previous) => !previous)}
          onToggleFlipCard={() => {
            if (selectedVocabularyNote) {
              toggleVocabularyFlip(selectedVocabularyNote.id);
            }
          }}
          onCreateWordNote={makeWordNoteAtViewportCenter}
          onFocusNextDueWord={focusNextDueWord}
          onUpdateVocabularyField={updateVocabularyField}
          onReviewSelectedWord={reviewSelectedWord}
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
          showAutoTagGroups={showAutoTagGroups}
          onToggleAutoTagGroups={() => setShowAutoTagGroups((value) => !value)}
          autoTagGroups={autoTagGroups}
          onFocusBounds={focusBounds}
          smartMergeSuggestions={smartMergeItems}
          onPreviewSmartMerge={previewSmartMerge}
          onMergeSmartSuggestion={applySmartMerge}
          controlsMode={controlsMode}
        />
        )}

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
        isFileConversionOpen={ui.isFileConversionOpen}
        onCloseFileConversion={() => {
          setFileConversionOpen(false);
          setPreferredFileConversionMode(null);
        }}
        onOpenFileConversion={() => setFileConversionOpen(true)}
        preferredFileConversionMode={preferredFileConversionMode}
        imageInsertOpen={imageInsertState.open}
        imageInsertTargetLabel={imageInsertTargetLabel}
        onCloseImageInsert={closeImageInsert}
        onSelectImageFile={(file) => handleImageFileInsert(file, imageInsertState)}
        onSubmitImageUrl={(url) => handleImageUrlInsert(url, imageInsertState)}
        onSelectUnsplashPhoto={(photo) => handleUnsplashPhotoInsert(photo, imageInsertState)}
        onInsertUnsplashMoodboard={(photos) => handleUnsplashMoodboardInsert(photos, imageInsertState)}
        isSettingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
};






















