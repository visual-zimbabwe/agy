"use client";

import { useEffect, type MutableRefObject } from "react";

import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { Note } from "@/features/wall/types";

type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };

type WallKeyboardUiState = {
  isShortcutsOpen: boolean;
  selectedNoteId?: string;
  selectedZoneId?: string;
  selectedLinkId?: string;
  selectedGroupId?: string;
  lastColor: string;
};

type WallKeyboardOptions = {
  camera: Camera;
  viewport: Viewport;
  notes: Note[];
  notesMap: Record<string, Note>;
  renderNotesById: Record<string, Note>;
  ui: WallKeyboardUiState;
  selectedNoteIds: string[];
  editing: { id: string; text: string } | null;
  isTimeLocked: boolean;
  presentationMode: boolean;
  timelineEntriesLength: number;
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
  setShowHeatmap: (updater: (previous: boolean) => boolean) => void;
  setPresentationMode: (enabled: boolean) => void;
  setPresentationIndex: (value: number | ((previous: number) => number)) => void;
  createNote: (x: number, y: number, color?: string) => string;
  openEditor: (noteId: string, text: string) => void;
  redo: () => void;
  undo: () => void;
  setLinkingFromNote: (noteId?: string) => void;
  duplicateNote: (noteId: string) => void;
  deleteNote: (noteId: string) => void;
  deleteZone: (zoneId: string) => void;
  deleteLink: (linkId: string) => void;
  deleteGroup: (groupId: string) => void;
};

const isTypingInField = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
};

const toWorldPoint = (screenX: number, screenY: number, camera: Camera) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

export const useWallKeyboard = ({
  camera,
  viewport,
  notes,
  notesMap,
  renderNotesById,
  ui,
  selectedNoteIds,
  editing,
  isTimeLocked,
  presentationMode,
  timelineEntriesLength,
  timelineModeRef,
  setIsSpaceDown,
  setShortcutsOpen,
  setSearchOpen,
  setExportOpen,
  setQuickCaptureOpen,
  setEditing,
  clearGuideLines,
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
}: WallKeyboardOptions) => {
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
        clearGuideLines();
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
        const next = !timelineModeRef.current;
        setTimelineMode(next);
        if (next && timelineEntriesLength > 0) {
          setTimelineIndex(timelineEntriesLength - 1);
        }
        if (!next) {
          setIsTimelinePlaying(false);
        }
        return;
      }

      if (!ctrlOrMeta && key === "h") {
        event.preventDefault();
        setShowHeatmap((previous) => !previous);
        return;
      }

      if (!ctrlOrMeta && key === "p") {
        event.preventDefault();
        const next = !presentationMode;
        setPresentationMode(next);
        if (next) {
          setPresentationIndex(0);
          setQuickCaptureOpen(false);
          setSearchOpen(false);
          setExportOpen(false);
        }
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
        const selected = renderNotesById[ui.selectedNoteId];
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
    clearGuideLines,
    createNote,
    deleteGroup,
    deleteLink,
    deleteNote,
    deleteZone,
    duplicateNote,
    editing,
    isTimeLocked,
    notes,
    notesMap,
    openEditor,
    presentationMode,
    redo,
    renderNotesById,
    resetSelection,
    selectNote,
    selectedNoteIds,
    setEditing,
    setExportOpen,
    setIsSpaceDown,
    setIsTimelinePlaying,
    setLinkingFromNote,
    setPresentationIndex,
    setPresentationMode,
    setQuickCaptureOpen,
    setSearchOpen,
    setSelectedNoteIds,
    setShortcutsOpen,
    setShowHeatmap,
    setTimelineIndex,
    setTimelineMode,
    timelineEntriesLength,
    timelineModeRef,
    ui,
    undo,
    viewport,
  ]);
};
