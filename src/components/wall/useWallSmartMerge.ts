"use client";

import { useCallback, useMemo } from "react";

import { mergeNotes } from "@/features/wall/commands";
import type { Note } from "@/features/wall/types";
import { computeContentBounds } from "@/lib/wall-utils";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";

type UseWallSmartMergeOptions = {
  isTimeLocked: boolean;
  renderSnapshotNotes: Record<string, Note>;
  smartMergeSuggestions: SmartMergeSuggestion[];
  syncPrimarySelection: (noteIds: string[]) => void;
  selectNote: (noteId?: string) => void;
  focusBounds: (bounds: { x: number; y: number; w: number; h: number }) => void;
};

export const useWallSmartMerge = ({
  isTimeLocked,
  renderSnapshotNotes,
  smartMergeSuggestions,
  syncPrimarySelection,
  selectNote,
  focusBounds,
}: UseWallSmartMergeOptions) => {
  const smartMergeItems = useMemo(
    () =>
      smartMergeSuggestions
        .map((suggestion) => {
          const keepNote = renderSnapshotNotes[suggestion.keepNoteId];
          const mergeNote = renderSnapshotNotes[suggestion.mergeNoteId];
          if (!keepNote || !mergeNote) {
            return null;
          }
          return {
            ...suggestion,
            keepNoteText: keepNote.text,
            mergeNoteText: mergeNote.text,
          };
        })
        .filter((item): item is SmartMergeSuggestion & { keepNoteText: string; mergeNoteText: string } => Boolean(item)),
    [renderSnapshotNotes, smartMergeSuggestions],
  );

  const previewSmartMerge = useCallback(
    (suggestion: SmartMergeSuggestion) => {
      const keepNote = renderSnapshotNotes[suggestion.keepNoteId];
      const mergeNote = renderSnapshotNotes[suggestion.mergeNoteId];
      if (!keepNote || !mergeNote) {
        return;
      }
      syncPrimarySelection([keepNote.id, mergeNote.id]);
      selectNote(keepNote.id);
      const bounds = computeContentBounds([keepNote, mergeNote], []);
      if (bounds) {
        focusBounds(bounds);
      }
    },
    [focusBounds, renderSnapshotNotes, selectNote, syncPrimarySelection],
  );

  const applySmartMerge = useCallback(
    (suggestion: SmartMergeSuggestion) => {
      if (isTimeLocked) {
        return;
      }
      const keepNote = renderSnapshotNotes[suggestion.keepNoteId];
      const mergeNote = renderSnapshotNotes[suggestion.mergeNoteId];
      if (!keepNote || !mergeNote) {
        return;
      }
      const ok = window.confirm("Merge these notes? The second note will be removed.");
      if (!ok) {
        return;
      }
      mergeNotes(suggestion.keepNoteId, suggestion.mergeNoteId);
      syncPrimarySelection([suggestion.keepNoteId]);
    },
    [isTimeLocked, renderSnapshotNotes, syncPrimarySelection],
  );

  return {
    smartMergeItems,
    previewSmartMerge,
    applySmartMerge,
  };
};
