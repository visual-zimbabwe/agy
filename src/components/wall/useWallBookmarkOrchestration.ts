"use client";

import { useCallback, useEffect, useRef } from "react";

import { updateNote } from "@/features/wall/commands";
import {
  createBookmarkNoteState,
  getBookmarkPreferredSize,
  isBookmarkCacheFresh,
  isBookmarkMetadataRich,
  readBookmarkCacheEntry,
  shouldAutoResizeBookmarkNote,
  writeBookmarkCacheEntry,
} from "@/features/wall/bookmarks";
import { useWallStore } from "@/features/wall/store";
import type { Note, WebBookmarkMetadata } from "@/features/wall/types";

type UseWallBookmarkOrchestrationOptions = {
  isTimeLocked: boolean;
  hydrated: boolean;
  publishedReadOnly: boolean;
  notesMap: Record<string, Note>;
  renderSnapshotNotes: Record<string, Note>;
};

export const useWallBookmarkOrchestration = ({
  isTimeLocked,
  hydrated,
  publishedReadOnly,
  notesMap,
  renderSnapshotNotes,
}: UseWallBookmarkOrchestrationOptions) => {
  const bookmarkUpgradeRequestsRef = useRef<Record<string, string>>({});

  const fetchBookmarkPreview = useCallback(
    async (noteId: string, rawUrl: string, options?: { force?: boolean }) => {
      if (isTimeLocked) {
        return;
      }
      const normalizedUrl = createBookmarkNoteState(rawUrl).normalizedUrl;
      if (!normalizedUrl) {
        updateNote(noteId, {
          bookmark: {
            ...(renderSnapshotNotes[noteId]?.bookmark ?? createBookmarkNoteState(rawUrl)),
            url: rawUrl,
            normalizedUrl: "",
            metadata: undefined,
            status: "error",
            fetchedAt: Date.now(),
            error: "Enter a valid http(s) URL.",
          },
        });
        return;
      }

      const cached = readBookmarkCacheEntry(normalizedUrl);
      if (!options?.force && cached?.metadata && isBookmarkCacheFresh(cached) && isBookmarkMetadataRich(cached.metadata)) {
        updateNote(noteId, {
          bookmark: {
            url: rawUrl,
            normalizedUrl,
            metadata: cached.metadata,
            status: "ready",
            fetchedAt: cached.fetchedAt,
            lastSuccessAt: cached.lastSuccessAt ?? cached.fetchedAt,
            error: undefined,
          },
        });
        return;
      }

      updateNote(noteId, {
        bookmark: {
          url: rawUrl,
          normalizedUrl,
          metadata: cached?.metadata ?? renderSnapshotNotes[noteId]?.bookmark?.metadata,
          status: "loading",
          fetchedAt: Date.now(),
          lastSuccessAt: renderSnapshotNotes[noteId]?.bookmark?.lastSuccessAt,
          error: undefined,
        },
      });

      try {
        const response = await fetch(`/api/bookmarks/preview?url=${encodeURIComponent(normalizedUrl)}`);
        const payload = (await response.json()) as {
          error?: string;
          normalizedUrl?: string;
          metadata?: WebBookmarkMetadata;
        };
        if (!response.ok || !payload.metadata || !payload.normalizedUrl) {
          throw new Error(payload.error || "Preview request failed.");
        }
        const fetchedAt = Date.now();
        writeBookmarkCacheEntry(payload.normalizedUrl, {
          metadata: payload.metadata,
          fetchedAt,
          lastSuccessAt: fetchedAt,
        });
        const currentNote = useWallStore.getState().notes[noteId];
        const preferredSize = getBookmarkPreferredSize(payload.metadata);
        updateNote(noteId, {
          ...(currentNote && shouldAutoResizeBookmarkNote(currentNote)
            ? {
                w: preferredSize.w,
                h: preferredSize.h,
              }
            : {}),
          bookmark: {
            url: rawUrl,
            normalizedUrl: payload.normalizedUrl,
            metadata: payload.metadata,
            status: "ready",
            fetchedAt,
            lastSuccessAt: fetchedAt,
            error: undefined,
          },
        });
      } catch (error) {
        updateNote(noteId, {
          bookmark: {
            url: rawUrl,
            normalizedUrl,
            metadata: cached?.metadata ?? renderSnapshotNotes[noteId]?.bookmark?.metadata,
            status: "error",
            fetchedAt: Date.now(),
            lastSuccessAt: cached?.lastSuccessAt ?? renderSnapshotNotes[noteId]?.bookmark?.lastSuccessAt,
            error: error instanceof Error ? error.message : "Preview request failed.",
          },
        });
      }
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  useEffect(() => {
    if (!hydrated || isTimeLocked || publishedReadOnly) {
      return;
    }

    for (const note of Object.values(notesMap)) {
      if (note.noteKind !== "web-bookmark") {
        continue;
      }
      const normalizedUrl = note.bookmark?.normalizedUrl;
      if (!normalizedUrl || note.bookmark?.status === "loading" || isBookmarkMetadataRich(note.bookmark?.metadata)) {
        continue;
      }
      if (bookmarkUpgradeRequestsRef.current[note.id] === normalizedUrl) {
        continue;
      }
      bookmarkUpgradeRequestsRef.current[note.id] = normalizedUrl;
      void fetchBookmarkPreview(note.id, normalizedUrl, { force: true });
    }
  }, [fetchBookmarkPreview, hydrated, isTimeLocked, notesMap, publishedReadOnly]);

  const openBookmarkUrl = useCallback((url: string) => {
    const target = url.trim();
    if (!target || typeof window === "undefined") {
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }, []);

  return {
    fetchBookmarkPreview,
    openBookmarkUrl,
  };
};
