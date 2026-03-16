"use client";

import { useCallback } from "react";

import type { Note, Zone } from "@/features/wall/types";

type Bounds = { x: number; y: number; w: number; h: number };
type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };

type UseWallCameraNavigationOptions = {
  camera: Camera;
  viewport: Viewport;
  notesById: Record<string, Note>;
  visibleNotes: Note[];
  visibleZones: Zone[];
  selectedNotes: Note[];
  setFlashNote: (noteId?: string) => void;
  syncPrimarySelection: (ids: string[]) => void;
  computeContentBounds: (notes: Note[], zones: Zone[]) => Bounds | null;
  fitBoundsCamera: (bounds: Bounds, viewport: Viewport, padding?: number) => Camera;
  animateCamera: (camera: Camera, options?: { durationMs?: number; onComplete?: () => void }) => void;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useWallCameraNavigation = ({
  camera,
  viewport,
  notesById,
  visibleNotes,
  visibleZones,
  selectedNotes,
  setFlashNote,
  syncPrimarySelection,
  computeContentBounds,
  fitBoundsCamera,
  animateCamera,
}: UseWallCameraNavigationOptions) => {
  const zoomToFit = useCallback(() => {
    const bounds = computeContentBounds(visibleNotes, visibleZones);
    if (!bounds) {
      animateCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    animateCamera(fitBoundsCamera(bounds, viewport, 96));
  }, [animateCamera, computeContentBounds, fitBoundsCamera, viewport, visibleNotes, visibleZones]);

  const focusBounds = useCallback(
    (bounds: Bounds) => {
      animateCamera(fitBoundsCamera(bounds, viewport, 88));
    },
    [animateCamera, fitBoundsCamera, viewport],
  );

  const zoomToSelection = useCallback(() => {
    const bounds = computeContentBounds(selectedNotes, []);
    if (!bounds) {
      return;
    }

    animateCamera(fitBoundsCamera(bounds, viewport, 88));
  }, [animateCamera, computeContentBounds, fitBoundsCamera, selectedNotes, viewport]);

  const focusNote = useCallback(
    (noteId: string) => {
      const note = notesById[noteId];
      if (!note) {
        return;
      }

      const left = note.x * camera.zoom + camera.x;
      const top = note.y * camera.zoom + camera.y;
      const right = left + note.w * camera.zoom;
      const bottom = top + note.h * camera.zoom;
      const margin = 72;
      const fullyVisible = left >= margin && top >= margin && right <= viewport.w - margin && bottom <= viewport.h - margin;
      const fitted = fitBoundsCamera(
        {
          x: note.x - 120,
          y: note.y - 96,
          w: note.w + 240,
          h: note.h + 192,
        },
        viewport,
        48,
      );
      const zoom = fullyVisible ? clamp(Math.max(camera.zoom, 1), 0.7, 1.6) : clamp(fitted.zoom, 0.75, 1.25);
      animateCamera(
        {
          zoom,
          x: viewport.w / 2 - (note.x + note.w / 2) * zoom,
          y: viewport.h / 2 - (note.y + note.h / 2) * zoom,
        },
        { durationMs: 240 },
      );
      syncPrimarySelection([noteId]);
      setFlashNote(noteId);
    },
    [animateCamera, camera.x, camera.y, camera.zoom, fitBoundsCamera, notesById, setFlashNote, syncPrimarySelection, viewport],
  );

  const jumpToStaleNote = useCallback(() => {
    if (visibleNotes.length === 0) {
      return;
    }
    const stale = [...visibleNotes].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (stale) {
      focusNote(stale.id);
    }
  }, [focusNote, visibleNotes]);

  const jumpToHighPriorityNote = useCallback(() => {
    const priorityTags = new Set(["high", "priority", "urgent", "p0", "critical"]);
    const candidates = visibleNotes.filter((note) => note.tags.some((tag) => priorityTags.has(tag.toLowerCase())));
    if (candidates.length === 0) {
      return;
    }
    const chosen = [...candidates].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (chosen) {
      focusNote(chosen.id);
    }
  }, [focusNote, visibleNotes]);

  return {
    zoomToFit,
    zoomToSelection,
    focusBounds,
    focusNote,
    jumpToStaleNote,
    jumpToHighPriorityNote,
  };
};
