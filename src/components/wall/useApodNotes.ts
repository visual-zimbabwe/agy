"use client";

import { useCallback, useEffect, useRef } from "react";

import { APOD_NOTE_CACHE_KEY, APOD_NOTE_REFRESH_INTERVAL_MS, defaultApodNoteState, getApodDateKey, isApodNote, shouldRefreshApod } from "@/features/wall/apod";
import { useWallStore } from "@/features/wall/store";
import type { ApodNote } from "@/features/wall/types";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

type ApodCache = Record<string, ApodNote>;

const readApodCache = (): ApodCache => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = readStorageValue(APOD_NOTE_CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as ApodCache) : {};
  } catch {
    return {};
  }
};

const writeApodCache = (cache: ApodCache) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    writeStorageValue(APOD_NOTE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage failures; live fetches still work.
  }
};

const getApodNote = (noteId: string) => {
  const note = useWallStore.getState().notes[noteId];
  return note && isApodNote(note) ? note : undefined;
};

export const useApodNotes = ({ hydrated, publishedReadOnly }: { hydrated: boolean; publishedReadOnly: boolean }) => {
  const notesMap = useWallStore((state) => state.notes);
  const inFlightRef = useRef<Record<string, Promise<void>>>({});

  const refreshApodNote = useCallback(
    async (noteId: string, options?: { force?: boolean }) => {
      if (publishedReadOnly) {
        return;
      }

      const existing = getApodNote(noteId);
      if (!existing) {
        return;
      }

      if (inFlightRef.current[noteId]) {
        return inFlightRef.current[noteId];
      }

      const targetDate = getApodDateKey();
      const cache = readApodCache();
      const cached = cache[targetDate];
      if (cached && !options?.force) {
        useWallStore.getState().patchNote(noteId, {
          apod: defaultApodNoteState({ ...cached, status: "ready", error: undefined }),
          imageUrl: cached.imageUrl ?? cached.fallbackImageUrl,
        });
        return;
      }

      useWallStore.getState().patchNote(noteId, {
        apod: defaultApodNoteState({ ...existing.apod, status: "loading", error: undefined }),
      });

      const task = (async () => {
        try {
          const response = await fetch(`/api/apod?date=${encodeURIComponent(targetDate)}`, { cache: "no-store" });
          const payload = (await response.json()) as Partial<ApodNote> & { error?: string };
          if (!response.ok) {
            throw new Error(payload.error ?? `APOD request failed with ${response.status}`);
          }

          const now = Date.now();
          const nextApod = defaultApodNoteState({
            ...payload,
            status: "ready",
            fetchedAt: now,
            lastSuccessAt: now,
            error: undefined,
          });

          cache[targetDate] = nextApod;
          writeApodCache(cache);

          useWallStore.getState().patchNote(noteId, {
            apod: nextApod,
            imageUrl: nextApod.imageUrl ?? nextApod.fallbackImageUrl,
          });
        } catch (error) {
          const latest = getApodNote(noteId);
          if (!latest) {
            return;
          }
          useWallStore.getState().patchNote(noteId, {
            apod: defaultApodNoteState({
              ...latest.apod,
              status: latest.apod?.lastSuccessAt ? "ready" : "error",
              error: error instanceof Error ? error.message : "APOD refresh failed",
              fetchedAt: Date.now(),
            }),
          });
        } finally {
          delete inFlightRef.current[noteId];
        }
      })();

      inFlightRef.current[noteId] = task;
      return task;
    },
    [publishedReadOnly],
  );

  const refreshAllApodNotes = useCallback(() => {
    const notes = Object.values(useWallStore.getState().notes).filter(isApodNote);
    for (const note of notes) {
      if (shouldRefreshApod(note.apod)) {
        void refreshApodNote(note.id);
      }
    }
  }, [refreshApodNote]);

  useEffect(() => {
    if (!hydrated || publishedReadOnly) {
      return;
    }

    const timer = window.setTimeout(() => {
      refreshAllApodNotes();
    }, 350);

    const interval = window.setInterval(() => {
      refreshAllApodNotes();
    }, APOD_NOTE_REFRESH_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAllApodNotes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hydrated, publishedReadOnly, refreshAllApodNotes, notesMap]);

  const downloadApodImage = useCallback((noteId: string) => {
    const note = getApodNote(noteId);
    const apod = note?.apod;
    const mediaUrl = apod?.imageUrl ?? apod?.fallbackImageUrl;
    if (!mediaUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = `/api/apod/download?url=${encodeURIComponent(mediaUrl)}&date=${encodeURIComponent(apod?.date || getApodDateKey())}&title=${encodeURIComponent(apod?.title || "apod")}`;
    link.download = "apod";
    link.click();
  }, []);

  return {
    refreshApodNote,
    downloadApodImage,
  };
};
