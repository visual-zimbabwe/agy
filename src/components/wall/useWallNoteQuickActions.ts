"use client";

import { useCallback } from "react";

import { setAllGroupsCollapsed, updateNote } from "@/features/wall/commands";
import type { Note } from "@/features/wall/types";

type UseWallNoteQuickActionsOptions = {
  isTimeLocked: boolean;
  renderSnapshotNotes: Record<string, Note>;
  setEditing: (value: { id: string; text: string } | null | ((previous: { id: string; text: string } | null) => { id: string; text: string } | null)) => void;
  syncPrimarySelection: (noteIds: string[]) => void;
  selectNote: (noteId?: string) => void;
  setFocusedNoteId: (value: string | undefined | ((previous: string | undefined) => string | undefined)) => void;
};

export const useWallNoteQuickActions = ({
  isTimeLocked,
  renderSnapshotNotes,
  setEditing,
  syncPrimarySelection,
  selectNote,
  setFocusedNoteId,
}: UseWallNoteQuickActionsOptions) => {
  const selectSingleNote = useCallback(
    (noteId: string) => {
      syncPrimarySelection([noteId]);
      setEditing((previous) => (previous?.id === noteId ? previous : null));
    },
    [setEditing, syncPrimarySelection],
  );

  const toggleFocusNote = useCallback(
    (noteId: string) => {
      syncPrimarySelection([noteId]);
      selectNote(noteId);
      setFocusedNoteId((previous) => (previous === noteId ? undefined : noteId));
    },
    [selectNote, setFocusedNoteId, syncPrimarySelection],
  );

  const togglePinOnNote = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }
      const note = renderSnapshotNotes[noteId];
      if (!note) {
        return;
      }
      updateNote(noteId, { pinned: !note.pinned });
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const toggleHighlightOnNote = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }
      const note = renderSnapshotNotes[noteId];
      if (!note) {
        return;
      }
      updateNote(noteId, { highlighted: !note.highlighted });
    },
    [isTimeLocked, renderSnapshotNotes],
  );

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

  return {
    selectSingleNote,
    toggleFocusNote,
    togglePinOnNote,
    toggleHighlightOnNote,
    collapseAllZoneGroups,
    expandAllZoneGroups,
  };
};
