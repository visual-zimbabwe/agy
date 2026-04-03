"use client";

import { useMemo } from "react";

import type { Link, Note, Zone } from "@/features/wall/types";
import {
  createWallRenderBudget,
  getAdaptiveWallOverscanWorldPx,
  createViewportWallBounds,
  filterLinksToVisibleNoteIds,
  filterNotesToWallBounds,
  filterZonesToWallBounds,
  prioritizeNotesForRender,
} from "@/features/wall/windowing";

type UseWallViewportWindowOptions = {
  notes: Note[];
  zones: Zone[];
  links: Link[];
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
  overscanWorldPx?: number;
  enabled?: boolean;
  priorityNoteIds?: string[];
};

export const useWallViewportWindow = ({
  notes,
  zones,
  links,
  camera,
  viewport,
  overscanWorldPx = 320,
  enabled = true,
  priorityNoteIds = [],
}: UseWallViewportWindowOptions) => {
  const baseOverscanWorldPx = useMemo(
    () => getAdaptiveWallOverscanWorldPx(camera.zoom, overscanWorldPx),
    [camera.zoom, overscanWorldPx],
  );
  const preliminaryBounds = useMemo(
    () => createViewportWallBounds(camera, viewport, baseOverscanWorldPx),
    [baseOverscanWorldPx, camera, viewport],
  );
  const preliminaryVisibleNotes = useMemo(
    () => (enabled ? filterNotesToWallBounds(notes, preliminaryBounds) : notes),
    [enabled, notes, preliminaryBounds],
  );
  const preliminaryBudget = useMemo(
    () =>
      createWallRenderBudget({
        cameraZoom: camera.zoom,
        visibleNoteCount: preliminaryVisibleNotes.length,
        defaultOverscanWorldPx: baseOverscanWorldPx,
      }),
    [baseOverscanWorldPx, camera.zoom, preliminaryVisibleNotes.length],
  );
  const bounds = useMemo(
    () => createViewportWallBounds(camera, viewport, preliminaryBudget.overscanWorldPx),
    [camera, preliminaryBudget.overscanWorldPx, viewport],
  );
  const candidateVisibleNotes = useMemo(
    () => (enabled ? filterNotesToWallBounds(notes, bounds) : notes),
    [bounds, enabled, notes],
  );
  const renderBudget = useMemo(
    () =>
      createWallRenderBudget({
        cameraZoom: camera.zoom,
        visibleNoteCount: candidateVisibleNotes.length,
        defaultOverscanWorldPx: preliminaryBudget.overscanWorldPx,
      }),
    [camera.zoom, candidateVisibleNotes.length, preliminaryBudget.overscanWorldPx],
  );
  const visibleNotes = useMemo(
    () => prioritizeNotesForRender(candidateVisibleNotes, bounds, renderBudget.maxRenderedNotes, priorityNoteIds),
    [bounds, candidateVisibleNotes, priorityNoteIds, renderBudget.maxRenderedNotes],
  );
  const visibleNoteIdSet = useMemo(() => new Set(visibleNotes.map((note) => note.id)), [visibleNotes]);
  const visibleZones = useMemo(
    () => (enabled ? filterZonesToWallBounds(zones, bounds) : zones),
    [bounds, enabled, zones],
  );
  const visibleLinks = useMemo(
    () => (enabled ? filterLinksToVisibleNoteIds(links, visibleNoteIdSet) : links),
    [enabled, links, visibleNoteIdSet],
  );

  return {
    bounds,
    visibleNotes,
    visibleZones,
    visibleLinks,
    renderDetailLevel: renderBudget.detailLevel,
    renderBudget,
  };
};
