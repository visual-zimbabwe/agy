"use client";

import { useCallback, useEffect, useRef } from "react";
import jsPDF from "jspdf";

import {
  buildPoetryCacheKey,  defaultPoetryNoteState,
  formatPoetryNoteText,
  getPoetryDateKey,
  getPoetryExportBaseName,
  getPoetryNoteDimensions,
  getPoetryTitle,
  isPoetryNote,
  normalizePoetryMatchType,
  normalizePoetrySearchField,
  normalizePoetrySearchQuery,
  POETRY_NOTE_CACHE_KEY,
  POETRY_NOTE_REFRESH_INTERVAL_MS,
  POETRY_NOTE_SOURCE,
  poetryLoadingText,
  shouldRefreshPoetry,
} from "@/features/wall/poetry";
import { useWallStore } from "@/features/wall/store";
import type { Note, PoetryNote, PoetrySearchField, PoetrySearchMatchType } from "@/features/wall/types";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

type PoetryCache = Record<string, PoetryNote>;

type PoetryApiPayload = {
  title?: string;
  author?: string;
  lines?: string[];
  lineCount?: number;
  sourceUrl?: string;
  searchField?: PoetrySearchField;
  searchQuery?: string;
  matchType?: PoetrySearchMatchType;
  error?: string;
};

type RefreshPoetryOptions = {
  force?: boolean;
  field?: PoetrySearchField;
  query?: string;
  matchType?: PoetrySearchMatchType;
};

const readPoetryCache = (): PoetryCache => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = readStorageValue(POETRY_NOTE_CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as PoetryCache) : {};
  } catch {
    return {};
  }
};

const writePoetryCache = (cache: PoetryCache) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    writeStorageValue(POETRY_NOTE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage failures; live fetches still work.
  }
};

const getPoetryNote = (noteId: string) => {
  const note = useWallStore.getState().notes[noteId];
  return note && isPoetryNote(note) ? note : undefined;
};

const wrapCanvasText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const paragraphs = text.split("\n");
  const wrapped: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      wrapped.push("");
      continue;
    }
    const words = trimmed.split(/\s+/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width <= maxWidth) {
        line = next;
      } else if (line) {
        wrapped.push(line);
        line = word;
      } else {
        wrapped.push(word);
        line = "";
      }
    }
    if (line) {
      wrapped.push(line);
    }
  }

  return wrapped;
};

const renderPoetryCanvas = (note: Note & { noteKind: "poetry" }) => {
  const poetry = note.poetry;
  const width = Math.max(640, Math.round(note.w * 2));
  const height = Math.max(720, Math.round(note.h * 2));
  const padding = 48;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.fillStyle = note.color;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(255,248,238,0.12)";
  context.fillRect(padding, padding, width - padding * 2, height - padding * 2);

  let cursorY = padding + 52;
  const innerWidth = width - padding * 2 - 36;

  context.fillStyle = note.textColor ?? "#FFF8EE";
  context.font = "600 42px Georgia";
  for (const line of wrapCanvasText(context, poetry?.title?.trim() || getPoetryTitle(note), innerWidth)) {
    context.fillText(line, padding + 18, cursorY);
    cursorY += 50;
  }

  cursorY += 8;
  context.font = "600 24px Georgia";
  context.fillStyle = "rgba(255,248,238,0.9)";
  const authorLine = poetry?.author?.trim() || note.quoteAuthor?.trim() || "Unknown Poet";
  context.fillText(`by ${authorLine}`, padding + 18, cursorY);
  cursorY += 36;

  context.font = "500 18px Georgia";
  context.fillStyle = "rgba(255,248,238,0.76)";
  context.fillText(`Source: ${POETRY_NOTE_SOURCE}`, padding + 18, cursorY);
  cursorY += 42;

  context.font = "400 25px Georgia";
  context.fillStyle = note.textColor ?? "#FFF8EE";
  const lines = poetry?.lines?.length ? poetry.lines : note.text.split("\n");
  for (const line of lines) {
    for (const wrapped of wrapCanvasText(context, line, innerWidth)) {
      context.fillText(wrapped || " ", padding + 18, cursorY);
      cursorY += 34;
    }
    cursorY += 10;
  }

  return canvas;
};

export const usePoetryNotes = ({ hydrated, publishedReadOnly }: { hydrated: boolean; publishedReadOnly: boolean }) => {
  const notesMap = useWallStore((state) => state.notes);
  const inFlightRef = useRef<Record<string, Promise<void>>>({});

  const applyPoetryPayload = useCallback((noteId: string, poetry: PoetryNote) => {
    const current = getPoetryNote(noteId);
    if (!current) {
      return;
    }
    const dimensions = getPoetryNoteDimensions(poetry);
    useWallStore.getState().patchNote(noteId, {
      poetry,
      text: formatPoetryNoteText(poetry),
      quoteAuthor: poetry.author ?? current.quoteAuthor ?? "",
      quoteSource: POETRY_NOTE_SOURCE,
      w: dimensions.width,
      h: dimensions.height,
    });
  }, []);

  const refreshPoetryNote = useCallback(
    async (noteId: string, options?: RefreshPoetryOptions) => {
      if (publishedReadOnly) {
        return;
      }

      const existing = getPoetryNote(noteId);
      if (!existing) {
        return;
      }

      if (inFlightRef.current[noteId]) {
        return inFlightRef.current[noteId];
      }

      const searchField = normalizePoetrySearchField(options?.field ?? existing.poetry?.searchField);
      const searchQuery = normalizePoetrySearchQuery(options?.query ?? existing.poetry?.searchQuery);
      const matchType = normalizePoetryMatchType(options?.matchType ?? existing.poetry?.matchType);
      const targetDate = getPoetryDateKey();
      const cacheKey = buildPoetryCacheKey({
        dateKey: targetDate,
        searchField,
        searchQuery,
        matchType,
      });
      const cache = readPoetryCache();
      const cached = cache[cacheKey] ?? (searchField === "random" ? cache[targetDate] : undefined);
      if (cached && !options?.force) {
        applyPoetryPayload(
          noteId,
          defaultPoetryNoteState({
            ...cached,
            status: "ready",
            error: undefined,
            searchField,
            searchQuery: searchField === "random" ? "" : searchQuery,
            matchType,
          }),
        );
        return;
      }

      if (searchField !== "random" && !searchQuery) {
        useWallStore.getState().patchNote(noteId, {
          poetry: defaultPoetryNoteState({
            ...existing.poetry,
            status: existing.poetry?.lastSuccessAt ? "ready" : "error",
            searchField,
            searchQuery,
            matchType,
            error: `Enter a ${searchField} search before fetching poetry.`,
          }),
        });
        return;
      }

      useWallStore.getState().patchNote(noteId, {
        text: poetryLoadingText,
        quoteSource: POETRY_NOTE_SOURCE,
        poetry: defaultPoetryNoteState({
          ...existing.poetry,
          status: "loading",
          error: undefined,
          searchField,
          searchQuery: searchField === "random" ? "" : searchQuery,
          matchType,
        }),
      });

      const task = (async () => {
        try {
          const params = new URLSearchParams();
          params.set("field", searchField);
          if (searchField !== "random") {
            params.set("query", searchQuery);
            params.set("match", matchType);
          }
          const response = await fetch(`/api/poetry?${params.toString()}`, { cache: "no-store" });
          const payload = (await response.json()) as PoetryApiPayload;
          if (!response.ok) {
            throw new Error(payload.error ?? `Poetry request failed with ${response.status}`);
          }

          const now = Date.now();
          const nextPoetry = defaultPoetryNoteState({
            status: "ready",
            dateKey: targetDate,
            title: payload.title,
            author: payload.author,
            lines: payload.lines ?? [],
            lineCount: payload.lineCount ?? payload.lines?.length ?? 0,
            sourceUrl: payload.sourceUrl,
            searchField: payload.searchField ?? searchField,
            searchQuery: payload.searchField === "random" ? "" : payload.searchQuery ?? searchQuery,
            matchType: payload.matchType ?? matchType,
            fetchedAt: now,
            lastSuccessAt: now,
            error: undefined,
          });

          cache[cacheKey] = nextPoetry;
          writePoetryCache(cache);
          applyPoetryPayload(noteId, nextPoetry);
        } catch (error) {
          const latest = getPoetryNote(noteId);
          if (!latest) {
            return;
          }
          useWallStore.getState().patchNote(noteId, {
            text: latest.poetry?.lines?.length ? formatPoetryNoteText(latest.poetry) : latest.text || poetryLoadingText,
            poetry: defaultPoetryNoteState({
              ...latest.poetry,
              status: latest.poetry?.lastSuccessAt ? "ready" : "error",
              searchField,
              searchQuery: searchField === "random" ? "" : searchQuery,
              matchType,
              error: error instanceof Error ? error.message : "Poetry refresh failed",
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
    [applyPoetryPayload, publishedReadOnly],
  );

  const refreshAllPoetryNotes = useCallback(() => {
    const notes = Object.values(useWallStore.getState().notes).filter(isPoetryNote);
    for (const note of notes) {
      if (shouldRefreshPoetry(note.poetry)) {
        void refreshPoetryNote(note.id);
      }
    }
  }, [refreshPoetryNote]);

  useEffect(() => {
    if (!hydrated || publishedReadOnly) {
      return;
    }

    const timer = window.setTimeout(() => {
      refreshAllPoetryNotes();
    }, 350);

    const interval = window.setInterval(() => {
      refreshAllPoetryNotes();
    }, POETRY_NOTE_REFRESH_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAllPoetryNotes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hydrated, notesMap, publishedReadOnly, refreshAllPoetryNotes]);

  const downloadPoetryAsImage = useCallback((noteId: string) => {
    const note = getPoetryNote(noteId);
    if (!note) {
      return;
    }
    const canvas = renderPoetryCanvas(note);
    if (!canvas) {
      return;
    }
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${getPoetryExportBaseName(note.poetry)}.png`;
    link.click();
  }, []);

  const downloadPoetryAsPdf = useCallback((noteId: string) => {
    const note = getPoetryNote(noteId);
    if (!note) {
      return;
    }
    const canvas = renderPoetryCanvas(note);
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "pt",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${getPoetryExportBaseName(note.poetry)}.pdf`);
  }, []);

  return {
    refreshPoetryNote,
    downloadPoetryAsImage,
    downloadPoetryAsPdf,
  };
};
