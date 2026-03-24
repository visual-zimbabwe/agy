"use client";

import { useCallback, useEffect } from "react";

import { refreshThroneNote } from "@/features/wall/commands";
import { isThroneNote, shouldRefreshThroneNote } from "@/features/wall/throne";
import { useWallStore } from "@/features/wall/store";

export const useThroneNotes = ({ hydrated, publishedReadOnly, loginKey }: { hydrated: boolean; publishedReadOnly: boolean; loginKey?: string }) => {
  const notesMap = useWallStore((state) => state.notes);

  const refreshAllThroneNotes = useCallback(
    ({ force = false }: { force?: boolean } = {}) => {
      if (publishedReadOnly) {
        return;
      }

      const notes = Object.values(useWallStore.getState().notes).filter(isThroneNote);
      for (const note of notes) {
        if (force || shouldRefreshThroneNote(note)) {
          refreshThroneNote(note.id);
        }
      }
    },
    [publishedReadOnly],
  );

  useEffect(() => {
    if (!hydrated || publishedReadOnly) {
      return;
    }

    const timer = window.setTimeout(() => {
      refreshAllThroneNotes();
    }, 550);

    const interval = window.setInterval(() => {
      refreshAllThroneNotes();
    }, 60 * 60 * 1000); // Check every hour

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAllThroneNotes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hydrated, notesMap, publishedReadOnly, refreshAllThroneNotes]);

  useEffect(() => {
    if (!hydrated || publishedReadOnly || !loginKey) {
      return;
    }

    void refreshAllThroneNotes({ force: true });
  }, [hydrated, loginKey, publishedReadOnly, refreshAllThroneNotes]);

  return {
    refreshAllThroneNotes,
  };
};
