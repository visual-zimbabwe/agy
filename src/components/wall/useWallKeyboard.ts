"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { useWallStore } from "@/features/wall/store";
import type { Note } from "@/features/wall/types";
import { readKeyboardColorSlots } from "@/lib/keyboard-color-slots";

type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };

type WallKeyboardUiState = {
  isShortcutsOpen: boolean;
  selectedNoteId?: string;
  selectedZoneId?: string;
  selectedLinkId?: string;
  selectedGroupId?: string;
  selectedNoteGroupId?: string;
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
  readingMode: boolean;
  presentationMode: boolean;
  presentationLength: number;
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
  setReadingMode: (enabled: boolean) => void;
  createNote: (x: number, y: number, color?: string) => string;
  createWordNote: () => void;
  openEditor: (noteId: string, text: string) => void;
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
  readingMode,
  presentationMode,
  presentationLength,
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
  setReadingMode,
  createNote,
  createWordNote,
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
}: WallKeyboardOptions) => {
  const colorQuickSwitchArmedRef = useRef(false);
  const colorQuickSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const armColorQuickSwitch = () => {
      colorQuickSwitchArmedRef.current = true;
      if (colorQuickSwitchTimerRef.current) {
        clearTimeout(colorQuickSwitchTimerRef.current);
      }
      colorQuickSwitchTimerRef.current = setTimeout(() => {
        colorQuickSwitchArmedRef.current = false;
      }, 5000);
    };

    const applyColor = (color: string) => {
      if (isTimeLocked) {
        return;
      }
      const { patchNote, setLastColor } = useWallStore.getState();

      const targetIds = selectedNoteIds.length > 0 ? selectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
      if (targetIds.length === 0) {
        setLastColor(color);
        return;
      }

      for (const noteId of targetIds) {
        patchNote(noteId, { color });
      }
      setLastColor(color);
    };

    const applyColorByIndex = (index: number) => {
      const color = readKeyboardColorSlots()[index];
      if (!color) {
        return;
      }
      applyColor(color);
    };

    const cycleColor = () => {
      const cyclePalette = readKeyboardColorSlots().filter((value): value is string => typeof value === "string");
      if (cyclePalette.length === 0) {
        return;
      }
      const activeNoteId = selectedNoteIds[0] ?? ui.selectedNoteId;
      const activeColor = activeNoteId ? notesMap[activeNoteId]?.color ?? ui.lastColor : ui.lastColor;
      const currentIndex = cyclePalette.findIndex((color) => color.toLowerCase() === activeColor.toLowerCase());
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % cyclePalette.length;
      const nextColor = cyclePalette[nextIndex];
      if (!nextColor) {
        return;
      }
      applyColor(nextColor);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setIsSpaceDown(true);
      }

      const typing = isTypingInField(event);

      if ((event.key === "?" || (event.shiftKey && event.key === "/")) && !typing) {
        event.preventDefault();
        if (readingMode) {
          return;
        }
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
      const digit = Number.parseInt(event.key, 10);

      if (!ctrlOrMeta && !event.altKey && event.shiftKey && key === "c") {
        event.preventDefault();
        cycleColor();
        return;
      }

      if (!ctrlOrMeta && !event.altKey && !event.shiftKey && key === "c") {
        event.preventDefault();
        armColorQuickSwitch();
        return;
      }

      if (!ctrlOrMeta && !event.altKey && Number.isInteger(digit) && digit >= 1 && digit <= 9) {
        if (!colorQuickSwitchArmedRef.current) {
          return;
        }
        event.preventDefault();
        applyColorByIndex(digit - 1);
        return;
      }

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
          setReadingMode(false);
          setPresentationIndex(0);
          setQuickCaptureOpen(false);
          setSearchOpen(false);
          setExportOpen(false);
        }
        return;
      }

      if (!ctrlOrMeta && key === "r") {
        event.preventDefault();
        const next = !readingMode;
        setReadingMode(next);
        if (next) {
          setPresentationMode(false);
          setQuickCaptureOpen(false);
          setSearchOpen(false);
          setExportOpen(false);
        }
        return;
      }

      if (readingMode) {
        return;
      }

      if (presentationMode && (event.key === "ArrowRight" || event.key === "ArrowDown")) {
        event.preventDefault();
        setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, presentationLength - 1)));
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

      if (!ctrlOrMeta && event.shiftKey && key === "w") {
        event.preventDefault();
        createWordNote();
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
          return;
        }

        if (ui.selectedNoteGroupId) {
          const ok = window.confirm("Delete selected note group?");
          if (ok) {
            deleteNoteGroup(ui.selectedNoteGroupId);
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
      if (colorQuickSwitchTimerRef.current) {
        clearTimeout(colorQuickSwitchTimerRef.current);
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    camera,
    clearGuideLines,
    createNote,
    createWordNote,
    deleteGroup,
    deleteLink,
    deleteNote,
    deleteZone,
    deleteNoteGroup,
    duplicateNote,
    editing,
    isTimeLocked,
    notes,
    notesMap,
    openEditor,
    presentationLength,
    presentationMode,
    readingMode,
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
    setReadingMode,
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
