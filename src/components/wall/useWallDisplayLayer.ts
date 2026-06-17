"use client";

import { useMemo } from "react";

import { isPrivateNote, type PrivateNoteHiddenFields } from "@/features/wall/private-notes";
import type { Link, Note, Zone } from "@/features/wall/types";

type PrivateSession = {
  password: string;
  hidden: PrivateNoteHiddenFields;
  lastActivityAt: number;
};

type UseWallDisplayLayerOptions = {
  renderSnapshotNotes: Record<string, Note>;
  privateSessions: Record<string, PrivateSession>;
  focusedNoteId?: string;
  visibleNotes: Note[];
  visibleZones: Zone[];
  visibleLinks: Link[];
  pathLinkIds: Set<string>;
};

export const useWallDisplayLayer = ({
  renderSnapshotNotes,
  privateSessions,
  focusedNoteId,
  visibleNotes,
  visibleZones,
  visibleLinks,
  pathLinkIds,
}: UseWallDisplayLayerOptions) => {
  const displayNotesById = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(renderSnapshotNotes).map(([noteId, note]) => {
          const session = privateSessions[noteId];
          if (!isPrivateNote(note) || !session) {
            return [noteId, note];
          }
          return [
            noteId,
            {
              ...note,
              ...session.hidden,
              noteKind: session.hidden.noteKind ?? note.noteKind,
              tags: session.hidden.tags.length > 0 ? session.hidden.tags : note.tags,
              privateNote: undefined,
            },
          ];
        }),
      ) as Record<string, Note>,
    [privateSessions, renderSnapshotNotes],
  );

  const focusedNote = focusedNoteId ? renderSnapshotNotes[focusedNoteId] : undefined;
  const isFocusMode = Boolean(focusedNote);

  const renderVisibleNotes = useMemo(
    () => (focusedNote ? visibleNotes.filter((note) => note.id === focusedNote.id) : visibleNotes),
    [focusedNote, visibleNotes],
  );

  const displayVisibleNotes = useMemo(
    () => renderVisibleNotes.map((note) => displayNotesById[note.id] ?? note),
    [displayNotesById, renderVisibleNotes],
  );

  const renderVisibleZones = useMemo(() => (focusedNote ? [] : visibleZones), [focusedNote, visibleZones]);
  const renderVisibleLinks = useMemo(() => (focusedNote ? [] : visibleLinks), [focusedNote, visibleLinks]);
  const renderPathLinkIds = useMemo(() => (focusedNote ? new Set<string>() : pathLinkIds), [focusedNote, pathLinkIds]);

  return {
    displayNotesById,
    focusedNote,
    isFocusMode,
    renderVisibleNotes,
    displayVisibleNotes,
    renderVisibleZones,
    renderVisibleLinks,
    renderPathLinkIds,
  };
};
