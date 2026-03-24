"use client";

import { useCallback, useEffect } from "react";

import { refreshJokerNote } from "@/features/wall/commands";
import { isJokerNote, shouldRefreshJokerNote } from "@/features/wall/joker";
import { useWallStore } from "@/features/wall/store";

export const useJokerNotes = ({ hydrated, publishedReadOnly, loginKey }: { hydrated: boolean; publishedReadOnly: boolean; loginKey?: string }) => {
  const notesMap = useWallStore((state) => state.notes);

  const refreshAllJokerNotes = useCallback(
    ({ force = false }: { force?: boolean } = {}) => {
      if (publishedReadOnly) {
        return;
      }

      const notes = Object.values(useWallStore.getState().notes).filter(isJokerNote);
      for (const note of notes) {
        if (force || shouldRefreshJokerNote(note)) {
          refreshJokerNote(note.id);
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
      refreshAllJokerNotes();
    }, 450);

    const interval = window.setInterval(() => {
      refreshAllJokerNotes();
    }, 60 * 60 * 1000); // Check every hour

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAllJokerNotes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hydrated, notesMap, publishedReadOnly, refreshAllJokerNotes]);

  useEffect(() => {
    if (!hydrated || publishedReadOnly || !loginKey) {
      return;
    }

    void refreshAllJokerNotes({ force: true });
  }, [hydrated, loginKey, publishedReadOnly, refreshAllJokerNotes]);

  return {
    refreshAllJokerNotes,
  };
};
