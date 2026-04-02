"use client";

import { useMemo } from "react";

import type { Link, Note, Zone } from "@/features/wall/types";
import {
  getAdaptiveWallOverscanWorldPx,
  getWallRenderDetailLevel,
  createViewportWallBounds,
  filterLinksToVisibleNoteIds,
  filterNotesToWallBounds,
  filterZonesToWallBounds,
} from "@/features/wall/windowing";

type UseWallViewportWindowOptions = {
  notes: Note[];
  zones: Zone[];
  links: Link[];
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
  overscanWorldPx?: number;
  enabled?: boolean;
};

export const useWallViewportWindow = ({
  notes,
  zones,
  links,
  camera,
  viewport,
  overscanWorldPx = 320,
  enabled = true,
}: UseWallViewportWindowOptions) => {
  const resolvedOverscanWorldPx = useMemo(
    () => getAdaptiveWallOverscanWorldPx(camera.zoom, overscanWorldPx),
    [camera.zoom, overscanWorldPx],
  );
  const bounds = useMemo(
    () => createViewportWallBounds(camera, viewport, resolvedOverscanWorldPx),
    [camera, resolvedOverscanWorldPx, viewport],
  );

  const visibleNotes = useMemo(
    () => (enabled ? filterNotesToWallBounds(notes, bounds) : notes),
    [bounds, enabled, notes],
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
  const renderDetailLevel = useMemo(
    () => getWallRenderDetailLevel(camera.zoom, visibleNotes.length),
    [camera.zoom, visibleNotes.length],
  );

  return {
    bounds,
    visibleNotes,
    visibleZones,
    visibleLinks,
    renderDetailLevel,
  };
};
