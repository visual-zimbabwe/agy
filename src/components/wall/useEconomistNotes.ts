"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  defaultEconomistCoverPayload,
  ECONOMIST_NOTE_CACHE_KEY,
  formatEconomistNoteText,
  getEconomistNoteSourceId,
  isEconomistNote,
  type EconomistCoverPayload,
  type EconomistSourceId,
  shouldRefreshEconomistNote,
} from "@/features/wall/economist";
import { useWallStore } from "@/features/wall/store";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

const getEconomistCacheKey = (sourceId: EconomistSourceId) => `${ECONOMIST_NOTE_CACHE_KEY}:${sourceId}`;

const readEconomistCache = (sourceId: EconomistSourceId) => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = readStorageValue(getEconomistCacheKey(sourceId));
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
    writeStorageValue(getEconomistCacheKey(payload.sourceId), JSON.stringify(payload));
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
    tags: [payload.sourceId, "cover", "magazine"],
  });
};

export const useEconomistNotes = ({ hydrated, publishedReadOnly, loginKey }: { hydrated: boolean; publishedReadOnly: boolean; loginKey?: string }) => {
  const notesMap = useWallStore((state) => state.notes);
  const inFlightRef = useRef<Partial<Record<EconomistSourceId, Promise<EconomistCoverPayload>>>>({});

  const fetchEconomistCover = useCallback(async ({ sourceId = "economist", force = false }: { sourceId?: EconomistSourceId; force?: boolean } = {}) => {
    const cached = readEconomistCache(sourceId);
    if (cached && !force) {
      return cached;
    }

    const inFlight = inFlightRef.current[sourceId];
    if (inFlight) {
      return inFlight;
    }

    const task = (async () => {
      const params = new URLSearchParams({ source: sourceId });
      if (force) {
        params.set("refresh", "true");
      }
      const response = await fetch(`/api/economist-cover?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as Partial<EconomistCoverPayload> & { error?: string };
      if (!response.ok || !payload.imageUrl) {
        throw new Error(payload.error ?? `Magazine cover request failed with ${response.status}`);
      }

      const nextPayload = defaultEconomistCoverPayload({
        sourceId,
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
      delete inFlightRef.current[sourceId];
    });

    inFlightRef.current[sourceId] = task;
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
      const sourceId = getEconomistNoteSourceId(note) ?? "economist";
      const payload = await fetchEconomistCover({ sourceId, force: options?.force });
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

      const notesBySource = new Map<EconomistSourceId, typeof targetNotes>();
      for (const note of targetNotes) {
        const sourceId = getEconomistNoteSourceId(note) ?? "economist";
        const group = notesBySource.get(sourceId) ?? [];
        group.push(note);
        notesBySource.set(sourceId, group);
      }

      await Promise.allSettled(
        Array.from(notesBySource.entries()).map(async ([sourceId, groupedNotes]) => {
          const payload = await fetchEconomistCover({ sourceId, force });
          for (const note of groupedNotes) {
            applyEconomistPayload(note.id, payload);
          }
        }),
      );
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
