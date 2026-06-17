"use client";

import { useCallback } from "react";

import { updateNote } from "@/features/wall/commands";
import type { Note } from "@/features/wall/types";

type UseWallNoteTagActionsOptions = {
  isTimeLocked: boolean;
  renderSnapshotNotes: Record<string, Note>;
};

export const useWallNoteTagActions = ({ isTimeLocked, renderSnapshotNotes }: UseWallNoteTagActionsOptions) => {
  const normalizeTag = (raw: string) => raw.trim().replace(/^#/, "").toLowerCase();

  const addTagToNote = useCallback(
    (noteId: string, rawTag: string) => {
      const note = renderSnapshotNotes[noteId];
      if (!note || isTimeLocked) {
        return;
      }
      const tag = normalizeTag(rawTag);
      if (!tag || note.tags.includes(tag)) {
        return;
      }
      updateNote(noteId, { tags: [...note.tags, tag] });
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const removeTagFromNote = useCallback(
    (noteId: string, tag: string) => {
      const note = renderSnapshotNotes[noteId];
      if (!note || isTimeLocked) {
        return;
      }
      updateNote(noteId, { tags: note.tags.filter((value) => value !== tag) });
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const renameTagOnNote = useCallback(
    (noteId: string, from: string, rawTo: string) => {
      const note = renderSnapshotNotes[noteId];
      if (!note || isTimeLocked) {
        return;
      }
      const to = normalizeTag(rawTo);
      if (!to) {
        return;
      }
      const next = note.tags.map((tag) => (tag === from ? to : tag));
      updateNote(noteId, { tags: [...new Set(next)] });
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  return {
    addTagToNote,
    removeTagFromNote,
    renameTagOnNote,
  };
};
