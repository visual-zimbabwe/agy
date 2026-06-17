"use client";

import { useMemo, type Dispatch, type FocusEvent, type SetStateAction } from "react";

import type {
  AutoTagGroup,
  RecallDateFilter,
  SavedRecallSearch,
  SmartMergeSectionItem,
} from "@/components/wall/details/DetailsSectionTypes";
import type { DetailsSectionKey } from "@/components/wall/details/DetailsSectionTypes";
import type { LinkContextMenuState } from "@/components/wall/session/wall-chrome-context";
import type { WallChromeContextValue } from "@/components/wall/session/wall-chrome-context";
import type { WallDetailsContextValue } from "@/components/wall/session/wall-details-context";
import type { WallModalContextValue } from "@/components/wall/session/wall-modal-context";
import type { LinkType, Note, NoteTextFont, TemplateType, VocabularyReviewOutcome, Zone, ZoneGroup } from "@/features/wall/types";
import { isPrivateNote, type PrivateNoteHiddenFields } from "@/features/wall/private-notes";
import { useWallStore } from "@/features/wall/store";
import type { AppUserProfile } from "@/lib/profile";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";
import type { UnsplashPhoto } from "@/lib/unsplash";
import type { Bounds } from "@/features/wall/types";

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

type PrivateSession = {
  password: string;
  hidden: PrivateNoteHiddenFields;
  lastActivityAt: number;
};

type WallUiSlice = {
  templateType: TemplateType;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  selectedZoneId?: string;
  isExportOpen: boolean;
  isShortcutsOpen: boolean;
  isFileConversionOpen: boolean;
};

export type UseWallSessionBindingsOptions = {
  isTimeLocked: boolean;
  camera: { x: number; y: number; zoom: number };
  renderSnapshotNotes: Record<string, Note>;
  renderSnapshotLinks: Record<string, { id: string }>;
  toScreenPoint: WallChromeContextValue["toScreenPoint"];
  editing: EditingState | null;
  setEditing: (value: { id: string; text: string } | null) => void;
  handleEditorBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
  editTagInput: string;
  setEditTagInput: (value: string) => void;
  editTagRenameFrom: string | null;
  setEditTagRenameFrom: (value: string | null) => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;
  renameTagOnNote: (noteId: string, fromTag: string, toTag: string) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  openImageInsert: (noteId: string) => void;
  wikiLinkOptions: Array<{ noteId: string; title: string }>;
  fetchBookmarkPreview: (noteId: string, url: string, options?: { force?: boolean }) => void | Promise<void>;
  openBookmarkUrl: (url: string) => void;
  selectImageNoteFile: (noteId: string, file: File) => Promise<void>;
  submitImageNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  renameImageNote: (noteId: string, name: string) => void;
  openImageNote: (noteId: string) => void;
  downloadImageNote: (noteId: string) => void;
  selectFileNoteFile: (noteId: string, file: File) => Promise<void>;
  submitFileNoteUrl: (noteId: string, url: string) => void;
  openFileNote: (noteId: string) => void;
  downloadFileNote: (noteId: string) => void;
  selectAudioNoteFile: (noteId: string, file: File) => Promise<void>;
  submitAudioNoteUrl: (noteId: string, url: string) => void;
  renameAudioNote: (noteId: string, name: string) => void;
  openAudioNote: (noteId: string) => void;
  downloadAudioNote: (noteId: string) => void;
  selectVideoNoteFile: (noteId: string, file: File) => Promise<void>;
  submitVideoNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  renameVideoNote: (noteId: string, name: string) => void;
  openVideoNote: (noteId: string) => void;
  downloadVideoNote: (noteId: string) => void;
  selectedNotesCount: number;
  showDetailsPanel: boolean;
  rightPanelOpen: boolean;
  stepZoom: (direction: "in" | "out") => void;
  resetZoom: () => void;
  zoomToFitTracked: () => void;
  zoomToSelection: () => void;
  showHeatmap: boolean;
  timelineEntries: Array<{ ts: number }>;
  jumpToTimelineDay: (day: string) => void;
  timelineMode: boolean;
  timelineIndex: number;
  isTimelinePlaying: boolean;
  setIsTimelinePlaying: Dispatch<SetStateAction<boolean>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
  presentationMode: boolean;
  presentationIndex: number;
  presentationLength: number;
  presentationModeType: "notes" | "narrative";
  narrativePathOptions: Array<{ id: string; title: string; stepsCount: number }>;
  activePresentationPathId: string;
  activePresentationStepTalkingPoints: string;
  createNarrativePath: () => void;
  handleNarrativePathChange: (pathId: string) => void;
  addNarrativeStep: () => void;
  deleteNarrativeStep: () => void;
  updateNarrativeTalkingPoints: (value: string) => void;
  captureNarrativeStepCamera: () => void;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  setPresentationMode: Dispatch<SetStateAction<boolean>>;
  linkMenu: LinkContextMenuState;
  setLinkMenu: Dispatch<SetStateAction<LinkContextMenuState>>;
  deleteLink: (linkId: string) => void;
  updateLinkType: (linkId: string, type: LinkType) => void;
  maxViewportWidth: number;
  maxViewportHeight: number;
  tagPreviewScreen?: { x: number; y: number };
  tagPreviewNote?: Note;
  tagPreviewPalette?: { bg: string; border: string; text: string };
  renderVisibleNotesCount: number;
  historyUndoDepth: number;
  historyRedoDepth: number;
  notes: Note[];
  jumpToStaleNote: () => void;
  jumpToHighPriorityNote: () => void;
  clearHistory: () => void;
  toggleDetailsSection: (key: DetailsSectionKey) => void;
  setRightPanelOpen: (open: boolean) => void;
  ui: WallUiSlice;
  setTemplateType: (value: TemplateType) => void;
  applySelectedTemplate: () => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTagToSelectedNote: () => void;
  primarySelectedNote?: Note;
  activeSelectedNoteIdsCount: number;
  displayedTags: string[];
  removeTagFromSelectedNote: (tag: string) => void;
  focusedNoteId?: string;
  backlinksByNoteId: Record<string, Array<{ noteId: string; title: string }>>;
  focusNote: (noteId: string) => void;
  duplicateNote: (noteId: string) => void;
  togglePinOnNote: (noteId: string) => void;
  toggleHighlightOnNote: (noteId: string) => void;
  toggleFocusNote: (noteId: string) => void;
  setLinkingFromNote: (noteId: string) => void;
  selectedPrivateNoteSupported: boolean;
  selectedPrivateNote?: Note;
  isSelectedPrivateUnlocked: boolean;
  openPrivateModal: (mode: "protect" | "unlock", noteId: string) => void;
  lockPrivateNote: (noteId: string) => void;
  privateSessions: Record<string, PrivateSession>;
  syncWikiLinksForNote: (noteId: string, text: string) => void;
  recallQuery: string;
  setRecallQuery: (value: string) => void;
  recallZoneId: string;
  setRecallZoneId: (value: string) => void;
  recallTag: string;
  setRecallTag: (value: string) => void;
  recallDateFilter: RecallDateFilter;
  setRecallDateFilter: (value: RecallDateFilter) => void;
  visibleZones: Zone[];
  availableRecallTags: string[];
  saveCurrentRecallSearch: () => void;
  savedRecallSearches: SavedRecallSearch[];
  applySavedRecallSearch: (item: SavedRecallSearch) => void;
  setSavedRecallSearches: Dispatch<SetStateAction<SavedRecallSearch[]>>;
  selectedVocabularyNote?: Note;
  vocabularyDueNotesCount: number;
  vocabularyFocusNotesCount: number;
  reviewedTodayCount: number;
  reviewRevealMeaning: boolean;
  setReviewRevealMeaning: Dispatch<SetStateAction<boolean>>;
  toggleVocabularyFlip: (noteId: string) => void;
  makeWordNoteAtViewportCenter: () => void;
  focusNextDueWord: () => void;
  updateVocabularyField: (
    field: "word" | "sourceContext" | "guessMeaning" | "meaning" | "ownSentence",
    value: string,
  ) => void;
  reviewSelectedWord: (outcome: VocabularyReviewOutcome) => void;
  groupLabelInput: string;
  setGroupLabelInput: (value: string) => void;
  selectedZone?: Zone;
  selectedGroup?: ZoneGroup;
  zoneGroups: ZoneGroup[];
  createGroupFromSelectedZone: () => void;
  assignZoneToGroup: (zoneId: string, groupId?: string) => void;
  selectGroup: (groupId?: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  collapseAllZoneGroups: () => void;
  expandAllZoneGroups: () => void;
  deleteGroup: (groupId: string) => void;
  clearNoteSelection: () => void;
  showAutoTagGroups: boolean;
  setShowAutoTagGroups: Dispatch<SetStateAction<boolean>>;
  autoTagGroups: AutoTagGroup[];
  focusBounds: (bounds: Bounds) => void;
  smartMergeItems: SmartMergeSectionItem[];
  previewSmartMerge: (suggestion: SmartMergeSuggestion) => void;
  applySmartMerge: (suggestion: SmartMergeSuggestion) => void;
  quickCaptureOpen: boolean;
  setQuickCaptureOpen: (open: boolean) => void;
  captureNotes: (items: Array<{ text: string; tags: string[] }>) => void;
  exportPng: (scope: "view" | "whole" | "selection" | "zone", pixelRatio: number) => void | Promise<void>;
  exportPdf: (scope: "view" | "whole" | "selection" | "zone") => void | Promise<void>;
  exportMarkdown: () => void;
  exportJson: () => void;
  importJson: (file: File) => void | Promise<void>;
  publishReadOnlySnapshot: () => void | Promise<void>;
  backupReminderCadence: "off" | "daily" | "weekly";
  setBackupReminderCadence: (cadence: "off" | "daily" | "weekly") => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  openTour: () => void;
  preferredFileConversionMode: "pdf_to_word" | "word_to_pdf" | null;
  setFileConversionOpen: (open: boolean) => void;
  setPreferredFileConversionMode: (mode: "pdf_to_word" | "word_to_pdf" | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  userEmail?: string;
  userProfile?: AppUserProfile;
  imageInsertState: ImageInsertState;
  imageInsertTargetLabel?: string;
  closeImageInsert: () => void;
  handleImageFileInsert: (file: File, target?: ImageInsertState) => Promise<void>;
  handleImageUrlInsert: (url: string, target?: ImageInsertState) => Promise<void>;
  handleUnsplashPhotoInsert: (photo: UnsplashPhoto, target?: ImageInsertState) => Promise<void>;
  handleUnsplashMoodboardInsert: (photos: UnsplashPhoto[], target?: ImageInsertState) => Promise<void>;
  setExportOpenTracked: (open: boolean) => void;
  setShortcutsOpenTracked: (open: boolean) => void;
};

export type UseWallSessionBindingsResult = {
  chrome: Partial<WallChromeContextValue>;
  details: Partial<WallDetailsContextValue>;
  modals: Partial<WallModalContextValue>;
};

export const useWallSessionBindings = (options: UseWallSessionBindingsOptions): UseWallSessionBindingsResult => {
  const {
    isTimeLocked,
    camera,
    renderSnapshotNotes,
    renderSnapshotLinks,
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
    selectedNotesCount,
    showDetailsPanel,
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
    activePresentationStepTalkingPoints,
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
    renderVisibleNotesCount,
    historyUndoDepth,
    historyRedoDepth,
    notes,
    jumpToStaleNote,
    jumpToHighPriorityNote,
    clearHistory,
    toggleDetailsSection,
    setRightPanelOpen,
    ui,
    setTemplateType,
    applySelectedTemplate,
    tagInput,
    setTagInput,
    addTagToSelectedNote,
    primarySelectedNote,
    activeSelectedNoteIdsCount,
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
    vocabularyDueNotesCount,
    vocabularyFocusNotesCount,
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
    openTour,
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
  } = options;

  const chrome = useMemo(
    (): Partial<WallChromeContextValue> => ({
      isTimeLocked,
      camera,
      notesById: renderSnapshotNotes,
      linksById: renderSnapshotLinks,
      toScreenPoint,
      editing: {
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
        openImageInsert: (noteId: string) => openImageInsert(noteId),
        wikiLinkOptions: wikiLinkOptions.filter((option) => option.noteId !== editing?.id),
      },
      mediaNoteActions: {
        onSubmitBookmarkUrl: (noteId: string, url: string, bookmarkOptions?: { force?: boolean }) => {
          void fetchBookmarkPreview(noteId, url, bookmarkOptions);
        },
        onOpenBookmarkUrl: openBookmarkUrl,
        onSelectImageNoteFile: selectImageNoteFile,
        onSubmitImageNoteUrl: submitImageNoteUrl,
        onRenameImageNote: renameImageNote,
        onUpdateImageCaption: (noteId: string, caption: string) => {
          updateNote(noteId, { text: caption });
        },
        onOpenImageNote: openImageNote,
        onDownloadImageNote: downloadImageNote,
        onSelectFileNoteFile: selectFileNoteFile,
        onSubmitFileNoteUrl: submitFileNoteUrl,
        onOpenFileNote: openFileNote,
        onDownloadFileNote: downloadFileNote,
        onSelectAudioNoteFile: selectAudioNoteFile,
        onSubmitAudioNoteUrl: submitAudioNoteUrl,
        onRenameAudioNote: renameAudioNote,
        onOpenAudioNote: openAudioNote,
        onDownloadAudioNote: downloadAudioNote,
        onSelectVideoNoteFile: selectVideoNoteFile,
        onSubmitVideoNoteUrl: submitVideoNoteUrl,
        onRenameVideoNote: renameVideoNote,
        onOpenVideoNote: openVideoNote,
        onDownloadVideoNote: downloadVideoNote,
      },
      zoom: {
        canZoomToSelection: selectedNotesCount > 0,
        detailsPanelOpen: showDetailsPanel && rightPanelOpen,
        onZoomIn: () => stepZoom("in"),
        onZoomOut: () => stepZoom("out"),
        onResetZoom: resetZoom,
        onZoomToFit: zoomToFitTracked,
        onZoomToSelection: zoomToSelection,
      },
      timeline: {
        showHeatmap,
        timelineEntries,
        jumpToTimelineDay,
        timelineMode,
        timelineIndex,
        isTimelinePlaying,
        setIsTimelinePlaying,
        setTimelineIndex,
      },
      presentation: {
        presentationMode,
        presentationIndex,
        presentationLength,
        presentationModeType,
        narrativePaths: narrativePathOptions,
        activeNarrativePathId: activePresentationPathId,
        activeStepTalkingPoints: activePresentationStepTalkingPoints,
        onCreateNarrativePath: createNarrativePath,
        onPathChange: handleNarrativePathChange,
        onAddNarrativeStep: addNarrativeStep,
        onDeleteNarrativeStep: deleteNarrativeStep,
        onUpdateStepTalkingPoints: updateNarrativeTalkingPoints,
        onCaptureNarrativeStepCamera: captureNarrativeStepCamera,
        setPresentationIndex,
        setPresentationMode,
      },
      linkMenu: {
        linkMenu,
        setLinkMenu,
        deleteLink,
        updateLinkType,
        maxViewportWidth,
        maxViewportHeight,
      },
      tagPreview: {
        tagPreviewScreen,
        tagPreviewNote,
        tagPreviewPalette,
      },
      history: {
        timelineEntriesCount: timelineEntries.length,
        visibleNotesCount: renderVisibleNotesCount,
        historyUndoDepth,
        historyRedoDepth,
        notes,
        onJumpStale: jumpToStaleNote,
        onJumpPriority: jumpToHighPriorityNote,
        onClearHistory: () => {
          const hasHistory = historyUndoDepth > 0 || historyRedoDepth > 0;
          if (!hasHistory) {
            return;
          }
          const ok = window.confirm("Clear undo/redo history? This cannot be undone.");
          if (ok) {
            clearHistory();
          }
        },
      },
      onToggleDetailsSection: toggleDetailsSection,
      onCloseRightPanel: () => setRightPanelOpen(false),
    }),
    [
      isTimeLocked,
      camera,
      renderSnapshotNotes,
      renderSnapshotLinks,
      editing,
      editTagInput,
      editTagRenameFrom,
      wikiLinkOptions,
      handleEditorBlur,
      addTagToNote,
      removeTagFromNote,
      renameTagOnNote,
      updateNote,
      openImageInsert,
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
      selectedNotesCount,
      showDetailsPanel,
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
      presentationMode,
      presentationIndex,
      presentationLength,
      presentationModeType,
      narrativePathOptions,
      activePresentationPathId,
      activePresentationStepTalkingPoints,
      createNarrativePath,
      handleNarrativePathChange,
      addNarrativeStep,
      deleteNarrativeStep,
      updateNarrativeTalkingPoints,
      captureNarrativeStepCamera,
      linkMenu,
      maxViewportWidth,
      maxViewportHeight,
      deleteLink,
      updateLinkType,
      tagPreviewScreen,
      tagPreviewNote,
      tagPreviewPalette,
      renderVisibleNotesCount,
      historyUndoDepth,
      historyRedoDepth,
      notes,
      jumpToStaleNote,
      jumpToHighPriorityNote,
      clearHistory,
      toggleDetailsSection,
      setEditing,
      setEditTagInput,
      setEditTagRenameFrom,
      setIsTimelinePlaying,
      setTimelineIndex,
      setPresentationIndex,
      setPresentationMode,
      setLinkMenu,
      setRightPanelOpen,
      toScreenPoint,
    ],
  );

  const details = useMemo(
    (): Partial<WallDetailsContextValue> => ({
      templateType: ui.templateType,
      onTemplateTypeChange: (value: typeof ui.templateType) => setTemplateType(value),
      onApplyTemplate: applySelectedTemplate,
      tagInput,
      onTagInputChange: setTagInput,
      onAddTag: addTagToSelectedNote,
      selectedNote: primarySelectedNote,
      selectedNoteId: ui.selectedNoteId,
      selectedNoteIdsCount: activeSelectedNoteIdsCount,
      displayedTags,
      onRemoveTag: removeTagFromSelectedNote,
      linkingFromNoteId: ui.linkingFromNoteId,
      isSelectedNoteFocused: Boolean(primarySelectedNote && focusedNoteId === primarySelectedNote.id),
      backlinks: primarySelectedNote ? backlinksByNoteId[primarySelectedNote.id] ?? [] : [],
      onNavigateLinkedNote: focusNote,
      onTextFontChange: (font: NoteTextFont) => {
        if (!primarySelectedNote || isTimeLocked) {
          return;
        }
        updateNote(primarySelectedNote.id, { textFont: font });
      },
      onTextSizeChange: (sizePx: number) => {
        if (!primarySelectedNote || isTimeLocked) {
          return;
        }
        updateNote(primarySelectedNote.id, { textSizePx: sizePx });
      },
      onTextColorChange: (color: string) => {
        if (!primarySelectedNote || isTimeLocked) {
          return;
        }
        updateNote(primarySelectedNote.id, { textColor: color });
      },
      onTextHorizontalAlignChange: (align: "left" | "center" | "right") => {
        if (!primarySelectedNote || isTimeLocked) {
          return;
        }
        updateNote(primarySelectedNote.id, { textAlign: align });
      },
      onTextVerticalAlignChange: (align: "top" | "middle" | "bottom") => {
        if (!primarySelectedNote || isTimeLocked) {
          return;
        }
        updateNote(primarySelectedNote.id, { textVAlign: align });
      },
      onBackgroundColorChange: (color: string) => {
        if (!primarySelectedNote || isTimeLocked) {
          return;
        }
        updateNote(primarySelectedNote.id, { color });
      },
      onDuplicateSelectedNote: duplicateNote,
      onTogglePinSelectedNote: togglePinOnNote,
      onToggleHighlightSelectedNote: toggleHighlightOnNote,
      onToggleFocusSelectedNote: toggleFocusNote,
      onStartLinkFromSelectedNote: setLinkingFromNote,
      onUpdateSelectedNote: updateNote,
      privateNoteSupported: selectedPrivateNoteSupported,
      isPrivateEnabled: Boolean(selectedPrivateNote),
      isPrivateUnlocked: isSelectedPrivateUnlocked,
      onProtectPrivateNote: (noteId: string) => openPrivateModal("protect", noteId),
      onUnlockPrivateNote: (noteId: string) => openPrivateModal("unlock", noteId),
      onLockPrivateNote: lockPrivateNote,
      onRemovePrivateProtection: (noteId: string) => {
        const selected = renderSnapshotNotes[noteId];
        const session = privateSessions[noteId];
        if (!selected || !isPrivateNote(selected) || !session) {
          return;
        }
        useWallStore.getState().patchNote(noteId, {
          ...session.hidden,
          noteKind: session.hidden.noteKind ?? selected.noteKind,
          tags: session.hidden.tags.length > 0 ? session.hidden.tags : selected.tags,
          privateNote: undefined,
        });
        syncWikiLinksForNote(noteId, session.hidden.text);
        lockPrivateNote(noteId);
      },
      recallQuery,
      onRecallQueryChange: setRecallQuery,
      recallZoneId,
      onRecallZoneIdChange: setRecallZoneId,
      recallTag,
      onRecallTagChange: setRecallTag,
      recallDateFilter,
      onRecallDateFilterChange: setRecallDateFilter,
      visibleZones,
      availableRecallTags,
      onSaveRecallSearch: saveCurrentRecallSearch,
      onClearRecallFilters: () => {
        setRecallQuery("");
        setRecallZoneId("");
        setRecallTag("");
        setRecallDateFilter("all");
      },
      savedRecallSearches,
      onApplySavedRecallSearch: applySavedRecallSearch,
      onDeleteSavedRecallSearch: (id: string) =>
        setSavedRecallSearches((previous) => previous.filter((entry) => entry.id !== id)),
      isSelectedNoteVocabulary: Boolean(selectedVocabularyNote),
      vocabularyDueCount: vocabularyDueNotesCount,
      vocabularyFocusCount: vocabularyFocusNotesCount,
      reviewedTodayCount,
      reviewRevealMeaning,
      onToggleRevealMeaning: () => setReviewRevealMeaning((previous) => !previous),
      onToggleFlipCard: () => {
        if (selectedVocabularyNote) {
          toggleVocabularyFlip(selectedVocabularyNote.id);
        }
      },
      onCreateWordNote: makeWordNoteAtViewportCenter,
      onFocusNextDueWord: focusNextDueWord,
      onUpdateVocabularyField: updateVocabularyField,
      onReviewSelectedWord: reviewSelectedWord,
      groupLabelInput,
      onGroupLabelInputChange: setGroupLabelInput,
      selectedZone,
      selectedGroup,
      selectedZoneId: ui.selectedZoneId,
      zoneGroups,
      onCreateGroupFromSelectedZone: createGroupFromSelectedZone,
      onAssignZoneToGroup: assignZoneToGroup,
      onSelectGroup: selectGroup,
      onToggleGroupCollapse: toggleGroupCollapse,
      onCollapseAllGroups: collapseAllZoneGroups,
      onExpandAllGroups: expandAllZoneGroups,
      onDeleteGroup: deleteGroup,
      onClearNoteSelection: clearNoteSelection,
      showAutoTagGroups,
      onToggleAutoTagGroups: () => setShowAutoTagGroups((value) => !value),
      autoTagGroups,
      onFocusBounds: focusBounds,
      smartMergeSuggestions: smartMergeItems,
      onPreviewSmartMerge: previewSmartMerge,
      onMergeSmartSuggestion: applySmartMerge,
    }),
    [
      ui,
      applySelectedTemplate,
      tagInput,
      addTagToSelectedNote,
      primarySelectedNote,
      activeSelectedNoteIdsCount,
      displayedTags,
      removeTagFromSelectedNote,
      focusedNoteId,
      backlinksByNoteId,
      focusNote,
      isTimeLocked,
      updateNote,
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
      renderSnapshotNotes,
      privateSessions,
      syncWikiLinksForNote,
      recallQuery,
      recallZoneId,
      recallTag,
      recallDateFilter,
      visibleZones,
      availableRecallTags,
      saveCurrentRecallSearch,
      savedRecallSearches,
      applySavedRecallSearch,
      selectedVocabularyNote,
      vocabularyDueNotesCount,
      vocabularyFocusNotesCount,
      reviewedTodayCount,
      reviewRevealMeaning,
      toggleVocabularyFlip,
      makeWordNoteAtViewportCenter,
      focusNextDueWord,
      updateVocabularyField,
      reviewSelectedWord,
      groupLabelInput,
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
      autoTagGroups,
      focusBounds,
      smartMergeItems,
      previewSmartMerge,
      applySmartMerge,
      setTemplateType,
      setTagInput,
      setRecallQuery,
      setRecallZoneId,
      setRecallTag,
      setRecallDateFilter,
      setSavedRecallSearches,
      setReviewRevealMeaning,
      setShowAutoTagGroups,
      setGroupLabelInput,
    ],
  );

  const modals = useMemo(
    (): Partial<WallModalContextValue> => ({
      isTimeLocked,
      quickCaptureOpen,
      onCloseQuickCapture: () => setQuickCaptureOpen(false),
      onCapture: captureNotes,
      isExportOpen: ui.isExportOpen,
      onCloseExport: () => setExportOpenTracked(false),
      onExportPng: (scope: "view" | "whole" | "selection" | "zone", pixelRatio: number) => {
        void exportPng(scope, pixelRatio);
      },
      onExportPdf: (scope: "view" | "whole" | "selection" | "zone") => {
        void exportPdf(scope);
      },
      onExportMarkdown: exportMarkdown,
      onExportJson: exportJson,
      onImportJson: (file: File) => {
        void importJson(file);
      },
      onPublishSnapshot: () => {
        void publishReadOnlySnapshot();
      },
      backupReminderCadence,
      onBackupReminderCadenceChange: setBackupReminderCadence,
      isShortcutsOpen: ui.isShortcutsOpen,
      onCloseShortcuts: () => setShortcutsOpenTracked(false),
      isHelpOpen: helpOpen,
      onCloseHelp: () => setHelpOpen(false),
      onOpenHelpShortcuts: () => setShortcutsOpenTracked(true),
      onOpenHelpSettings: () => setSettingsOpen(true),
      onReplayTour: openTour,
      isFileConversionOpen: ui.isFileConversionOpen,
      onCloseFileConversion: () => {
        setFileConversionOpen(false);
        setPreferredFileConversionMode(null);
      },
      onOpenFileConversion: () => setFileConversionOpen(true),
      preferredFileConversionMode,
      isSettingsOpen: settingsOpen,
      onCloseSettings: () => setSettingsOpen(false),
      userEmail,
      userProfile,
      imageInsertOpen: imageInsertState.open,
      imageInsertTargetLabel,
      onCloseImageInsert: closeImageInsert,
      onSelectImageFile: (file: File) => handleImageFileInsert(file, imageInsertState),
      onSubmitImageUrl: (url: string) => handleImageUrlInsert(url, imageInsertState),
      onSelectUnsplashPhoto: (photo: UnsplashPhoto) => handleUnsplashPhotoInsert(photo, imageInsertState),
      onInsertUnsplashMoodboard: (photos: UnsplashPhoto[]) => handleUnsplashMoodboardInsert(photos, imageInsertState),
    }),
    [
      isTimeLocked,
      quickCaptureOpen,
      captureNotes,
      ui.isExportOpen,
      ui.isShortcutsOpen,
      ui.isFileConversionOpen,
      exportPng,
      exportPdf,
      exportMarkdown,
      exportJson,
      importJson,
      publishReadOnlySnapshot,
      backupReminderCadence,
      helpOpen,
      openTour,
      preferredFileConversionMode,
      settingsOpen,
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
      setQuickCaptureOpen,
      setBackupReminderCadence,
      setHelpOpen,
      setSettingsOpen,
      setFileConversionOpen,
      setPreferredFileConversionMode,
    ],
  );

  return { chrome, details, modals };
};
