"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  defaultEconomistCoverPayload,
  ECONOMIST_NOTE_CACHE_KEY,
  formatEconomistNoteText,
  isEconomistNote,
  shouldRefreshEconomistNote,
  type EconomistCoverPayload,
} from "@/features/wall/economist";
import { useWallStore } from "@/features/wall/store";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

const readEconomistCache = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = readStorageValue(ECONOMIST_NOTE_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return defaultEconomistCoverPayload(JSON.parse(raw) as Partial<EconomistCoverPayload>);
  } catch {
    return null;
  }
};

const writeEconomistCache = (payload: EconomistCoverPayload) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    writeStorageValue(ECONOMIST_NOTE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures; live refresh still works.
  }
};

const getEconomistNotes = () => Object.values(useWallStore.getState().notes).filter(isEconomistNote);

const applyEconomistPayload = (noteId: string, payload: EconomistCoverPayload) => {
  useWallStore.getState().patchNote(noteId, {
    text: formatEconomistNoteText(payload),
    quoteAuthor: payload.sourceUrl,
    quoteSource: payload.displayDate || payload.displayLabel,
    imageUrl: payload.imageUrl,
  });
};

export const useEconomistNotes = ({ hydrated, publishedReadOnly, loginKey }: { hydrated: boolean; publishedReadOnly: boolean; loginKey?: string }) => {
  const notesMap = useWallStore((state) => state.notes);
  const inFlightRef = useRef<Promise<EconomistCoverPayload> | null>(null);

  const fetchEconomistCover = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    const cached = readEconomistCache();
    if (cached && !force) {
      return cached;
    }

    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const task = (async () => {
      const response = await fetch(`/api/economist-cover${force ? "?refresh=true" : ""}`, { cache: "no-store" });
      const payload = (await response.json()) as Partial<EconomistCoverPayload> & { error?: string };
      if (!response.ok || !payload.imageUrl) {
        throw new Error(payload.error ?? `Economist cover request failed with ${response.status}`);
      }

      const nextPayload = defaultEconomistCoverPayload({
        sourceName: payload.sourceName,
        displayDate: payload.displayDate,
        displayLabel: payload.displayLabel,
        imageUrl: payload.imageUrl,
        sourceUrl: payload.sourceUrl,
        fetchedAt: Date.now(),
      });
      writeEconomistCache(nextPayload);
      return nextPayload;
    })().finally(() => {
      inFlightRef.current = null;
    });

    inFlightRef.current = task;
    return task;
  }, []);

  const refreshEconomistNote = useCallback(
    async (noteId: string, options?: { force?: boolean }) => {
      if (publishedReadOnly) {
        return;
      }
      const note = useWallStore.getState().notes[noteId];
      if (!note || !isEconomistNote(note)) {
        return;
      }
      const payload = await fetchEconomistCover({ force: options?.force });
      applyEconomistPayload(noteId, payload);
    },
    [fetchEconomistCover, publishedReadOnly],
  );

  const refreshAllEconomistNotes = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (publishedReadOnly) {
        return;
      }

      const notes = getEconomistNotes();
      if (notes.length === 0) {
        return;
      }

      const targetNotes = force ? notes : notes.filter((note) => shouldRefreshEconomistNote(note));
      if (targetNotes.length === 0) {
        return;
      }

      try {
        const payload = await fetchEconomistCover({ force });
        for (const note of targetNotes) {
          applyEconomistPayload(note.id, payload);
        }
      } catch {
        // Keep last successful local state; manual refresh can retry.
      }
    },
    [fetchEconomistCover, publishedReadOnly],
  );

  useEffect(() => {
    if (!hydrated || publishedReadOnly) {
      return;
    }

    void refreshAllEconomistNotes({ force: false });
  }, [hydrated, notesMap, publishedReadOnly, refreshAllEconomistNotes]);

  useEffect(() => {
    if (!hydrated || publishedReadOnly || !loginKey) {
      return;
    }

    void refreshAllEconomistNotes({ force: true });
  }, [hydrated, loginKey, publishedReadOnly, refreshAllEconomistNotes]);

  return {
    refreshEconomistNote,
  };
};
