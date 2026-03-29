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
import type { Note } from "@/features/wall/types";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

const getEconomistCacheKey = (sourceId: EconomistSourceId) => `${ECONOMIST_NOTE_CACHE_KEY}:${sourceId}`;
const getEconomistFailureKey = (sourceId: EconomistSourceId) => `${ECONOMIST_NOTE_CACHE_KEY}:${sourceId}:last-failure`;
const economistFailureBackoffMs = 30 * 60 * 1000;

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

const readEconomistFailureAt = (sourceId: EconomistSourceId) => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const raw = readStorageValue(getEconomistFailureKey(sourceId));
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const writeEconomistFailureAt = (sourceId: EconomistSourceId, timestamp?: number) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (timestamp) {
      writeStorageValue(getEconomistFailureKey(sourceId), String(timestamp));
      return;
    }
    window.localStorage.removeItem(getEconomistFailureKey(sourceId));
  } catch {
    // Ignore failure bookkeeping issues; cover refresh can still proceed.
  }
};

const writeEconomistCache = (payload: EconomistCoverPayload) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    writeStorageValue(getEconomistCacheKey(payload.sourceId), JSON.stringify(payload));
    writeEconomistFailureAt(payload.sourceId, undefined);
  } catch {
    // Ignore cache write failures; live refresh still works.
  }
};

const getEconomistNotes = () => Object.values(useWallStore.getState().notes).filter(isEconomistNote);
const applyEconomistPayload = (noteId: string, payload: EconomistCoverPayload) => {
  useWallStore.getState().patchNote(noteId, {
    text: formatEconomistNoteText(payload),
    quoteAuthor: payload.sourceUrl,
    quoteSource: payload.displayDate || undefined,
    imageUrl: payload.imageUrl,
    tags: [payload.sourceId, "cover", "magazine"],
    economist: {
      status: "ready",
      year: payload.year,
      sourceId: payload.sourceId,
      sourceUrl: payload.sourceUrl,
      coverUrl: payload.imageUrl,
      issueDate: payload.displayDate,
      mainStory: payload.mainStory,
      fetchedAt: payload.fetchedAt,
      lastSuccessAt: Date.now(),
    },
  });
};

export const useEconomistNotes = ({ hydrated, publishedReadOnly, loginKey }: { hydrated: boolean; publishedReadOnly: boolean; loginKey?: string }) => {
  const notesMap = useWallStore((state) => state.notes);
  const inFlightRef = useRef<Partial<Record<EconomistSourceId, Promise<EconomistCoverPayload>>>>({});

  const fetchEconomistCover = useCallback(async ({ sourceId = "economist", force = false, year }: { sourceId?: EconomistSourceId; force?: boolean; year?: string } = {}) => {
    const cached = readEconomistCache(sourceId);
    if (cached && !force && !year) {
      return cached;
    }

    const lastFailureAt = readEconomistFailureAt(sourceId);
    if (
      sourceId === "economist" &&
      cached &&
      !year &&
      lastFailureAt &&
      Date.now() - lastFailureAt < economistFailureBackoffMs
    ) {
      return cached;
    }

    const inFlight = inFlightRef.current[sourceId];
    if (inFlight && !year) {
      return inFlight;
    }

    const task = (async () => {
      const params = new URLSearchParams({ source: sourceId });
      if (force) {
        params.set("refresh", "true");
      }
      if (year) {
        params.set("year", year);
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
        mainStory: payload.mainStory,
        imageUrl: payload.imageUrl,
        sourceUrl: payload.sourceUrl,
        fetchedAt: Date.now(),
        year: payload.year,
        items: payload.items,
      });
      if (!year) {
        writeEconomistCache(nextPayload);
      }
      return nextPayload;
    })()
      .catch((error) => {
        if (!year) {
          writeEconomistFailureAt(sourceId, Date.now());
        }
        if (cached) {
          return cached;
        }
        throw error;
      })
      .finally(() => {
        delete inFlightRef.current[sourceId];
      });

    if (!year) {
      inFlightRef.current[sourceId] = task;
    }
    return task;
  }, []);

  const refreshEconomistNote = useCallback(
    async (noteId: string, options?: { force?: boolean; year?: string }) => {
      if (publishedReadOnly) {
        return;
      }
      const note = useWallStore.getState().notes[noteId];
      if (!note || !isEconomistNote(note)) {
        return;
      }
      const sourceId = getEconomistNoteSourceId(note) ?? "economist";
      const payload = await fetchEconomistCover({ sourceId, force: options?.force, year: options?.year });

      const { items, ...mainPayload } = payload;
      applyEconomistPayload(noteId, mainPayload);

      if (items && items.length > 0) {
        const { beginHistoryGroup, endHistoryGroup } = useWallStore.getState();
        const existingNotes = getEconomistNotes().filter((n) => getEconomistNoteSourceId(n) === sourceId);

        beginHistoryGroup();
        try {
          const distinctItems = items.filter((item) => item.imageUrl && item.imageUrl !== mainPayload.imageUrl);
          distinctItems.forEach((item: EconomistCoverPayload) => {
            if (existingNotes.some((n) => n.imageUrl === item.imageUrl)) {
              return;
            }
          });
        } finally {
          endHistoryGroup();
        }
      }
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

      const targetNotes = force ? notes : notes.filter((note: Note) => shouldRefreshEconomistNote(note));
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
          const { items, ...mainPayload } = payload;

          const distinctCovers = [mainPayload];
          if (items) {
            for (const item of items) {
              if (item.imageUrl && !distinctCovers.some((c) => c.imageUrl === item.imageUrl)) {
                distinctCovers.push(item);
              }
            }
          }

          const sortedNotes = [...groupedNotes].sort((a, b) => a.createdAt - b.createdAt);
          for (let i = 0; i < sortedNotes.length; i++) {
            const note = sortedNotes[i];
            const cover = distinctCovers[i % distinctCovers.length];
            applyEconomistPayload(note!.id, cover!);
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
