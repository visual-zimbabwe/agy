"use client";

import { type FocusEvent, useCallback, useEffect, useRef, useState } from "react";

import { findOpenNotePosition } from "@/components/wall/wall-coordinates";
import { createLink, createNote, updateNote } from "@/features/wall/commands";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import {
  PRIVATE_NOTE_AUTO_LOCK_MS,
  canInlineEditPrivateNote,
  canProtectNote,
  createPrivateNoteHiddenFields,
  createPrivateNoteShellPatch,
  decryptPrivateNote,
  encryptPrivateNote,
  isPrivateNote,
  type PrivateNoteHiddenFields,
} from "@/features/wall/private-notes";
import { useWallStore } from "@/features/wall/store";
import type { Note } from "@/features/wall/types";
import { extractWikiLinks, findNoteByWikiTitle, normalizeWikiTitle } from "@/features/wall/wiki-links";
import { parseTaggedText } from "@/lib/tag-utils";

type EditingState = {
  id: string;
  text: string;
  focusField?: string;
};

type PrivateSession = {
  password: string;
  hidden: PrivateNoteHiddenFields;
  lastActivityAt: number;
};

type PrivateModalState = {
  open: boolean;
  mode: "protect" | "unlock";
  noteId?: string;
  focusField?: string;
  reopenEditor?: boolean;
  error?: string;
};

type UseWallPrivateNotesOptions = {
  renderSnapshotNotes: Record<string, Note>;
  isTimeLocked: boolean;
  timelineViewActive: boolean;
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
  occupiedNoteRects: Array<{ x: number; y: number; w: number; h: number }>;
  setEditing: (value: EditingState | null | ((previous: EditingState | null) => EditingState | null)) => void;
  setEditTagInput: (value: string) => void;
  setEditTagRenameFrom: (value: string | null) => void;
  setSelectedNoteIds: (value: string[] | ((previous: string[]) => string[])) => void;
  setQuickCaptureOpen: (value: boolean | ((previous: boolean) => boolean)) => void;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setIsTimelinePlaying: (value: boolean | ((previous: boolean) => boolean)) => void;
};

export const useWallPrivateNotes = ({
  renderSnapshotNotes,
  isTimeLocked,
  timelineViewActive,
  camera,
  viewport,
  occupiedNoteRects,
  setEditing,
  setEditTagInput,
  setEditTagRenameFrom,
  setSelectedNoteIds,
  setQuickCaptureOpen,
  setSearchOpen,
  setExportOpen,
  setIsTimelinePlaying,
}: UseWallPrivateNotesOptions) => {
  const [privateSessions, setPrivateSessions] = useState<Record<string, PrivateSession>>({});
  const privateSessionsRef = useRef<Record<string, PrivateSession>>({});
  const [privateModal, setPrivateModal] = useState<PrivateModalState>({ open: false, mode: "unlock" });

  useEffect(() => {
    privateSessionsRef.current = privateSessions;
  }, [privateSessions]);

  const placeNewNote = useCallback(
    (preferredCenter: { x: number; y: number }, size = { w: NOTE_DEFAULTS.width, h: NOTE_DEFAULTS.height }) =>
      findOpenNotePosition({
        camera,
        viewport,
        occupiedRects: occupiedNoteRects,
        preferred: {
          x: preferredCenter.x - size.w / 2,
          y: preferredCenter.y - size.h / 2,
        },
        size,
      }),
    [camera, viewport],
  );

  const setPrivateSession = useCallback((noteId: string, next: PrivateSession) => {
    setPrivateSessions((previous) => ({ ...previous, [noteId]: next }));
  }, []);

  const clearPrivateSession = useCallback((noteId: string) => {
    setPrivateSessions((previous) => {
      if (!(noteId in previous)) {
        return previous;
      }
      const next = { ...previous };
      delete next[noteId];
      return next;
    });
  }, []);

  const lockPrivateNote = useCallback(
    (noteId: string) => {
      clearPrivateSession(noteId);
      setEditing((current) => (current?.id === noteId ? null : current));
    },
    [clearPrivateSession, setEditing],
  );

  const lockAllPrivateNotes = useCallback(() => {
    setPrivateSessions({});
    setEditing((current) => (current && isPrivateNote(renderSnapshotNotes[current.id] ?? null) ? null : current));
  }, [renderSnapshotNotes, setEditing]);

  const openPrivateModal = useCallback(
    (mode: "protect" | "unlock", noteId: string, options?: { focusField?: string; reopenEditor?: boolean; error?: string }) => {
      setPrivateModal({
        open: true,
        mode,
        noteId,
        focusField: options?.focusField,
        reopenEditor: options?.reopenEditor,
        error: options?.error,
      });
    },
    [],
  );

  const closePrivateModal = useCallback(() => {
    setPrivateModal({ open: false, mode: "unlock" });
  }, []);

  useEffect(() => {
    if (!timelineViewActive) {
      return;
    }
    lockAllPrivateNotes();
    setEditing(null);
    setQuickCaptureOpen(false);
    setSearchOpen(false);
    setExportOpen(false);
    setIsTimelinePlaying(false);
  }, [lockAllPrivateNotes, setEditing, setExportOpen, setIsTimelinePlaying, setQuickCaptureOpen, setSearchOpen, timelineViewActive]);

  const syncWikiLinksForNote = useCallback(
    (sourceNoteId: string, text: string) => {
      const existingSource = useWallStore.getState().notes[sourceNoteId];
      if (!existingSource) {
        return;
      }

      const desiredTitles = [
        ...new Map(
          extractWikiLinks(text)
            .map((match) => [normalizeWikiTitle(match.title), match.title.trim()] as const)
            .filter((entry) => Boolean(entry[0]) && Boolean(entry[1])),
        ).values(),
      ];

      const desiredTargets = new Map<string, string>();
      let createdCount = 0;

      for (const title of desiredTitles) {
        let target = findNoteByWikiTitle(useWallStore.getState().notes, title, sourceNoteId);
        if (!target) {
          const source = useWallStore.getState().notes[sourceNoteId];
          if (!source) {
            continue;
          }
          const position = placeNewNote({
            x: source.x + source.w + 96 + (createdCount % 2) * 28 + NOTE_DEFAULTS.width / 2,
            y: source.y + createdCount * 42 + NOTE_DEFAULTS.height / 2,
          });
          const createdId = createNote(position.x, position.y, source.color);
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
    },
    [placeNewNote, setSelectedNoteIds],
  );

  const commitEditedNoteText = useCallback(
    async (noteId: string, rawText: string) => {
      const current = renderSnapshotNotes[noteId];
      if (!current) {
        return;
      }
      const parsed = parseTaggedText(rawText);
      const mergedTags = [...new Set([...current.tags, ...parsed.tags])];
      const state = useWallStore.getState();
      if (isPrivateNote(current)) {
        const session = privateSessionsRef.current[noteId];
        if (!session) {
          return;
        }
        const hidden = {
          ...session.hidden,
          text: parsed.text,
          tags: mergedTags,
        };
        const encrypted = await encryptPrivateNote(session.password, hidden);
        state.beginHistoryGroup();
        try {
          state.patchNote(noteId, {
            ...createPrivateNoteShellPatch(current),
            privateNote: encrypted,
          });
          syncWikiLinksForNote(noteId, "");
          setPrivateSession(noteId, {
            ...session,
            hidden,
            lastActivityAt: Date.now(),
          });
        } finally {
          useWallStore.getState().endHistoryGroup();
        }
        return;
      }
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
    },
    [renderSnapshotNotes, setPrivateSession, syncWikiLinksForNote],
  );

  const openEditor = useCallback(
    (noteId: string, text: string, focusField?: string) => {
      const note = renderSnapshotNotes[noteId];
      if (!note) {
        return;
      }
      if (isPrivateNote(note)) {
        const session = privateSessionsRef.current[noteId];
        if (!session) {
          openPrivateModal("unlock", noteId, { focusField, reopenEditor: true });
          return;
        }
        setPrivateSession(noteId, {
          ...session,
          lastActivityAt: Date.now(),
        });
        if (!canInlineEditPrivateNote(session.hidden)) {
          return;
        }
        setEditTagInput("");
        setEditTagRenameFrom(null);
        setEditing({ id: noteId, text: session.hidden.text, focusField });
        return;
      }
      setEditTagInput("");
      setEditTagRenameFrom(null);
      setEditing({ id: noteId, text, focusField });
    },
    [openPrivateModal, renderSnapshotNotes, setEditTagInput, setEditTagRenameFrom, setEditing, setPrivateSession],
  );

  const handleEditorBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>, editing: EditingState | null) => {
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
      void commitEditedNoteText(editing.id, editing.text);
      setEditing(null);
    },
    [commitEditedNoteText, setEditing],
  );

  const submitPrivateModal = useCallback(
    async (password: string) => {
      const noteId = privateModal.noteId;
      if (!noteId) {
        closePrivateModal();
        return;
      }
      const note = renderSnapshotNotes[noteId];
      if (!note) {
        closePrivateModal();
        return;
      }
      try {
        if (privateModal.mode === "protect") {
          if (!canProtectNote(note)) {
            setPrivateModal((current) => ({ ...current, error: "This note cannot be protected right now." }));
            return;
          }
          const hidden = createPrivateNoteHiddenFields(note);
          const encrypted = await encryptPrivateNote(password, hidden);
          useWallStore.getState().patchNote(noteId, {
            ...createPrivateNoteShellPatch(note),
            privateNote: encrypted,
          });
          syncWikiLinksForNote(noteId, "");
          setPrivateSession(noteId, {
            password,
            hidden,
            lastActivityAt: Date.now(),
          });
          closePrivateModal();
          return;
        }
        if (!note.privateNote) {
          closePrivateModal();
          return;
        }
        const hidden = await decryptPrivateNote(password, note.privateNote);
        setPrivateSession(noteId, {
          password,
          hidden,
          lastActivityAt: Date.now(),
        });
        const reopenEditor = privateModal.reopenEditor && canInlineEditPrivateNote(hidden);
        const focusField = privateModal.focusField;
        closePrivateModal();
        if (reopenEditor) {
          setEditTagInput("");
          setEditTagRenameFrom(null);
          setEditing({ id: noteId, text: hidden.text, focusField });
        }
      } catch {
        setPrivateModal((current) => ({
          ...current,
          error: privateModal.mode === "protect" ? "Could not protect this note right now." : "Password did not unlock this note.",
        }));
      }
    },
    [closePrivateModal, privateModal, renderSnapshotNotes, setEditTagInput, setEditTagRenameFrom, setEditing, setPrivateSession, syncWikiLinksForNote],
  );

  useEffect(() => {
    if (isTimeLocked) {
      lockAllPrivateNotes();
    }
  }, [isTimeLocked, lockAllPrivateNotes]);

  useEffect(() => {
    const lockStaleNotes = () => {
      const now = Date.now();
      const staleIds = Object.entries(privateSessionsRef.current)
        .filter(([, session]) => now - session.lastActivityAt >= PRIVATE_NOTE_AUTO_LOCK_MS)
        .map(([noteId]) => noteId);
      if (staleIds.length === 0) {
        return;
      }
      setPrivateSessions((previous) => {
        const next = { ...previous };
        for (const noteId of staleIds) {
          delete next[noteId];
        }
        return next;
      });
      setEditing((current) => (current && staleIds.includes(current.id) ? null : current));
    };

    const timer = setInterval(lockStaleNotes, 30000);
    return () => clearInterval(timer);
  }, [setEditing]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lockAllPrivateNotes();
      }
    };
    const handleBeforeUnload = () => {
      lockAllPrivateNotes();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [lockAllPrivateNotes]);

  return {
    privateSessions,
    privateModal,
    privateModalNote: privateModal.noteId ? renderSnapshotNotes[privateModal.noteId] : undefined,
    openPrivateModal,
    closePrivateModal,
    lockPrivateNote,
    lockAllPrivateNotes,
    openEditor,
    commitEditedNoteText,
    handleEditorBlur,
    submitPrivateModal,
    syncWikiLinksForNote,
  };
};

export type { EditingState, PrivateModalState };
