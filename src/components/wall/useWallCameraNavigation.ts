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
  setCamera: (camera: Camera) => void;
  setFlashNote: (noteId?: string) => void;
  syncPrimarySelection: (ids: string[]) => void;
  computeContentBounds: (notes: Note[], zones: Zone[]) => Bounds | null;
  fitBoundsCamera: (bounds: Bounds, viewport: Viewport) => Camera;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useWallCameraNavigation = ({
  camera,
  viewport,
  notesById,
  visibleNotes,
  visibleZones,
  setCamera,
  setFlashNote,
  syncPrimarySelection,
  computeContentBounds,
  fitBoundsCamera,
}: UseWallCameraNavigationOptions) => {
  const resetView = useCallback(() => {
    const bounds = computeContentBounds(visibleNotes, visibleZones);
    if (!bounds) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    setCamera({
      zoom: 1,
      x: viewport.w / 2 - centerX,
      y: viewport.h / 2 - centerY,
    });
  }, [computeContentBounds, setCamera, viewport.h, viewport.w, visibleNotes, visibleZones]);

  const focusBounds = useCallback(
    (bounds: Bounds) => {
      setCamera(fitBoundsCamera(bounds, viewport));
    },
    [fitBoundsCamera, setCamera, viewport],
  );

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
      );
      const zoom = fullyVisible ? clamp(Math.max(camera.zoom, 1), 0.7, 1.6) : clamp(fitted.zoom, 0.75, 1.25);
      setCamera({
        zoom,
        x: viewport.w / 2 - (note.x + note.w / 2) * zoom,
        y: viewport.h / 2 - (note.y + note.h / 2) * zoom,
      });
      syncPrimarySelection([noteId]);
      setFlashNote(noteId);
    },
    [camera.x, camera.y, camera.zoom, fitBoundsCamera, notesById, setCamera, setFlashNote, syncPrimarySelection, viewport],
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
    resetView,
    focusBounds,
    focusNote,
    jumpToStaleNote,
    jumpToHighPriorityNote,
  };
};
