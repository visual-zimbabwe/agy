"use client";

import { useCallback, useEffect, useRef } from "react";
import jsPDF from "jspdf";

import {
  buildPoetryCacheKey,  defaultPoetryNoteState,
  formatPoetryNoteText,
  getPoetryDateKey,
  getPoetryExportBaseName,
  getPoetryNoteDimensions,
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

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
  } else {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
  }
  context.closePath();
};

const renderPoetryCanvas = (note: Note & { noteKind: "poetry" }) => {
  const poetry = note.poetry;
  const width = Math.max(640, Math.round(note.w * 2));
  const height = Math.max(720, Math.round(note.h * 2));
  const padding = 28;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.fillStyle = "#FCF9F4";
  context.fillRect(0, 0, width, height);

  drawRoundedRect(context, padding, padding, width - padding * 2, height - padding * 2, 32);
  context.fillStyle = "#FFFDF9";
  context.fill();
  context.strokeStyle = "rgba(223,192,184,0.38)";
  context.lineWidth = 2;
  context.stroke();

  const innerX = padding + 36;
  const innerWidth = width - padding * 2 - 72;
  let cursorY = padding + 66;

  context.textAlign = "center";
  context.fillStyle = "rgba(139,113,106,0.5)";
  context.font = "600 17px Manrope";
  context.fillText("SOURCE: POETRY API", width / 2, cursorY);

  const authorLine = poetry?.author?.trim() || note.quoteAuthor?.trim() || "Unknown Poet";
  const footerTop = height - padding - 112;
  const bodyTop = cursorY + 36;
  const bodyBottom = footerTop - 28;
  const bodyHeight = Math.max(120, bodyBottom - bodyTop);
  const bodyLinesWrapped: string[] = [];
  const lines = poetry?.lines?.length ? poetry.lines : note.text.split("\n");
  for (const line of lines) {
    bodyLinesWrapped.push(...wrapCanvasText(context, line, innerWidth));
    bodyLinesWrapped.push("");
  }
  if (bodyLinesWrapped.at(-1) === "") {
    bodyLinesWrapped.pop();
  }

  const lineHeight = 38;
  const startY = bodyTop + Math.max(12, (bodyHeight - bodyLinesWrapped.length * lineHeight) / 2);
  context.fillStyle = note.textColor ?? "#1C1C19";
  context.font = "italic 32px Newsreader";
  cursorY = startY;
  for (const wrapped of bodyLinesWrapped) {
    context.fillText(wrapped || " ", width / 2, cursorY);
    cursorY += lineHeight;
  }

  context.strokeStyle = "rgba(223,192,184,0.34)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(innerX, footerTop);
  context.lineTo(width - innerX, footerTop);
  context.stroke();

  drawRoundedRect(context, innerX, footerTop + 24, 90, 90, 24);
  context.fillStyle = "#FCF9F4";
  context.shadowColor = "rgba(28,28,25,0.08)";
  context.shadowBlur = 20;
  context.shadowOffsetY = 10;
  context.fill();
  context.shadowColor = "transparent";

  context.fillStyle = "#A33818";
  context.font = "600 38px Georgia";
  context.fillText("☁", innerX + 45, footerTop + 82);

  context.fillStyle = "rgba(196,118,95,0.92)";
  context.font = "500 28px Manrope";
  context.fillText(authorLine, innerX + 180, footerTop + 72);

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

