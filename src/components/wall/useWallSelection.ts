"use client";

import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";

import type { Note } from "@/features/wall/types";

type Bounds = { x: number; y: number; w: number; h: number };
type SelectionBox = { startX: number; startY: number; x: number; y: number; w: number; h: number };

type UseWallSelectionOptions = {
  notesById: Record<string, Note>;
  visibleNotes: Note[];
  selectedNoteIds: string[];
  setSelectedNoteIds: Dispatch<SetStateAction<string[]>>;
  selectNote: (noteId?: string) => void;
  selectionBox: SelectionBox | null;
  setSelectionBox: Dispatch<SetStateAction<SelectionBox | null>>;
};

const boundsIntersect = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

export const useWallSelection = ({
  notesById,
  visibleNotes,
  selectedNoteIds,
  setSelectedNoteIds,
  selectNote,
  selectionBox,
  setSelectionBox,
}: UseWallSelectionOptions) => {
  const activeSelectedNoteIds = useMemo(
    () => selectedNoteIds.filter((id) => Boolean(notesById[id])),
    [notesById, selectedNoteIds],
  );
  const activeSelectedNoteIdSet = useMemo(() => new Set(activeSelectedNoteIds), [activeSelectedNoteIds]);
  const selectedNotes = useMemo(
    () =>
      activeSelectedNoteIds
        .map((id) => notesById[id])
        .filter((note): note is Note => Boolean(note)),
    [activeSelectedNoteIds, notesById],
  );

  const syncPrimarySelection = useCallback(
    (ids: string[]) => {
      const nextIds = ids.filter((id) => Boolean(notesById[id]));
      setSelectedNoteIds(nextIds);
      if (nextIds.length === 1) {
        selectNote(nextIds[0]);
      } else {
        selectNote(undefined);
      }
    },
    [notesById, selectNote, setSelectedNoteIds],
  );

  const toggleSelectNote = useCallback(
    (noteId: string) => {
      const exists = activeSelectedNoteIds.includes(noteId);
      const next = exists ? activeSelectedNoteIds.filter((id) => id !== noteId) : [...activeSelectedNoteIds, noteId];
      setSelectedNoteIds(next);
      if (next.length === 1) {
        selectNote(next[0]);
      } else {
        selectNote(undefined);
      }
    },
    [activeSelectedNoteIds, selectNote, setSelectedNoteIds],
  );

  const clearNoteSelection = useCallback(() => {
    setSelectedNoteIds([]);
    selectNote(undefined);
  }, [selectNote, setSelectedNoteIds]);

  const finalizeBoxSelection = useCallback(() => {
    if (!selectionBox) {
      return;
    }

    const normalized: Bounds = {
      x: Math.min(selectionBox.startX, selectionBox.x),
      y: Math.min(selectionBox.startY, selectionBox.y),
      w: Math.abs(selectionBox.w),
      h: Math.abs(selectionBox.h),
    };

    const hitIds = visibleNotes
      .filter((note) => boundsIntersect(normalized, { x: note.x, y: note.y, w: note.w, h: note.h }))
      .map((note) => note.id);

    syncPrimarySelection(hitIds);
    setSelectionBox(null);
  }, [selectionBox, setSelectionBox, syncPrimarySelection, visibleNotes]);

  return {
    activeSelectedNoteIds,
    activeSelectedNoteIdSet,
    selectedNotes,
    syncPrimarySelection,
    toggleSelectNote,
    clearNoteSelection,
    finalizeBoxSelection,
  };
};
