"use client";

import { useWallKeyboard } from "@/components/wall/useWallKeyboard";
import { toWorldPoint } from "@/components/wall/wall-coordinates";
import {
  createNote,
  deleteGroup,
  deleteLink,
  deleteNote,
  deleteNoteGroup,
  deleteZone,
  duplicateNote,
} from "@/features/wall/commands";
import { NOTE_COLORS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";
import type { MutableRefObject } from "react";

type EditingState = {
  id: string;
  text: string;
  focusField?: string;
};

type UseWallKeyboardBindingsOptions = {
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
  notes: Note[];
  notesMap: Record<string, Note>;
  renderSnapshotNotes: Record<string, Note>;
  ui: {
    isShortcutsOpen: boolean;
    selectedNoteId?: string;
    selectedZoneId?: string;
    selectedLinkId?: string;
    selectedGroupId?: string;
    selectedNoteGroupId?: string;
    lastColor?: string;
  };
  selectedNoteIds: string[];
  editing: EditingState | null;
  isTimeLocked: boolean;
  readingMode: boolean;
  presentationMode: boolean;
  presentationLengthForKeyboard: number;
  timelineEntriesLength: number;
  timelineViewActive: boolean;
  timelineModeRef: MutableRefObject<boolean>;
  setIsSpaceDown: (value: boolean) => void;
  setShortcutsOpenTracked: (open: boolean) => void;
  setSearchOpenTracked: (open: boolean) => void;
  setExportOpenTracked: (open: boolean) => void;
  setQuickCaptureOpen: (value: boolean | ((previous: boolean) => boolean)) => void;
  setEditing: (value: EditingState | null) => void;
  setGuideLines: (value: { vertical?: { x: number; y1: number; y2: number; distance?: number }; horizontal?: { y: number; x1: number; x2: number; distance?: number } }) => void;
  resetSelection: () => void;
  setSelectedNoteIds: (ids: string[]) => void;
  selectNote: (noteId?: string) => void;
  setTimelineMode: (enabled: boolean) => void;
  setTimelineIndex: (value: number | ((previous: number) => number)) => void;
  setIsTimelinePlaying: (playing: boolean) => void;
  toggleTimelineView: () => void;
  setShowHeatmap: (updater: (previous: boolean) => boolean) => void;
  setPresentationMode: (enabled: boolean) => void;
  setPresentationIndex: (value: number | ((previous: number) => number)) => void;
  setReadingMode: (enabled: boolean) => void;
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  redo: () => void;
  undo: () => void;
  setLinkingFromNote: (noteId?: string) => void;
  makeCanonNoteAtViewportCenter: () => void;
  makeJournalNoteAtViewportCenter: () => void;
  makeQuoteNoteAtViewportCenter: () => void;
  makeEisenhowerNoteAtViewportCenter: () => void;
  placeNewNote: (
    preferredCenter: { x: number; y: number },
    size?: { w: number; h: number },
    extraOccupiedRects?: Array<{ x: number; y: number; w: number; h: number }>,
  ) => { x: number; y: number };
};

export const useWallKeyboardBindings = ({
  camera,
  viewport,
  notes,
  notesMap,
  renderSnapshotNotes,
  ui,
  selectedNoteIds,
  editing,
  isTimeLocked,
  readingMode,
  presentationMode,
  presentationLengthForKeyboard,
  timelineEntriesLength,
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
}: UseWallKeyboardBindingsOptions) => {
  useWallKeyboard({
    camera,
    viewport,
    notes,
    notesMap,
    renderNotesById: renderSnapshotNotes,
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
    timelineEntriesLength,
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
};
