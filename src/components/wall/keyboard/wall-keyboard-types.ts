import type { MutableRefObject } from "react";

export type Camera = { x: number; y: number; zoom: number };
export type Viewport = { w: number; h: number };

export type WallKeyboardUiState = {
  isShortcutsOpen: boolean;
  selectedNoteId?: string;
  selectedZoneId?: string;
  selectedLinkId?: string;
  selectedGroupId?: string;
  selectedNoteGroupId?: string;
  lastColor: string;
};

export type WallKeyboardOptions = {
  camera: Camera;
  viewport: Viewport;
  notes: import("@/features/wall/types").Note[];
  notesMap: Record<string, import("@/features/wall/types").Note>;
  renderNotesById: Record<string, import("@/features/wall/types").Note>;
  ui: WallKeyboardUiState;
  selectedNoteIds: string[];
  editing: { id: string; text: string } | null;
  isTimeLocked: boolean;
  readingMode: boolean;
  presentationMode: boolean;
  presentationLength: number;
  timelineEntriesLength: number;
  timelineViewActive: boolean;
  timelineModeRef: MutableRefObject<boolean>;
  setIsSpaceDown: (value: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setQuickCaptureOpen: (open: boolean | ((previous: boolean) => boolean)) => void;
  setEditing: (value: { id: string; text: string } | null) => void;
  clearGuideLines: () => void;
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
  createViewportNote: () => string | undefined;
  createCanonNote: () => void;
  createJournalNote: () => void;
  createQuoteNote: () => void;
  createEisenhowerNote: () => void;
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  redo: () => void;
  undo: () => void;
  setLinkingFromNote: (noteId?: string) => void;
  duplicateNote: (noteId: string) => void;
  deleteNote: (noteId: string) => void;
  deleteZone: (zoneId: string) => void;
  deleteLink: (linkId: string) => void;
  deleteGroup: (groupId: string) => void;
  deleteNoteGroup: (groupId: string) => void;
};

export const isTypingInField = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
};

export type WallKeyboardHandlerContext = WallKeyboardOptions & {
  colorQuickSwitchArmedRef: MutableRefObject<boolean>;
  colorQuickSwitchTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
};

export type WallKeyboardKeyHandler = (event: KeyboardEvent, context: WallKeyboardHandlerContext) => boolean;
